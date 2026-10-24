package edu.rupp.enrollment.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "application_documents")
@Getter @Setter
public class ApplicationDocument {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    @JsonIgnore
    private Application application;
    /** TRANSCRIPT, ID_CARD, PHOTO or OTHER */
    private String docType;
    private String fileName;
    @JsonIgnore
    private String storedPath;
}
