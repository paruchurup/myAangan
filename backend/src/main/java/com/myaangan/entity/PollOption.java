package com.myaangan.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "poll_options")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PollOption {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poll_id", nullable = false)
    private Poll poll;

    @Column(nullable = false, length = 300)
    private String text;

    @Column(nullable = false)
    @Builder.Default
    private int displayOrder = 0;

    // Optional emoji/icon for the option
    @Column(length = 10)
    private String emoji;
}
