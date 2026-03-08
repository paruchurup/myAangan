package com.myaangan.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name = "event_volunteer_signups",
    uniqueConstraints = @UniqueConstraint(columnNames = {"slot_id", "resident_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventVolunteerSignup {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne @JoinColumn(name = "slot_id",     nullable = false) private EventVolunteerSlot slot;
    @ManyToOne @JoinColumn(name = "resident_id", nullable = false) private User resident;
    @CreationTimestamp private LocalDateTime signedUpAt;
}
