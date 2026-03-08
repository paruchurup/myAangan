package com.myaangan.repository;
import com.myaangan.entity.EventInKindContribution;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EventInKindContributionRepository extends JpaRepository<EventInKindContribution, Long> {
    List<EventInKindContribution> findByEventIdOrderByCreatedAtDesc(Long eventId);
    List<EventInKindContribution> findByResidentEmailOrderByCreatedAtDesc(String email);
}
