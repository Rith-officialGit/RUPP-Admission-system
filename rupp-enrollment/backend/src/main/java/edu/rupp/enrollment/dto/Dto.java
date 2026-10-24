package edu.rupp.enrollment.dto;

import edu.rupp.enrollment.model.Enums.QuestionType;
import edu.rupp.enrollment.model.Enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class Dto {
    private Dto() {}

    // ---- auth
    public record RegisterReq(@NotBlank String fullName, @NotBlank @Email String email,
                              @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String password) {}
    public record LoginReq(@NotBlank String email, @NotBlank String password) {}
    public record AuthRes(String token, Long id, String fullName, String email, Role role) {}
    public record ForgotReq(@NotBlank String email) {}
    public record ResetReq(@NotBlank String token,
                           @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String newPassword) {}

    // ---- student
    public record ProfileReq(String phone, LocalDate dateOfBirth, String gender, String address, String nationalId,
                             String schoolName, Integer graduationYear, Double highSchoolGrade) {}
    public record ApplyReq(Long majorId, String statement) {}
    public record AnswerReq(Long questionId, Integer selectedIndex, String writtenText) {}
    public record SubmitReq(List<AnswerReq> answers) {}
    public record QuestionView(Long id, String subject, String content, QuestionType questionType,
                               List<String> options, double marks) {}

    // ---- admin
    public record FacultyReq(@NotBlank String code, @NotBlank String name, String description) {}
    public record MajorReq(@NotBlank String code, @NotBlank String name, Long facultyId, Integer seats,
                           Double minGrade, String requirements, Boolean active) {}
    public record ExamReq(@NotBlank String title, Long majorId, Integer durationMinutes, Double passPercent,
                          String description) {}
    public record QuestionReq(String subject, @NotBlank String content, QuestionType questionType,
                              List<String> options, Integer correctIndex, Double marks) {}
    public record ReviewReq(String decision, String note) {}
    public record ScheduleReq(Long examId, LocalDateTime startTime, LocalDateTime endTime, List<Long> applicationIds) {}
    public record MarkReq(Long answerId, Double marks) {}
    public record GradeReq(List<MarkReq> marks) {}
    public record DecisionReq(String decision) {}
}
