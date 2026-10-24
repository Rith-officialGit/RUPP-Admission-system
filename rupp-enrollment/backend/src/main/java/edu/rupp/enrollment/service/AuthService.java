package edu.rupp.enrollment.service;

import edu.rupp.enrollment.dto.Dto.*;
import edu.rupp.enrollment.model.Enums.Role;
import edu.rupp.enrollment.model.User;
import edu.rupp.enrollment.repo.Repos.UserRepo;
import edu.rupp.enrollment.security.JwtService;
import edu.rupp.enrollment.web.ApiException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {
    private final UserRepo users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthRes register(RegisterReq r) {
        String email = r.email().trim().toLowerCase();
        if (users.existsByEmail(email)) throw new ApiException(HttpStatus.CONFLICT, "This email is already registered");
        User u = new User();
        u.setEmail(email);
        u.setFullName(r.fullName().trim());
        u.setPasswordHash(encoder.encode(r.password()));
        u.setRole(Role.STUDENT);
        users.save(u);
        return res(u);
    }

    public AuthRes login(LoginReq r) {
        User u = users.findByEmail(r.email().trim().toLowerCase())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!encoder.matches(r.password(), u.getPasswordHash()))
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        return res(u);
    }

    /** Generates a reset token. Wire an email/SMS provider here; the token is logged for development. */
    public Map<String, String> forgotPassword(ForgotReq r) {
        users.findByEmail(r.email().trim().toLowerCase()).ifPresent(u -> {
            u.setResetToken(UUID.randomUUID().toString());
            u.setResetExpiry(LocalDateTime.now().plusMinutes(30));
            users.save(u);
            log.info("PASSWORD RESET TOKEN for {} -> {}", u.getEmail(), u.getResetToken());
        });
        return Map.of("message", "If that email is registered, a reset link has been sent.");
    }

    public void resetPassword(ResetReq r) {
        User u = users.findByResetToken(r.token())
                .filter(x -> x.getResetExpiry() != null && x.getResetExpiry().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> ApiException.bad("Reset token is invalid or has expired"));
        u.setPasswordHash(encoder.encode(r.newPassword()));
        u.setResetToken(null);
        u.setResetExpiry(null);
        users.save(u);
    }

    private AuthRes res(User u) {
        return new AuthRes(jwt.generate(u), u.getId(), u.getFullName(), u.getEmail(), u.getRole());
    }
}
