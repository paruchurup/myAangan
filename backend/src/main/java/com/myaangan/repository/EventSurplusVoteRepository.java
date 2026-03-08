package com.myaangan.repository;
import com.myaangan.entity.EventSurplusVote;
import com.myaangan.enums.SurplusChoice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EventSurplusVoteRepository extends JpaRepository<EventSurplusVote, Long> {
    Optional<EventSurplusVote> findByEventIdAndVoterEmail(Long eventId, String email);
    long countByEventIdAndChoice(Long eventId, SurplusChoice choice);
    long countByEventId(Long eventId);
    List<EventSurplusVote> findByEventId(Long eventId);
}
