package edu.rupp.enrollment.service;

import static edu.rupp.enrollment.model.Enums.AppStatus.*;

import edu.rupp.enrollment.dto.Dto.*;
import edu.rupp.enrollment.model.*;
import edu.rupp.enrollment.model.Enums.AppStatus;
import edu.rupp.enrollment.model.Enums.AttemptStatus;
import edu.rupp.enrollment.model.Enums.QuestionType;
import edu.rupp.enrollment.repo.Repos.*;
import edu.rupp.enrollment.web.ApiException;
import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional
public class StudentService {
    private static final List<String> REQUIRED_DOCS = List.of("TRANSCRIPT", "ID_CARD", "PHOTO");
    private static final Set<String> DOC_TYPES = Set.of("TRANSCRIPT", "ID_CARD", "PHOTO", "OTHER");

    private final ProfileRepo profiles;
    private final MajorRepo majors;
    private final ApplicationRepo apps;
    private final ScheduleRepo schedules;
    private final AttemptRepo attempts;
    private final QuestionRepo questions;
    private final AnswerRepo answers;
    private final NotificationService notes;

    @Value("${app.upload-dir}")
    private String uploadDir;

    // ---------- profile
    public StudentProfile profile(User u) {
        return profiles.findByUser(u).orElse(null);
    }

    public StudentProfile saveProfile(User u, ProfileReq r) {
        StudentProfile p = profiles.findByUser(u).orElseGet(() -> {
            StudentProfile n = new StudentProfile();
            n.setUser(u);
            return n;
        });
        if (r.highSchoolGrade() != null && (r.highSchoolGrade() < 0 || r.highSchoolGrade() > 100))
            throw ApiException.bad("High-school grade must be between 0 and 100");
        p.setPhone(r.phone());
        p.setDateOfBirth(r.dateOfBirth());
        p.setGender(r.gender());
        p.setAddress(r.address());
        p.setNationalId(r.nationalId());
        p.setSchoolName(r.schoolName());
        p.setGraduationYear(r.graduationYear());
        p.setHighSchoolGrade(r.highSchoolGrade());
        return profiles.save(p);
    }

    // ---------- application
    public Application myApplication(User u) {
        return apps.findFirstByStudentOrderByIdDesc(u).orElse(null);
    }

    private Application requireApp(User u) {
        Application a = myApplication(u);
        if (a == null) throw ApiException.bad("You have not started an application yet");
        return a;
    }

    private boolean editable(Application a) {
        return a.getStatus() == DRAFT || a.getStatus() == INCOMPLETE;
    }

    public Application apply(User u, ApplyReq r) {
        Major m = majors.findById(r.majorId() == null ? -1L : r.majorId())
                .filter(Major::isActive)
                .orElseThrow(() -> ApiException.bad("Please choose a valid major"));
        Application a = myApplication(u);
        if (a == null) {
            a = new Application();
            a.setStudent(u);
        } else if (!editable(a)) {
            throw ApiException.bad("Your application has already been submitted and can no longer be edited");
        }
        a.setMajor(m);
        a.setStatement(r.statement());
        return apps.save(a);
    }

    public Application upload(User u, String docType, MultipartFile file) {
        Application a = requireApp(u);
        if (!editable(a)) throw ApiException.bad("Documents can only be changed while the application is a draft or incomplete");
        String type = docType == null ? "" : docType.toUpperCase();
        if (!DOC_TYPES.contains(type)) throw ApiException.bad("Unknown document type");
        if (file == null || file.isEmpty()) throw ApiException.bad("Please choose a file");
        String original = Paths.get(Objects.requireNonNullElse(file.getOriginalFilename(), "file")).getFileName().toString();
        String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')).toLowerCase() : "";
        if (!List.of(".pdf", ".jpg", ".jpeg", ".png").contains(ext)) throw ApiException.bad("Only PDF, JPG or PNG files are accepted");
        try {
            Path dir = Paths.get(uploadDir, String.valueOf(a.getId())).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            Path target = dir.resolve(UUID.randomUUID() + ext);
            file.transferTo(target);
            if (!"OTHER".equals(type)) a.getDocuments().removeIf(d -> type.equals(d.getDocType()));
            ApplicationDocument d = new ApplicationDocument();
            d.setApplication(a);
            d.setDocType(type);
            d.setFileName(original);
            d.setStoredPath(target.toString());
            a.getDocuments().add(d);
        } catch (IOException e) {
            throw ApiException.bad("Could not store the file");
        }
        return apps.save(a);
    }

    public Application submit(User u) {
        Application a = requireApp(u);
        if (!editable(a)) throw ApiException.bad("Application has already been submitted");
        StudentProfile p = profiles.findByUser(u).orElseThrow(() -> ApiException.bad("Please complete your profile first"));
        if (blank(p.getPhone()) || p.getDateOfBirth() == null || blank(p.getSchoolName()) || p.getHighSchoolGrade() == null)
            throw ApiException.bad("Profile is incomplete: phone, date of birth, school and high-school grade are required");
        Set<String> have = a.getDocuments().stream().map(ApplicationDocument::getDocType).collect(Collectors.toSet());
        List<String> missing = REQUIRED_DOCS.stream().filter(x -> !have.contains(x)).toList();
        if (!missing.isEmpty()) throw ApiException.bad("Missing required documents: " + String.join(", ", missing));
        a.setStatus(PENDING_REVIEW);
        a.setSubmittedAt(LocalDateTime.now());
        a.setOfficerNote(null);
        notes.notify(u, "Application submitted", "Your application is pending review by an admission officer.");
        return apps.save(a);
    }

    private boolean blank(String s) { return s == null || s.isBlank(); }

    // ---------- exam
    public Map<String, Object> examInfo(User u) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("scheduled", false);
        Application a = myApplication(u);
        if (a == null || !EnumSet.of(EXAM_SCHEDULED, EXAM_COMPLETED, RESULT_PUBLISHED).contains(a.getStatus())) return out;
        ExamSchedule s = schedules.findByApplication(a.getId()).stream().findFirst().orElse(null);
        if (s == null) return out;
        Exam e = s.getExam();
        List<Question> qs = questions.findByExamIdOrderByIdAsc(e.getId());
        out.put("scheduled", true);
        out.put("examTitle", e.getTitle());
        out.put("durationMinutes", e.getDurationMinutes());
        out.put("totalMarks", e.getTotalMarks());
        out.put("questionCount", qs.size());
        out.put("subjects", qs.stream().map(Question::getSubject).filter(Objects::nonNull).distinct().toList());
        out.put("startTime", s.getStartTime());
        out.put("endTime", s.getEndTime());
        out.put("attemptStatus", attempts.findByApplicationIdAndScheduleId(a.getId(), s.getId())
                .map(t -> t.getStatus().name()).orElse("NOT_STARTED"));
        return out;
    }

    public Map<String, Object> startExam(User u) {
        Application a = requireApp(u);
        ExamSchedule s = schedules.findByApplication(a.getId()).stream().findFirst()
                .orElseThrow(() -> ApiException.bad("No examination has been scheduled for you"));
        LocalDateTime now = LocalDateTime.now();
        ExamAttempt t = attempts.findByApplicationIdAndScheduleId(a.getId(), s.getId()).orElse(null);
        if (t != null && t.getStatus() != AttemptStatus.IN_PROGRESS) throw ApiException.bad("You have already submitted this examination");
        if (t == null) {
            if (now.isBefore(s.getStartTime())) throw ApiException.bad("The examination has not started yet");
            if (now.isAfter(s.getEndTime())) throw ApiException.bad("The examination window has closed");
            LocalDateTime deadline = now.plusMinutes(s.getExam().getDurationMinutes());
            if (deadline.isAfter(s.getEndTime())) deadline = s.getEndTime();
            t = new ExamAttempt();
            t.setApplication(a);
            t.setSchedule(s);
            t.setStartedAt(now);
            t.setDeadline(deadline);
            t.setStatus(AttemptStatus.IN_PROGRESS);
            t = attempts.save(t);
        }
        List<QuestionView> qs = questions.findByExamIdOrderByIdAsc(s.getExam().getId()).stream()
                .map(q -> new QuestionView(q.getId(), q.getSubject(), q.getContent(), q.getQuestionType(),
                        new ArrayList<>(q.getOptions()), q.getMarks()))
                .toList();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("attemptId", t.getId());
        out.put("title", s.getExam().getTitle());
        out.put("deadline", t.getDeadline());
        out.put("questions", qs);
        return out;
    }

    public Map<String, Object> submitExam(User u, SubmitReq r) {
        Application a = requireApp(u);
        ExamAttempt t = attempts.findFirstByApplicationIdOrderByIdDesc(a.getId())
                .filter(x -> x.getStatus() == AttemptStatus.IN_PROGRESS)
                .orElseThrow(() -> ApiException.bad("There is no examination in progress"));
        LocalDateTime now = LocalDateTime.now();
        boolean late = now.isAfter(t.getDeadline().plusSeconds(60));
        Map<Long, AnswerReq> given = new HashMap<>();
        if (!late && r.answers() != null) for (AnswerReq x : r.answers()) given.put(x.questionId(), x);

        double auto = 0;
        boolean needsManual = false;
        for (Question q : questions.findByExamIdOrderByIdAsc(t.getSchedule().getExam().getId())) {
            AnswerReq g = given.get(q.getId());
            Answer ans = new Answer();
            ans.setAttempt(t);
            ans.setQuestion(q);
            if (q.getQuestionType() == QuestionType.MCQ) {
                Integer sel = g == null ? null : g.selectedIndex();
                double pts = sel != null && sel.equals(q.getCorrectIndex()) ? q.getMarks() : 0;
                ans.setSelectedIndex(sel);
                ans.setAwardedMarks(pts);
                auto += pts;
            } else {
                String txt = g == null || g.writtenText() == null ? "" : g.writtenText().trim();
                ans.setWrittenText(txt);
                if (txt.isEmpty()) ans.setAwardedMarks(0.0);
                else needsManual = true;
            }
            answers.save(ans);
        }
        t.setSubmittedAt(now);
        t.setAutoScore(auto);
        t.setManualScore(0);
        if (needsManual) {
            t.setStatus(AttemptStatus.SUBMITTED);
        } else {
            t.setStatus(AttemptStatus.GRADED);
            t.setTotalScore(auto);
        }
        attempts.save(t);
        a.setStatus(EXAM_COMPLETED);
        apps.save(a);
        notes.notify(u, "Examination submitted", "Your answers were received. Results will be announced after grading and admission review.");
        return Map.of("status", t.getStatus().name(), "late", late);
    }

    // ---------- result
    public Map<String, Object> result(User u) {
        Map<String, Object> out = new LinkedHashMap<>();
        Application a = myApplication(u);
        out.put("published", false);
        if (a == null) return out;
        out.put("applicationStatus", a.getStatus().name());
        if (!a.isResultPublished() || a.getAdmissionDecision() == null) return out;
        out.put("published", true);
        out.put("decision", a.getAdmissionDecision().name());
        out.put("major", a.getMajor().getName());
        out.put("faculty", a.getMajor().getFaculty().getName());
        attempts.findFirstByApplicationIdOrderByIdDesc(a.getId())
                .filter(t -> t.getStatus() == AttemptStatus.GRADED)
                .ifPresent(t -> {
                    double total = t.getSchedule().getExam().getTotalMarks();
                    out.put("score", t.getTotalScore());
                    out.put("totalMarks", total);
                    out.put("percent", total == 0 ? 0 : Math.round(t.getTotalScore() / total * 1000) / 10.0);
                });
        return out;
    }
}
