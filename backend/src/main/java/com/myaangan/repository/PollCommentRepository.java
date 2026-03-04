package com.myaangan.repository;

import com.myaangan.entity.PollComment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PollCommentRepository extends JpaRepository<PollComment, Long> {
    List<PollComment> findByPollIdOrderByCreatedAtDesc(Long pollId);
    void deleteByPollIdAndAuthorEmail(Long pollId, String email);
}
