package edu.rupp.enrollment.security;

import edu.rupp.enrollment.model.User;
import edu.rupp.enrollment.repo.Repos.UserRepo;
import edu.rupp.enrollment.web.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CurrentUser {
    private final UserRepo users;

    public User get() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        return users.findByEmail(auth.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Unknown user"));
    }
}
