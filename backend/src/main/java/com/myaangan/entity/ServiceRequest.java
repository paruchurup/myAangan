package com.myaangan.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.myaangan.enums.ServiceCategory;
import com.myaangan.enums.ServiceRequestStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.List;

@Entity @Table(name = "service_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "resident_id", nullable = false)
    private User resident;

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private ServiceCategory category;

    @Column(nullable = false, length = 200) private String title;
    @Column(columnDefinition = "TEXT")      private String description;

    /** Resident's suggested preferred date/time */
    private LocalDateTime preferredDatetime;

    /** FM-confirmed scheduled datetime */
    private LocalDateTime confirmedDatetime;

    /** Staff member assigned by FM */
    @Column(length = 100) private String assignedStaffName;
    @Column(length = 30)  private String assignedStaffContact;

    /** FM internal note */
    @Column(columnDefinition = "TEXT") private String fmNote;

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 15)
    @Builder.Default private ServiceRequestStatus status = ServiceRequestStatus.PENDING;

    @JsonIgnore
    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ServiceRequestPhoto> photos;

    @JsonIgnore
    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ServiceRequestStatusLog> statusLogs;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;
}
