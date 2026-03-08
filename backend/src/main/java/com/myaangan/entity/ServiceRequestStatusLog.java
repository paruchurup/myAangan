package com.myaangan.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.myaangan.enums.ServiceRequestStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name = "service_request_status_log")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceRequestStatusLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @JsonIgnore
    @ManyToOne @JoinColumn(name = "request_id", nullable = false) private ServiceRequest request;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 15) private ServiceRequestStatus fromStatus;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 15) private ServiceRequestStatus toStatus;
    @ManyToOne @JoinColumn(name = "changed_by_id") private User changedBy;
    @Column(length = 300) private String note;
    @CreationTimestamp private LocalDateTime changedAt;
}
