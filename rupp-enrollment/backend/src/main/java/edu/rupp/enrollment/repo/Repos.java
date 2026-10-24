package edu.rupp.enrollment.repo;

import edu.rupp.enrollment.model.*;
import edu.rupp.enrollment.model.Enums.AppStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public final class Repos {
    private Repos() {}

    public interface UserRepo extends JpaRepository<User, Long> {
        Optional<User> findByEmail(String email);
        Optional<User> findByResetToken(String token);
        boolean existsByEmail(String email);
    }

    public interface ProfileRepo extends JpaRepository<StudentProfile, Long> {
        Optional<StudentProfile> findByUser(User user);
    }

    public interface FacultyRepo extends JpaRepository<Faculty, Long> {}

    public interface MajorRepo extends JpaRepository<Major, Long> {
        List<Major> findByActiveTrue();
        boolean existsByFacultyId(Long facultyId);
    }

    public interface ApplicationRepo extends JpaRepository<Application, Long> {
        Optional<Application> findFirstByStudentOrderByIdDesc(User student);
        List<Application> findByMajorId(Long majorId);
        List<Application> findByStatus(AppStatus status);
    }

    public interface DocumentRepo extends JpaRepository<ApplicationDocument, Long> {}

    public interface ExamRepo extends JpaRepository<Exam, Long> {
        List<Exam> findByMajorId(Long majorId);
    }

    public interface QuestionRepo extends JpaRepository<Question, Long> {
        List<Question> findByExamIdOrderByIdAsc(Long examId);
    }

    public interface ScheduleRepo extends JpaRepository<ExamSchedule, Long> {
        @Query("select s from ExamSchedule s join s.applications a where a.id = :appId order by s.id desc")
        List<ExamSchedule> findByApplication(@Param("appId") Long appId);
    }

    public interface AttemptRepo extends JpaRepository<ExamAttempt, Long> {
        Optional<ExamAttempt> findByApplicationIdAndScheduleId(Long applicationId, Long scheduleId);
        Optional<ExamAttempt> findFirstByApplicationIdOrderByIdDesc(Long applicationId);
    }

    public interface AnswerRepo extends JpaRepository<Answer, Long> {
        List<Answer> findByAttemptId(Long attemptId);
    }

    public interface NotificationRepo extends JpaRepository<Notification, Long> {
        List<Notification> findByUserOrderByIdDesc(User user);
    }
}
