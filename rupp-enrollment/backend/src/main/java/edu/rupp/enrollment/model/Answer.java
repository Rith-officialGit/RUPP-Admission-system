package edu.rupp.enrollment.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "answers")
@Getter @Setter
public class Answer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    @JsonIgnore
    private ExamAttempt attempt;
    @ManyToOne(optional = false)
    private Question question;
    private Integer selectedIndex;
    @Column(length = 4000)
    private String writtenText;
    /** Null until graded (written answers only). */
    private Double awardedMarks;
}
