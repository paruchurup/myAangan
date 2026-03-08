package com.myaangan.repository;
import com.myaangan.entity.EventExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.util.List;

public interface EventExpenseRepository extends JpaRepository<EventExpense, Long> {
    List<EventExpense> findByEventIdOrderByCreatedAtDesc(Long eventId);
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM EventExpense e WHERE e.event.id = :id")
    BigDecimal sumByEventId(@org.springframework.data.repository.query.Param("id") Long id);
}
