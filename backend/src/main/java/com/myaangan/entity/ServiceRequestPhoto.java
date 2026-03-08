package com.myaangan.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name = "service_request_photos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceRequestPhoto {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @JsonIgnore
    @ManyToOne @JoinColumn(name = "request_id", nullable = false) private ServiceRequest request;
    @Column(nullable = false, length = 300) private String photoPath;
    @CreationTimestamp private LocalDateTime uploadedAt;
}
