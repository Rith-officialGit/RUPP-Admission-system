package edu.rupp.enrollment.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import edu.rupp.enrollment.model.Enums.QuestionType;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "questions")
@Getter @Setter
public class Question {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    @JsonIgnore
    private Exam exam;
    private String subject;
    @Column(length = 2000, nullable = false)
    private String content;
    @Enumerated(EnumType.STRING)
    private QuestionType questionType = QuestionType.MCQ;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "question_options")
    @Column(length = 500)
    private List<String> options = new ArrayList<>();
    private Integer correctIndex;
    private double marks = 1;
}
