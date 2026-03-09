package com.myaangan.repository;

import com.myaangan.entity.FcmDeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import java.util.List;
import java.util.Optional;

public interface FcmDeviceTokenRepository extends JpaRepository<FcmDeviceToken, Long> {
    List<FcmDeviceToken> findByUserEmail(String email);
    List<FcmDeviceToken> findByUserIdIn(List<Long> userIds);
    Optional<FcmDeviceToken> findByUserEmailAndToken(String email, String token);

    @Modifying
    void deleteByToken(String token);
}
