package com.myaangan.repository;

import com.myaangan.entity.Notice;
import com.myaangan.enums.NoticeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    // Published notices for residents — pinned first, then by date desc
    @Query("""
        SELECT n FROM Notice n WHERE n.status = 'PUBLISHED'
        AND (n.expiresAt IS NULL OR n.expiresAt > :now)
        ORDER BY n.pinned DESC, n.priority DESC, n.publishedAt DESC
    """)
    List<Notice> findPublishedActive(@Param("now") LocalDateTime now);

    // All non-archived for admin management
    @Query("SELECT n FROM Notice n WHERE n.status != 'ARCHIVED' ORDER BY n.pinned DESC, n.createdAt DESC")
    List<Notice> findAllManageable();

    // All including archived — for admin archive view
    @Query("SELECT n FROM Notice n ORDER BY n.createdAt DESC")
    List<Notice> findAllForAdmin();

    // Notices due to auto-publish
    @Query("SELECT n FROM Notice n WHERE n.status = 'DRAFT' AND n.publishAt IS NOT NULL AND n.publishAt <= :now")
    List<Notice> findDraftsDueToPublish(@Param("now") LocalDateTime now);

    // Notices due to auto-archive
    @Query("SELECT n FROM Notice n WHERE n.status = 'PUBLISHED' AND n.expiresAt IS NOT NULL AND n.expiresAt <= :now")
    List<Notice> findPublishedDueToExpire(@Param("now") LocalDateTime now);

    // Unread count for a user
    @Query("""
        SELECT COUNT(n) FROM Notice n WHERE n.status = 'PUBLISHED'
        AND (n.expiresAt IS NULL OR n.expiresAt > :now)
        AND NOT EXISTS (
            SELECT r FROM NoticeRead r WHERE r.notice = n AND r.user.email = :email
        )
    """)
    long countUnreadForUser(@Param("email") String email, @Param("now") LocalDateTime now);
}
