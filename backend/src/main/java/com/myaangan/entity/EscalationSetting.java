package com.myaangan.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "escalation_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EscalationSetting {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String settingKey;   // "FM_SLA_HOURS", "BM_SLA_HOURS", "BDA_SLA_HOURS"

    @Column(nullable = false)
    private int hours;

    private String description;
}
