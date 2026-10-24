package edu.rupp.enrollment.web;

import edu.rupp.enrollment.dto.Dto.*;
import edu.rupp.enrollment.model.*;
import edu.rupp.enrollment.service.AdminService;
import edu.rupp.enrollment.service.ProcessService;
import edu.rupp.enrollment.service.ReportService;
import jakarta.validation.Valid;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService admin;
    private final ProcessService process;
    private final ReportService reports;

    // ---- faculties
    @GetMapping("/faculties") public List<Faculty> faculties() { return admin.faculties(); }
    @PostMapping("/faculties") public Faculty createFaculty(@Valid @RequestBody FacultyReq r) { return admin.saveFaculty(null, r); }
    @PutMapping("/faculties/{id}") public Faculty updateFaculty(@PathVariable Long id, @Valid @RequestBody FacultyReq r) { return admin.saveFaculty(id, r); }
    @DeleteMapping("/faculties/{id}") public Map<String, String> deleteFaculty(@PathVariable Long id) { admin.deleteFaculty(id); return ok(); }

    // ---- majors
    @GetMapping("/majors") public List<Major> majors() { return admin.majors(); }
    @PostMapping("/majors") public Major createMajor(@Valid @RequestBody MajorReq r) { return admin.saveMajor(null, r); }
    @PutMapping("/majors/{id}") public Major updateMajor(@PathVariable Long id, @Valid @RequestBody MajorReq r) { return admin.saveMajor(id, r); }
    @DeleteMapping("/majors/{id}") public Map<String, String> deleteMajor(@PathVariable Long id) { admin.deleteMajor(id); return ok(); }

    // ---- exams & questions
    @GetMapping("/exams") public List<Exam> exams() { return admin.exams(); }
    @PostMapping("/exams") public Exam createExam(@Valid @RequestBody ExamReq r) { return admin.saveExam(null, r); }
    @PutMapping("/exams/{id}") public Exam updateExam(@PathVariable Long id, @Valid @RequestBody ExamReq r) { return admin.saveExam(id, r); }
    @GetMapping("/exams/{id}/questions") public List<Question> questions(@PathVariable Long id) { return admin.questions(id); }
    @PostMapping("/exams/{id}/questions") public Question addQuestion(@PathVariable Long id, @Valid @RequestBody QuestionReq r) { return admin.addQuestion(id, r); }
    @DeleteMapping("/questions/{id}") public Map<String, String> deleteQuestion(@PathVariable Long id) { admin.deleteQuestion(id); return ok(); }

    // ---- applications
    @GetMapping("/applications")
    public List<Application> applications(@RequestParam(required = false) String status, @RequestParam(required = false) Long majorId) {
        return process.applications(status, majorId);
    }
    @GetMapping("/applications/{id}") public Map<String, Object> application(@PathVariable Long id) { return process.applicationDetail(id); }
    @PostMapping("/applications/{id}/review") public Application review(@PathVariable Long id, @RequestBody ReviewReq r) { return process.review(id, r); }

    @GetMapping("/documents/{id}")
    public ResponseEntity<Resource> document(@PathVariable Long id) throws Exception {
        ApplicationDocument d = process.document(id);
        Path p = Paths.get(d.getStoredPath());
        if (!Files.exists(p)) throw ApiException.notFound("File missing on server");
        String type = Files.probeContentType(p);
        return ResponseEntity.ok()
                .contentType(type == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(type))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(d.getFileName()).build().toString())
                .body(new FileSystemResource(p));
    }

    // ---- schedules & monitoring
    @GetMapping("/schedules") public List<ExamSchedule> schedules() { return process.schedules(); }
    @PostMapping("/schedules") public ExamSchedule createSchedule(@RequestBody ScheduleReq r) { return process.createSchedule(r); }
    @GetMapping("/schedules/{id}/monitor") public List<Map<String, Object>> monitor(@PathVariable Long id) { return process.monitor(id); }

    // ---- grading
    @GetMapping("/attempts") public List<ExamAttempt> attempts(@RequestParam(required = false) String status) { return process.attempts(status); }
    @GetMapping("/attempts/{id}") public Map<String, Object> attempt(@PathVariable Long id) { return process.attemptDetail(id); }
    @PostMapping("/attempts/{id}/grade") public ExamAttempt grade(@PathVariable Long id, @RequestBody GradeReq r) { return process.grade(id, r); }

    // ---- admission
    @GetMapping("/admission/{majorId}") public Map<String, Object> board(@PathVariable Long majorId) { return process.admissionBoard(majorId); }
    @PostMapping("/admission/{majorId}/evaluate") public Map<String, Object> evaluate(@PathVariable Long majorId) { return process.evaluate(majorId); }
    @PostMapping("/admission/applications/{id}/decide") public Application decide(@PathVariable Long id, @RequestBody DecisionReq r) { return process.decide(id, r); }
    @PostMapping("/admission/{majorId}/publish") public Map<String, Object> publish(@PathVariable Long majorId) { return process.publish(majorId); }

    // ---- reports
    @GetMapping("/reports/summary") public Map<String, Object> summary() { return reports.summary(); }

    private static Map<String, String> ok() { return Map.of("status", "ok"); }
}
