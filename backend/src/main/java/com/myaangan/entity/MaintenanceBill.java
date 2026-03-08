package com.myaangan.entity;

import com.myaangan.enums.BillStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_bills",
       uniqueConstraints = @UniqueConstraint(columnNames = {"flat_key", "bill_year", "bill_month"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MaintenanceBill {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Composite flat identifier: block + '-' + flatNumber (e.g. "A-101"). */
    @Column(name = "flat_key", nullable = false, length = 20)
    private String flatKey;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "resident_id")
    private User resident;   // nullable — flat may have no registered user at bill generation time

    @Column(nullable = false)
    private Integer billYear;

    @Column(nullable = false)
    private Integer billMonth;  // 1–12

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal baseAmount;

    /** Flat penalty — set once when first overdue day is crossed. */
    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal penaltyAmount = BigDecimal.ZERO;

    /** Accrued monthly interest. Recalculated daily by scheduler. */
    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal interestAmount = BigDecimal.ZERO;

    /** baseAmount + penaltyAmount + interestAmount. Recalculated on each update. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private BillStatus status = BillStatus.UNPAID;

    /** Razorpay order ID created when resident initiates payment. */
    @Column(length = 100)
    private String razorpayOrderId;

    /** Set when payment is confirmed via webhook. */
    @Column(length = 100)
    private String razorpayPaymentId;

    @Column(length = 200)
    private String receiptPath;   // path to generated PDF receipt

    @Column(length = 300)
    private String waiverNote;    // reason when admin waives

    @Column(length = 50)
    private String waivedBy;

    private LocalDateTime paidAt;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;
}
