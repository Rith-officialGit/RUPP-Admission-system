package edu.rupp.enrollment.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "majors")
@Getter @Setter
public class Major {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String code;
    @Column(nullable = false)
    private String name;
    @ManyToOne(optional = false)
    private Faculty faculty;
    private int seats;
    /** Minimum high-school grade (%) required to be admitted. */
    private double minGrade;
    @Column(length = 2000)
    private String requirements;
    private boolean active = true;
}
