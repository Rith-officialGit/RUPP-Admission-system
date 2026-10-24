package edu.rupp.enrollment.service;

import edu.rupp.enrollment.dto.Dto.*;
import edu.rupp.enrollment.model.*;
import edu.rupp.enrollment.model.Enums.QuestionType;
import edu.rupp.enrollment.repo.Repos.*;
import edu.rupp.enrollment.web.ApiException;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Faculties, majors, exams and question bank management. */
@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {
    private final FacultyRepo faculties;
    private final MajorRepo majors;
    private final ExamRepo exams;
    private final QuestionRepo questions;
    private final ApplicationRepo apps;

    // ---------- faculties
    public List<Faculty> faculties() { return faculties.findAll(); }

    public Faculty saveFaculty(Long id, FacultyReq r) {
        Faculty f = id == null ? new Faculty() : faculties.findById(id).orElseThrow(() -> ApiException.notFound("Faculty not found"));
        f.setCode(r.code().trim().toUpperCase());
        f.setName(r.name().trim());
        f.setDescription(r.description());
        try {
            return faculties.saveAndFlush(f);
        } catch (Exception e) {
            throw ApiException.bad("Faculty code must be unique");
        }
    }

    public void deleteFaculty(Long id) {
        if (majors.existsByFacultyId(id)) throw ApiException.bad("Remove this faculty's majors first");
        faculties.deleteById(id);
    }

    // ---------- majors
    public List<Major> majors() { return majors.findAll(); }

    public Major saveMajor(Long id, MajorReq r) {
        Major m = id == null ? new Major() : majors.findById(id).orElseThrow(() -> ApiException.notFound("Major not found"));
        Faculty f = faculties.findById(r.facultyId() == null ? -1L : r.facultyId())
                .orElseThrow(() -> ApiException.bad("Please choose a faculty"));
        if (r.seats() != null && r.seats() < 0) throw ApiException.bad("Seats cannot be negative");
        m.setCode(r.code().trim().toUpperCase());
        m.setName(r.name().trim());
        m.setFaculty(f);
        m.setSeats(r.seats() == null ? 0 : r.seats());
        m.setMinGrade(r.minGrade() == null ? 0 : r.minGrade());
        m.setRequirements(r.requirements());
        m.setActive(r.active() == null || r.active());
        try {
            return majors.saveAndFlush(m);
        } catch (Exception e) {
            throw ApiException.bad("Major code must be unique");
        }
    }

    public void deleteMajor(Long id) {
        if (!apps.findByMajorId(id).isEmpty() || !exams.findByMajorId(id).isEmpty())
            throw ApiException.bad("This major already has applications or exams. Deactivate it instead.");
        majors.deleteById(id);
    }

    // ---------- exams
    public List<Exam> exams() { return exams.findAll(); }

    public Exam saveExam(Long id, ExamReq r) {
        Exam e = id == null ? new Exam() : exams.findById(id).orElseThrow(() -> ApiException.notFound("Exam not found"));
        Major m = majors.findById(r.majorId() == null ? -1L : r.majorId())
                .orElseThrow(() -> ApiException.bad("Please assign the exam to a major"));
        if (r.durationMinutes() != null && r.durationMinutes() <= 0) throw ApiException.bad("Duration must be positive");
        if (r.passPercent() != null && (r.passPercent() < 0 || r.passPercent() > 100)) throw ApiException.bad("Pass mark must be 0-100%");
        e.setTitle(r.title().trim());
        e.setDescription(r.description());
        e.setMajor(m);
        if (r.durationMinutes() != null) e.setDurationMinutes(r.durationMinutes());
        if (r.passPercent() != null) e.setPassPercent(r.passPercent());
        return exams.save(e);
    }

    public List<Question> questions(Long examId) { return questions.findByExamIdOrderByIdAsc(examId); }

    public Question addQuestion(Long examId, QuestionReq r) {
        Exam e = exams.findById(examId).orElseThrow(() -> ApiException.notFound("Exam not found"));
        QuestionType type = r.questionType() == null ? QuestionType.MCQ : r.questionType();
        double marks = r.marks() == null ? 1 : r.marks();
        if (marks <= 0) throw ApiException.bad("Marks must be positive");
        Question q = new Question();
        q.setExam(e);
        q.setSubject(r.subject() == null || r.subject().isBlank() ? "General" : r.subject().trim());
        q.setContent(r.content().trim());
        q.setQuestionType(type);
        q.setMarks(marks);
        if (type == QuestionType.MCQ) {
            List<String> opts = r.options() == null ? List.of() : r.options().stream().map(String::trim).filter(s -> !s.isEmpty()).toList();
            if (opts.size() < 2) throw ApiException.bad("Multiple-choice questions need at least 2 options");
            if (r.correctIndex() == null || r.correctIndex() < 0 || r.correctIndex() >= opts.size())
                throw ApiException.bad("Select the correct option");
            q.setOptions(new ArrayList<>(opts));
            q.setCorrectIndex(r.correctIndex());
        }
        q = questions.save(q);
        recalc(e);
        return q;
    }

    public void deleteQuestion(Long id) {
        Question q = questions.findById(id).orElseThrow(() -> ApiException.notFound("Question not found"));
        Exam e = q.getExam();
        questions.delete(q);
        questions.flush();
        recalc(e);
    }

    private void recalc(Exam e) {
        double total = questions.findByExamIdOrderByIdAsc(e.getId()).stream().mapToDouble(Question::getMarks).sum();
        e.setTotalMarks(total);
        exams.save(e);
    }
}
