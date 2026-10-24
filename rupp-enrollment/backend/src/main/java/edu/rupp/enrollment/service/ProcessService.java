package edu.rupp.enrollment.service;

import static edu.rupp.enrollment.model.Enums.AppStatus.*;

import edu.rupp.enrollment.dto.Dto.*;
import edu.rupp.enrollment.model.*;
import edu.rupp.enrollment.model.Enums.AttemptStatus;
import edu.rupp.enrollment.model.Enums.Decision;
import edu.rupp.enrollment.model.Enums.QuestionType;
import edu.rupp.enrollment.repo.Repos.*;
import edu.rupp.enrollment.web.ApiException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Application review, exam scheduling/monitoring, grading and admission decisions. */
@Service
@RequiredArgsConstructor
@Transactional
public class ProcessService {
    private final ApplicationRepo apps;
    private final ProfileRepo profiles;
    private final ExamRepo exams;
    private final ScheduleRepo schedules;
    private final AttemptRepo attempts;
    private final AnswerRepo answers;
    private final MajorRepo majors;
    private final DocumentRepo docs;
    private final NotificationService notes;

    // ---------- applications
    public List<Application> applications(String status, Long majorId) {
        return apps.findAll().stream()
                .filter(a -> status == null || status.isBlank() || a.getStatus().name().equals(status))
                .filter(a -> majorId == null || a.getMajor().getId().equals(majorId))
                .filter(a -> a.getStatus() != DRAFT)
                .sorted(Comparator.comparing(Application::getId).reversed())
                .toList();
    }

    public Map<String, Object> applicationDetail(Long id) {
        Application a = app(id);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("application", a);
        out.put("profile", profiles.findByUser(a.getStudent()).orElse(null));
        return out;
    }

    public ApplicationDocument document(Long id) {
        return docs.findById(id).orElseThrow(() -> ApiException.notFound("Document not found"));
    }

    public Application review(Long id, ReviewReq r) {
        Application a = app(id);
        if (a.getStatus() != PENDING_REVIEW) throw ApiException.bad("Only applications pending review can be reviewed");
        String d = r.decision() == null ? "" : r.decision().toUpperCase();
        if (d.equals("ELIGIBLE")) {
            a.setStatus(ELIGIBLE);
            a.setOfficerNote(r.note());
            notes.notify(a.getStudent(), "Application accepted for examination",
                    "Your application is eligible. You will receive your examination schedule soon.");
        } else if (d.equals("INCOMPLETE")) {
            if (r.note() == null || r.note().isBlank()) throw ApiException.bad("Please tell the applicant what must be corrected");
            a.setStatus(INCOMPLETE);
            a.setOfficerNote(r.note());
            notes.notify(a.getStudent(), "Application needs corrections", r.note());
        } else {
            throw ApiException.bad("Decision must be ELIGIBLE or INCOMPLETE");
        }
        return apps.save(a);
    }

    // ---------- schedules
    public List<ExamSchedule> schedules() {
        return schedules.findAll().stream().sorted(Comparator.comparing(ExamSchedule::getId).reversed()).toList();
    }

    public ExamSchedule createSchedule(ScheduleReq r) {
        Exam e = exams.findById(r.examId() == null ? -1L : r.examId()).orElseThrow(() -> ApiException.bad("Choose an exam"));
        if (r.startTime() == null || r.endTime() == null || !r.endTime().isAfter(r.startTime()))
            throw ApiException.bad("End time must be after start time");
        if (e.getTotalMarks() <= 0) throw ApiException.bad("Add questions to this exam before scheduling it");
        if (r.applicationIds() == null || r.applicationIds().isEmpty()) throw ApiException.bad("Select at least one applicant");
        List<Application> list = apps.findAllById(r.applicationIds());
        for (Application a : list) {
            if (a.getStatus() != ELIGIBLE)
                throw ApiException.bad(a.getStudent().getFullName() + " is not in the eligible state");
            if (!a.getMajor().getId().equals(e.getMajor().getId()))
                throw ApiException.bad(a.getStudent().getFullName() + " applied to a different major than this exam");
        }
        ExamSchedule s = new ExamSchedule();
        s.setExam(e);
        s.setStartTime(r.startTime());
        s.setEndTime(r.endTime());
        s.setApplications(new ArrayList<>(list));
        s = schedules.save(s);
        String when = r.startTime().format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm"));
        for (Application a : list) {
            a.setStatus(EXAM_SCHEDULED);
            notes.notify(a.getStudent(), "Examination scheduled",
                    e.getTitle() + " opens on " + when + " (" + e.getDurationMinutes() + " minutes).");
        }
        apps.saveAll(list);
        return s;
    }

    public List<Map<String, Object>> monitor(Long scheduleId) {
        ExamSchedule s = schedules.findById(scheduleId).orElseThrow(() -> ApiException.notFound("Schedule not found"));
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Application a : s.getApplications()) {
            ExamAttempt t = attempts.findByApplicationIdAndScheduleId(a.getId(), s.getId()).orElse(null);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("applicationId", a.getId());
            m.put("studentName", a.getStudent().getFullName());
            m.put("attemptId", t == null ? null : t.getId());
            m.put("attemptStatus", t == null ? "NOT_STARTED" : t.getStatus().name());
            m.put("startedAt", t == null ? null : t.getStartedAt());
            m.put("submittedAt", t == null ? null : t.getSubmittedAt());
            rows.add(m);
        }
        return rows;
    }

    // ---------- grading
    public List<ExamAttempt> attempts(String status) {
        return attempts.findAll().stream()
                .filter(t -> status == null || status.isBlank() || t.getStatus().name().equals(status))
                .sorted(Comparator.comparing(ExamAttempt::getId).reversed())
                .toList();
    }

    public Map<String, Object> attemptDetail(Long id) {
        ExamAttempt t = attempt(id);
        List<Map<String, Object>> rows = answers.findByAttemptId(id).stream().map(a -> {
            Question q = a.getQuestion();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("answerId", a.getId());
            m.put("subject", q.getSubject());
            m.put("content", q.getContent());
            m.put("questionType", q.getQuestionType());
            m.put("options", q.getOptions());
            m.put("correctIndex", q.getCorrectIndex());
            m.put("maxMarks", q.getMarks());
            m.put("selectedIndex", a.getSelectedIndex());
            m.put("writtenText", a.getWrittenText());
            m.put("awardedMarks", a.getAwardedMarks());
            return m;
        }).toList();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("attempt", t);
        out.put("totalMarks", t.getSchedule().getExam().getTotalMarks());
        out.put("answers", rows);
        return out;
    }

    public ExamAttempt grade(Long id, GradeReq r) {
        ExamAttempt t = attempt(id);
        if (t.getStatus() == AttemptStatus.IN_PROGRESS) throw ApiException.bad("The applicant is still taking this exam");
        List<Answer> list = answers.findByAttemptId(id);
        Map<Long, Answer> byId = list.stream().collect(Collectors.toMap(Answer::getId, x -> x));
        if (r.marks() != null) {
            for (MarkReq m : r.marks()) {
                Answer a = byId.get(m.answerId());
                if (a == null || a.getQuestion().getQuestionType() != QuestionType.WRITTEN || m.marks() == null) continue;
                a.setAwardedMarks(Math.max(0, Math.min(a.getQuestion().getMarks(), m.marks())));
            }
            answers.saveAll(list);
        }
        List<Answer> written = list.stream().filter(a -> a.getQuestion().getQuestionType() == QuestionType.WRITTEN).toList();
        double manual = written.stream().mapToDouble(a -> a.getAwardedMarks() == null ? 0 : a.getAwardedMarks()).sum();
        boolean complete = written.stream().allMatch(a -> a.getAwardedMarks() != null);
        t.setManualScore(manual);
        if (complete) {
            t.setTotalScore(t.getAutoScore() + manual);
            t.setStatus(AttemptStatus.GRADED);
        }
        return attempts.save(t);
    }

    // ---------- admission
    public Map<String, Object> admissionBoard(Long majorId) {
        Major m = majors.findById(majorId).orElseThrow(() -> ApiException.notFound("Major not found"));
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Application a : apps.findByMajorId(majorId)) {
            if (!EnumSet.of(EXAM_SCHEDULED, EXAM_COMPLETED, RESULT_PUBLISHED).contains(a.getStatus())) continue;
            ExamAttempt t = attempts.findFirstByApplicationIdOrderByIdDesc(a.getId()).orElse(null);
            StudentProfile p = profiles.findByUser(a.getStudent()).orElse(null);
            boolean graded = t != null && t.getStatus() == AttemptStatus.GRADED;
            double pct = graded ? percent(t) : 0;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("applicationId", a.getId());
            row.put("studentName", a.getStudent().getFullName());
            row.put("email", a.getStudent().getEmail());
            row.put("status", a.getStatus());
            row.put("attemptStatus", t == null ? "NOT_TAKEN" : t.getStatus().name());
            row.put("score", graded ? t.getTotalScore() : null);
            row.put("percent", graded ? pct : null);
            row.put("examPassed", graded ? pct >= t.getSchedule().getExam().getPassPercent() : null);
            row.put("highSchoolGrade", p == null ? null : p.getHighSchoolGrade());
            row.put("gradeOk", p != null && p.getHighSchoolGrade() != null && p.getHighSchoolGrade() >= m.getMinGrade());
            row.put("decision", a.getAdmissionDecision());
            row.put("published", a.isResultPublished());
            rows.add(row);
        }
        rows.sort((x, y) -> Double.compare(num(y.get("percent")), num(x.get("percent"))));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("major", m);
        out.put("rows", rows);
        return out;
    }

    /** Ranks graded, unpublished applicants: passers fill the seats (ADMITTED), remaining passers are PENDING (waitlist). */
    public Map<String, Object> evaluate(Long majorId) {
        Major m = majors.findById(majorId).orElseThrow(() -> ApiException.notFound("Major not found"));
        List<Application> all = apps.findByMajorId(majorId);
        long taken = all.stream().filter(a -> a.isResultPublished() && a.getAdmissionDecision() == Decision.ADMITTED).count();
        int seatsLeft = (int) Math.max(0, m.getSeats() - taken);

        record Cand(Application a, double pct) {}
        List<Cand> passers = new ArrayList<>();
        int rejected = 0, skipped = 0;
        for (Application a : all) {
            if (a.getStatus() != EXAM_COMPLETED) continue;
            ExamAttempt t = attempts.findFirstByApplicationIdOrderByIdDesc(a.getId()).orElse(null);
            if (t == null || t.getStatus() != AttemptStatus.GRADED) { skipped++; continue; }
            double pct = percent(t);
            StudentProfile p = profiles.findByUser(a.getStudent()).orElse(null);
            boolean examOk = pct >= t.getSchedule().getExam().getPassPercent();
            boolean gradeOk = p != null && p.getHighSchoolGrade() != null && p.getHighSchoolGrade() >= m.getMinGrade();
            if (examOk && gradeOk) passers.add(new Cand(a, pct));
            else { a.setAdmissionDecision(Decision.NOT_ADMITTED); rejected++; }
        }
        passers.sort((x, y) -> Double.compare(y.pct(), x.pct()));
        int admitted = 0, pending = 0;
        for (Cand c : passers) {
            if (seatsLeft > 0) { c.a().setAdmissionDecision(Decision.ADMITTED); seatsLeft--; admitted++; }
            else { c.a().setAdmissionDecision(Decision.PENDING); pending++; }
        }
        apps.saveAll(all);
        return Map.of("admitted", admitted, "pending", pending, "notAdmitted", rejected, "skippedUngraded", skipped);
    }

    public Application decide(Long appId, DecisionReq r) {
        Application a = app(appId);
        if (a.isResultPublished()) throw ApiException.bad("Result already published");
        if (a.getStatus() != EXAM_COMPLETED) throw ApiException.bad("The applicant has not completed the examination");
        try {
            a.setAdmissionDecision(Decision.valueOf(String.valueOf(r.decision()).toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw ApiException.bad("Decision must be ADMITTED, PENDING or NOT_ADMITTED");
        }
        return apps.save(a);
    }

    public Map<String, Object> publish(Long majorId) {
        Major m = majors.findById(majorId).orElseThrow(() -> ApiException.notFound("Major not found"));
        int count = 0;
        for (Application a : apps.findByMajorId(majorId)) {
            if (a.getAdmissionDecision() == null || a.isResultPublished()) continue;
            a.setResultPublished(true);
            a.setStatus(RESULT_PUBLISHED);
            String text = switch (a.getAdmissionDecision()) {
                case ADMITTED -> "Congratulations! You have been admitted to " + m.getName() + ".";
                case PENDING -> "You are on the waiting list for " + m.getName() + ". We will contact you if a seat becomes available.";
                case NOT_ADMITTED -> "We are sorry, you were not admitted to " + m.getName() + " this time.";
            };
            notes.notify(a.getStudent(), "Admission result published", text);
            apps.save(a);
            count++;
        }
        return Map.of("published", count);
    }

    // ---------- helpers
    public static double percent(ExamAttempt t) {
        double total = t.getSchedule().getExam().getTotalMarks();
        return total == 0 ? 0 : Math.round(t.getTotalScore() / total * 1000) / 10.0;
    }

    private static double num(Object o) { return o instanceof Number n ? n.doubleValue() : -1; }

    private Application app(Long id) {
        return apps.findById(id).orElseThrow(() -> ApiException.notFound("Application not found"));
    }

    private ExamAttempt attempt(Long id) {
        return attempts.findById(id).orElseThrow(() -> ApiException.notFound("Attempt not found"));
    }
}
