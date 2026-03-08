package com.myaangan.repository;
import com.myaangan.entity.EventContribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface EventContributionRepository extends JpaRepository<EventContribution, Long> {
    List<EventContribution> findByEventIdOrderByCreatedAtDesc(Long eventId);
    List<EventContribution> findByResidentEmailOrderByCreatedAtDesc(String email);
    Optional<EventContribution> findByRazorpayOrderId(String orderId);
    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM EventContribution c WHERE c.event.id = :id AND c.confirmed = true")
    BigDecimal sumConfirmedByEventId(@org.springframework.data.repository.query.Param("id") Long id);
}
