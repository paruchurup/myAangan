package com.myaangan.repository;

import com.myaangan.entity.PollVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PollVoteRepository extends JpaRepository<PollVote, Long> {

    List<PollVote> findByPollId(Long pollId);

    List<PollVote> findByPollIdAndVoterEmail(Long pollId, String email);

    boolean existsByPollIdAndVoterEmail(Long pollId, String email);

    void deleteByPollIdAndVoterEmail(Long pollId, String email);

    @Query("SELECT v.option.id, COUNT(v) FROM PollVote v WHERE v.poll.id = :pollId AND v.option IS NOT NULL GROUP BY v.option.id")
    List<Object[]> countByOption(Long pollId);

    @Query("SELECT v.yesNoValue, COUNT(v) FROM PollVote v WHERE v.poll.id = :pollId AND v.yesNoValue IS NOT NULL GROUP BY v.yesNoValue")
    List<Object[]> countByYesNo(Long pollId);

    @Query("SELECT AVG(v.ratingValue) FROM PollVote v WHERE v.poll.id = :pollId AND v.ratingValue IS NOT NULL")
    Double avgRating(Long pollId);

    @Query("SELECT v.ratingValue, COUNT(v) FROM PollVote v WHERE v.poll.id = :pollId AND v.ratingValue IS NOT NULL GROUP BY v.ratingValue ORDER BY v.ratingValue")
    List<Object[]> ratingDistribution(Long pollId);

    long countByPollId(Long pollId);

    // Distinct voters (a person voting on 3 options still counts as 1)
    @Query("SELECT COUNT(DISTINCT v.voter.id) FROM PollVote v WHERE v.poll.id = :pollId")
    long countDistinctVotersByPollId(Long pollId);
}
