package com.myaangan.repository;
import com.myaangan.entity.EventVote;
import com.myaangan.enums.EventVoteChoice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface EventVoteRepository extends JpaRepository<EventVote, Long> {
    Optional<EventVote> findByEventIdAndVoterEmail(Long eventId, String email);
    long countByEventIdAndChoice(Long eventId, EventVoteChoice choice);
    long countByEventId(Long eventId);
    List<EventVote> findByEventId(Long eventId);
}
