package edu.rupp.enrollment.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "exam_schedules")
@Getter @Setter
public class ExamSchedule {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    private Exam exam;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    @ManyToMany
    @JoinTable(name = "schedule_applications")
    @JsonIgnore
    private List<Application> applications = new ArrayList<>();

    @JsonProperty("applicantCount")
    public int applicantCount() {
        return applications.size();
    }
}
