package edu.rupp.enrollment.web;

import edu.rupp.enrollment.dto.Dto.*;
import edu.rupp.enrollment.model.*;
import edu.rupp.enrollment.security.CurrentUser;
import edu.rupp.enrollment.service.NotificationService;
import edu.rupp.enrollment.service.StudentService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentController {
    private final StudentService students;
    private final NotificationService notifications;
    private final CurrentUser current;

    @GetMapping("/profile")
    public StudentProfile profile() { return students.profile(current.get()); }

    @PutMapping("/profile")
    public StudentProfile saveProfile(@RequestBody ProfileReq r) { return students.saveProfile(current.get(), r); }

    @GetMapping("/application")
    public Application application() { return students.myApplication(current.get()); }

    @PostMapping("/application")
    public Application apply(@RequestBody ApplyReq r) { return students.apply(current.get(), r); }

    @PostMapping(value = "/application/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Application upload(@RequestParam String docType, @RequestParam("file") MultipartFile file) {
        return students.upload(current.get(), docType, file);
    }

    @PostMapping("/application/submit")
    public Application submit() { return students.submit(current.get()); }

    @GetMapping("/exam")
    public Map<String, Object> exam() { return students.examInfo(current.get()); }

    @PostMapping("/exam/start")
    public Map<String, Object> start() { return students.startExam(current.get()); }

    @PostMapping("/exam/submit")
    public Map<String, Object> submitExam(@RequestBody SubmitReq r) { return students.submitExam(current.get(), r); }

    @GetMapping("/result")
    public Map<String, Object> result() { return students.result(current.get()); }

    @GetMapping("/notifications")
    public List<Notification> notifications() { return notifications.list(current.get()); }

    @PostMapping("/notifications/{id}/read")
    public Map<String, String> read(@PathVariable Long id) {
        notifications.markRead(current.get(), id);
        return Map.of("status", "ok");
    }
}
