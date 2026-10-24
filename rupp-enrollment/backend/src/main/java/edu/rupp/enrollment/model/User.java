package edu.rupp.enrollment.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import edu.rupp.enrollment.model.Enums.Role;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter @Setter
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String email;
    @JsonIgnore
    private String passwordHash;
    private String fullName;
    @Enumerated(EnumType.STRING)
    private Role role;
    @JsonIgnore
    private String resetToken;
    @JsonIgnore
    private LocalDateTime resetExpiry;
    private LocalDateTime createdAt = LocalDateTime.now();
}
