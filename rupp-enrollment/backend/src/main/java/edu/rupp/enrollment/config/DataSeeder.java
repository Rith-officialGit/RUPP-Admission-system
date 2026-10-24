package edu.rupp.enrollment.config;

import edu.rupp.enrollment.dto.Dto.*;
import edu.rupp.enrollment.model.*;
import edu.rupp.enrollment.model.Enums.QuestionType;
import edu.rupp.enrollment.model.Enums.Role;
import edu.rupp.enrollment.repo.Repos.UserRepo;
import edu.rupp.enrollment.service.AdminService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Seeds demo accounts, faculties, majors and sample exams on first start (empty database only). */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final UserRepo users;
    private final PasswordEncoder encoder;
    private final AdminService admin;

    @Override
    public void run(String... args) {
        if (users.count() > 0) return;

        user("Admin RUPP", "admin@rupp.edu.kh", "Admin@123", Role.ADMIN);
        user("Admission Officer", "officer@rupp.edu.kh", "Officer@123", Role.OFFICER);
        user("Demo Student", "student@rupp.edu.kh", "Student@123", Role.STUDENT);

        Faculty sci = admin.saveFaculty(null, new FacultyReq("FS", "Faculty of Science", "Computing, mathematics and natural sciences"));
        Faculty eng = admin.saveFaculty(null, new FacultyReq("FE", "Faculty of Engineering", "Engineering and technology programs"));
        Faculty biz = admin.saveFaculty(null, new FacultyReq("FB", "Faculty of Business", "Business, management and economics"));

        Major cs = admin.saveMajor(null, new MajorRequest("CS", "Computer Science", sci.getId(), 60, 60.0, "High-school diploma; strong mathematics").toReq());
        Major en = admin.saveMajor(null, new MajorRequest("ENG", "Engineering", eng.getId(), 50, 60.0, "High-school diploma; mathematics and physics").toReq());
        Major bz = admin.saveMajor(null, new MajorRequest("BUS", "Business Administration", biz.getId(), 80, 55.0, "High-school diploma; mathematics and English").toReq());

        // Computer Science: programming, logic, mathematics
        Exam e1 = admin.saveExam(null, new ExamReq("CS Entrance Examination", cs.getId(), 60, 50.0, "Programming, logic and mathematics"));
        mcq(e1, "Mathematics", "What is the derivative of x^2?", List.of("x", "2x", "x^2", "2"), 1, 2);
        mcq(e1, "Mathematics", "What is the value of 2^10?", List.of("512", "1000", "1024", "2048"), 2, 2);
        mcq(e1, "Logic", "If all A are B and all B are C, then all A are:", List.of("C", "not C", "B only", "Unknown"), 0, 2);
        mcq(e1, "Programming", "Which data structure works on a LIFO principle?", List.of("Queue", "Stack", "Tree", "Graph"), 1, 2);
        mcq(e1, "Programming", "What is the time complexity of binary search?", List.of("O(n)", "O(n log n)", "O(log n)", "O(1)"), 2, 2);
        written(e1, "Programming", "Write pseudocode that returns the largest number in a list.", 5);

        // Engineering: mathematics, physics
        Exam e2 = admin.saveExam(null, new ExamReq("Engineering Entrance Examination", en.getId(), 60, 50.0, "Mathematics and physics"));
        mcq(e2, "Mathematics", "What is the integral of 2x dx?", List.of("x^2 + C", "2x^2 + C", "x + C", "2 + C"), 0, 2);
        mcq(e2, "Mathematics", "sin^2(x) + cos^2(x) equals:", List.of("0", "1", "2", "sin(2x)"), 1, 2);
        mcq(e2, "Physics", "Newton's second law is:", List.of("F = ma", "E = mc^2", "V = IR", "P = mv^2"), 0, 2);
        mcq(e2, "Physics", "The SI unit of force is the:", List.of("Joule", "Watt", "Newton", "Pascal"), 2, 2);
        written(e2, "Physics", "A 2 kg object accelerates at 3 m/s^2. Calculate the net force and show your working.", 4);

        // Business: mathematics, English, business
        Exam e3 = admin.saveExam(null, new ExamReq("Business Entrance Examination", bz.getId(), 45, 50.0, "Mathematics, English and business"));
        mcq(e3, "Mathematics", "What is 15% of 200?", List.of("15", "20", "30", "35"), 2, 2);
        mcq(e3, "English", "Choose the correct sentence.", List.of("She go to school.", "She goes to school.", "She going to school.", "She gone to school."), 1, 2);
        mcq(e3, "Business", "Profit is calculated as:", List.of("Revenue - Costs", "Revenue + Costs", "Costs - Revenue", "Revenue x Costs"), 0, 2);
        mcq(e3, "Business", "Which of these is a fixed cost?", List.of("Raw materials", "Office rent", "Sales commission", "Packaging"), 1, 2);
        written(e3, "English", "In 3-5 sentences, explain why you want to study business.", 4);

        log.info("Seeded demo data. Admin: admin@rupp.edu.kh / Admin@123 | Officer: officer@rupp.edu.kh / Officer@123 | Student: student@rupp.edu.kh / Student@123");
    }

    private void user(String name, String email, String pw, Role role) {
        User u = new User();
        u.setFullName(name);
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(pw));
        u.setRole(role);
        users.save(u);
    }

    private void mcq(Exam e, String subject, String text, List<String> options, int correct, double marks) {
        admin.addQuestion(e.getId(), new QuestionReq(subject, text, QuestionType.MCQ, options, correct, marks));
    }

    private void written(Exam e, String subject, String text, double marks) {
        admin.addQuestion(e.getId(), new QuestionReq(subject, text, QuestionType.WRITTEN, null, null, marks));
    }

    /** Small helper so seed calls read clearly. */
    private record MajorRequest(String code, String name, Long facultyId, int seats, double minGrade, String requirements) {
        MajorReq toReq() { return new MajorReq(code, name, facultyId, seats, minGrade, requirements, true); }
    }
}
