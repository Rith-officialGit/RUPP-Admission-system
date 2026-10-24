package edu.rupp.enrollment.service;

import edu.rupp.enrollment.model.Notification;
import edu.rupp.enrollment.model.User;
import edu.rupp.enrollment.repo.Repos.NotificationRepo;
import edu.rupp.enrollment.web.ApiException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {
    private final NotificationRepo repo;

    public void notify(User user, String title, String message) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(message);
        repo.save(n);
    }

    public List<Notification> list(User user) {
        return repo.findByUserOrderByIdDesc(user);
    }

    public void markRead(User user, Long id) {
        Notification n = repo.findById(id).orElseThrow(() -> ApiException.notFound("Notification not found"));
        if (!n.getUser().getId().equals(user.getId())) throw ApiException.notFound("Notification not found");
        n.setSeen(true);
        repo.save(n);
    }
}
