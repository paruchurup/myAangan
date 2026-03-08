package com.myaangan.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity @Table(name = "event_volunteer_slots")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventVolunteerSlot {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne @JoinColumn(name = "event_id", nullable = false) private Event event;
    @Column(nullable = false, length = 100) private String roleName;   // e.g. "Decoration"
    @Column(length = 300) private String roleDescription;
    @Column(nullable = false) @Builder.Default private Integer maxVolunteers = 5;

    @OneToMany(mappedBy = "slot", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<EventVolunteerSignup> signups;
}
