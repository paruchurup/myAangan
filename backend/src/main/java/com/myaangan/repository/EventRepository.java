package com.myaangan.repository;
import com.myaangan.entity.Event;
import com.myaangan.enums.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStatusInOrderByEventDateAsc(List<EventStatus> statuses);
    List<Event> findAllByOrderByEventDateDesc();
    @Query("SELECT e FROM Event e WHERE e.status = 'VOTING' AND e.voteDeadline <= :now")
    List<Event> findVotingExpired(@org.springframework.data.repository.query.Param("now") LocalDateTime now);
}
