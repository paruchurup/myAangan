package com.myaangan.repository;

import com.myaangan.entity.ServiceReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceReviewRepository extends JpaRepository<ServiceReview, Long> {

    List<ServiceReview> findByProviderIdOrderByCreatedAtDesc(Long providerId);

    Optional<ServiceReview> findByProviderIdAndReviewedByEmail(Long providerId, String email);

    boolean existsByProviderIdAndReviewedByEmail(Long providerId, String email);

    @Query("SELECT COALESCE(AVG(r.stars), 0) FROM ServiceReview r WHERE r.provider.id = :providerId")
    Double getAvgRatingForProvider(@Param("providerId") Long providerId);

    long countByProviderId(Long providerId);
}
