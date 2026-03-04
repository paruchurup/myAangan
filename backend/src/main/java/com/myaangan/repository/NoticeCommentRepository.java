package com.myaangan.repository;

import com.myaangan.entity.NoticeComment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NoticeCommentRepository extends JpaRepository<NoticeComment, Long> {
    List<NoticeComment> findByNoticeIdOrderByCreatedAtAsc(Long noticeId);
}
