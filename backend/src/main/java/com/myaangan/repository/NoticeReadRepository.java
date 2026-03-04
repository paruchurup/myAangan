package com.myaangan.repository;

import com.myaangan.entity.NoticeRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface NoticeReadRepository extends JpaRepository<NoticeRead, Long> {
    Optional<NoticeRead> findByNoticeIdAndUserEmail(Long noticeId, String email);
    boolean existsByNoticeIdAndUserEmail(Long noticeId, String email);
    List<NoticeRead> findByNoticeId(Long noticeId);

    @Query("SELECT COUNT(r) FROM NoticeRead r WHERE r.notice.id = :noticeId")
    long countReads(@Param("noticeId") Long noticeId);

    @Query("SELECT COUNT(r) FROM NoticeRead r WHERE r.notice.id = :noticeId AND r.acknowledged = true")
    long countAcknowledgements(@Param("noticeId") Long noticeId);
}
