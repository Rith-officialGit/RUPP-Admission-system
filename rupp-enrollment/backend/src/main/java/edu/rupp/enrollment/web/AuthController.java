package edu.rupp.enrollment.web;

import edu.rupp.enrollment.dto.Dto.*;
import edu.rupp.enrollment.model.Faculty;
import edu.rupp.enrollment.model.Major;
import edu.rupp.enrollment.repo.Repos.FacultyRepo;
import edu.rupp.enrollment.repo.Repos.MajorRepo;
import edu.rupp.enrollment.service.AuthService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService auth;
    private final FacultyRepo faculties;
    private final MajorRepo majors;

    @PostMapping("/auth/register")
    public AuthRes register(@Valid @RequestBody RegisterReq r) { return auth.register(r); }

    @PostMapping("/auth/login")
    public AuthRes login(@Valid @RequestBody LoginReq r) { return auth.login(r); }

    @PostMapping("/auth/forgot-password")
    public Map<String, String> forgot(@Valid @RequestBody ForgotReq r) { return auth.forgotPassword(r); }

    @PostMapping("/auth/reset-password")
    public Map<String, String> reset(@Valid @RequestBody ResetReq r) {
        auth.resetPassword(r);
        return Map.of("message", "Password updated. You can now sign in.");
    }

    // ---- public catalogue
    @GetMapping("/public/faculties")
    public List<Faculty> faculties() { return faculties.findAll(); }

    @GetMapping("/public/majors")
    public List<Major> majors() { return majors.findByActiveTrue(); }
}
