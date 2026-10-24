package edu.rupp.enrollment.service;

import static edu.rupp.enrollment.model.Enums.AppStatus.*;

import edu.rupp.enrollment.model.*;
import edu.rupp.enrollment.model.Enums.AttemptStatus;
import edu.rupp.enrollment.model.Enums.Decision;
import edu.rupp.enrollment.repo.Repos.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {
    private final ApplicationRepo apps;
    private final AttemptRepo attempts;
    private final MajorRepo majors;
    private final ScheduleRepo schedules;

    public Map<String, Object> summary() {
        List<Application> all = apps.findAll().stream().filter(a -> a.getStatus() != DRAFT).toList();
        List<ExamAttempt> allAttempts = attempts.findAll();
        Map<String, Long> byStatus = all.stream()
                .collect(Collectors.groupingBy(a -> a.getStatus().name(), TreeMap::new, Collectors.counting()));

        List<Map<String, Object>> byMajor = new ArrayList<>();
        for (Major m : majors.findAll()) {
            List<Application> ma = all.stream().filter(a -> a.getMajor().getId().equals(m.getId())).toList();
            List<ExamAttempt> graded = allAttempts.stream()
                    .filter(t -> t.getStatus() == AttemptStatus.GRADED && t.getApplication().getMajor().getId().equals(m.getId()))
                    .toList();
            double avg = graded.stream().mapToDouble(ProcessService::percent).average().orElse(0);
            long passed = graded.stream()
                    .filter(t -> ProcessService.percent(t) >= t.getSchedule().getExam().getPassPercent()).count();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("majorId", m.getId());
            row.put("major", m.getName());
            row.put("faculty", m.getFaculty().getName());
            row.put("seats", m.getSeats());
            row.put("applicants", ma.size());
            row.put("examsGraded", graded.size());
            row.put("avgPercent", Math.round(avg * 10) / 10.0);
            row.put("passRate", graded.isEmpty() ? 0 : Math.round(passed * 1000.0 / graded.size()) / 10.0);
            row.put("admitted", ma.stream().filter(a -> a.getAdmissionDecision() == Decision.ADMITTED).count());
            row.put("waitlisted", ma.stream().filter(a -> a.getAdmissionDecision() == Decision.PENDING).count());
            row.put("notAdmitted", ma.stream().filter(a -> a.getAdmissionDecision() == Decision.NOT_ADMITTED).count());
            byMajor.add(row);
        }

        LocalDateTime now = LocalDateTime.now();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalApplicants", all.size());
        out.put("pendingReview", byStatus.getOrDefault(PENDING_REVIEW.name(), 0L));
        out.put("eligibleUnscheduled", byStatus.getOrDefault(ELIGIBLE.name(), 0L));
        out.put("awaitingGrading", allAttempts.stream().filter(t -> t.getStatus() == AttemptStatus.SUBMITTED).count());
        out.put("upcomingExams", schedules.findAll().stream().filter(s -> s.getEndTime().isAfter(now)).count());
        out.put("admittedTotal", all.stream().filter(a -> a.getAdmissionDecision() == Decision.ADMITTED).count());
        out.put("byStatus", byStatus);
        out.put("byMajor", byMajor);
        return out;
    }
}
