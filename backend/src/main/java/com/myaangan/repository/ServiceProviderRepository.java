package com.myaangan.repository;

import com.myaangan.entity.ServiceProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceProviderRepository extends JpaRepository<ServiceProvider, Long> {

    // ── Sort: Highest Rated ────────────────────────────────────────────────────
    List<ServiceProvider> findByActiveTrueOrderByAvgRatingDesc();
    List<ServiceProvider> findByCategoryIdAndActiveTrueOrderByAvgRatingDesc(Long categoryId);

    // ── Sort: Most Reviewed ────────────────────────────────────────────────────
    List<ServiceProvider> findByActiveTrueOrderByReviewCountDesc();
    List<ServiceProvider> findByCategoryIdAndActiveTrueOrderByReviewCountDesc(Long categoryId);

    // ── Search ─────────────────────────────────────────────────────────────────
    @Query("SELECT p FROM ServiceProvider p WHERE p.active = true AND " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY p.avgRating DESC")
    List<ServiceProvider> searchByName(@Param("query") String query);

    @Query("SELECT p FROM ServiceProvider p WHERE p.active = true AND " +
           "p.category.id = :categoryId AND " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY p.avgRating DESC")
    List<ServiceProvider> searchByNameAndCategory(@Param("query") String query,
                                                   @Param("categoryId") Long categoryId);

    // ── My Providers ───────────────────────────────────────────────────────────
    List<ServiceProvider> findByAddedByEmailAndActiveTrueOrderByCreatedAtDesc(String email);

    boolean existsByPhone(String phone);
    boolean existsByPhoneAndIdNot(String phone, Long id);
}
