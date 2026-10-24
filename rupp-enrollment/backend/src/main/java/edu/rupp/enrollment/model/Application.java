package edu.rupp.enrollment.model;

import edu.rupp.enrollment.model.Enums.AppStatus;
import edu.rupp.enrollment.model.Enums.Decision;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "applications")
@Getter @Setter
public class Application {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    private User student;
    @ManyToOne(optional = false)
    private Major major;
    @Column(length = 3000)
    private String statement;
    @Enumerated(EnumType.STRING)
    private AppStatus status = AppStatus.DRAFT;
    @Column(length = 1000)
    private String officerNote;
    @Enumerated(EnumType.STRING)
    private Decision admissionDecision;
    private boolean resultPublished;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime submittedAt;
    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ApplicationDocument> documents = new ArrayList<>();
}
