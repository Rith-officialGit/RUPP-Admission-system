package edu.rupp.enrollment.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "student_profiles")
@Getter @Setter
public class StudentProfile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(optional = false)
    @JsonIgnore
    private User user;
    private String phone;
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
    private String nationalId;
    private String schoolName;
    private Integer graduationYear;
    /** High-school final grade as a percentage (0-100). */
    private Double highSchoolGrade;
}
