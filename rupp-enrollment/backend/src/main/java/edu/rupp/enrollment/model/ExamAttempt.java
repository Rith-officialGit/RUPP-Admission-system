package edu.rupp.enrollment.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import edu.rupp.enrollment.model.Enums.AttemptStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "exam_attempts")
@Getter @Setter
public class ExamAttempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    private Application application;
    @ManyToOne(optional = false)
    private ExamSchedule schedule;
    private LocalDateTime startedAt;
    private LocalDateTime deadline;
    private LocalDateTime submittedAt;
    @Enumerated(EnumType.STRING)
    private AttemptStatus status = AttemptStatus.IN_PROGRESS;
    private double autoScore;
    private double manualScore;
    private double totalScore;
    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Answer> answers = new ArrayList<>();
}
