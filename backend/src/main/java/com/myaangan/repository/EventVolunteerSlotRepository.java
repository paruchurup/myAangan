package com.myaangan.repository;
import com.myaangan.entity.EventVolunteerSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EventVolunteerSlotRepository extends JpaRepository<EventVolunteerSlot, Long> {
    List<EventVolunteerSlot> findByEventId(Long eventId);
}
