package com.myaangan.repository;
import com.myaangan.entity.EventVolunteerSignup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface EventVolunteerSignupRepository extends JpaRepository<EventVolunteerSignup, Long> {
    Optional<EventVolunteerSignup> findBySlotIdAndResidentEmail(Long slotId, String email);
    long countBySlotId(Long slotId);
    List<EventVolunteerSignup> findByResidentEmail(String email);
    @Query("SELECT s FROM EventVolunteerSignup s WHERE s.slot.event.id = :eventId")
    List<EventVolunteerSignup> findByEventId(@org.springframework.data.repository.query.Param("eventId") Long eventId);
}
