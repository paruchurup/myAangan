package com.myaangan.repository;

import com.myaangan.entity.Poll;
import com.myaangan.enums.PollStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface PollRepository extends JpaRepository<Poll, Long> {

    List<Poll> findByStatusOrderByCreatedAtDesc(PollStatus status);

    List<Poll> findByStatusInOrderByCreatedAtDesc(List<PollStatus> statuses);

    @Query("SELECT p FROM Poll p WHERE p.status = 'ACTIVE' ORDER BY p.endsAt ASC NULLS LAST, p.createdAt DESC")
    List<Poll> findActivePolls();

    @Query("SELECT p FROM Poll p WHERE p.status = 'DRAFT' AND p.startsAt IS NOT NULL AND p.startsAt <= :now")
    List<Poll> findDraftsDueToStart(LocalDateTime now);

    @Query("SELECT p FROM Poll p WHERE p.status = 'ACTIVE' AND p.endsAt IS NOT NULL AND p.endsAt <= :now")
    List<Poll> findActiveDueToClose(LocalDateTime now);

    List<Poll> findByCreatedByEmailOrderByCreatedAtDesc(String email);
}
