package com.myaangan.repository;

import com.myaangan.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUserEmailOrderByCreatedAtDesc(String email, Pageable pageable);
    long countByUserEmailAndIsReadFalse(String email);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.email = :email AND n.isRead = false")
    int markAllRead(@org.springframework.data.repository.query.Param("email") String email);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoff")
    int deleteOlderThan(@org.springframework.data.repository.query.Param("cutoff") LocalDateTime cutoff);

    @Query("SELECT n FROM Notification n WHERE n.user.email = :email ORDER BY n.createdAt DESC")
    List<Notification> findRecentByEmail(@org.springframework.data.repository.query.Param("email") String email, Pageable pageable);
}
