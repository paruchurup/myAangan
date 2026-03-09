package com.myaangan.repository;

import com.myaangan.entity.FcmToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface FcmTokenRepository extends JpaRepository<FcmToken, Long> {
    List<FcmToken> findByUserEmail(String email);
    Optional<FcmToken> findByUserEmailAndToken(String email, String token);

    @Modifying
    @Query("DELETE FROM FcmToken t WHERE t.token = :token")
    void deleteByToken(@org.springframework.data.repository.query.Param("token") String token);

    @Query("SELECT t FROM FcmToken t WHERE t.user.id IN :userIds")
    List<FcmToken> findByUserIds(@org.springframework.data.repository.query.Param("userIds") List<Long> userIds);
}
