package edu.rupp.enrollment.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "exams")
@Getter @Setter
public class Exam {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String title;
    @Column(length = 1000)
    private String description;
    @ManyToOne(optional = false)
    private Major major;
    private int durationMinutes = 60;
    /** Pass threshold as a percentage of total marks. */
    private double passPercent = 50;
    /** Recalculated whenever questions change. */
    private double totalMarks;
    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Question> questions = new ArrayList<>();
}
