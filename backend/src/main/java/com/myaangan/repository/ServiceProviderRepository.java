package com.myaangan.repository;

import com.myaangan.entity.ServiceProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceProviderRepository extends JpaRepository<ServiceProvider, Long> {

    // All active providers, optionally filtered by category
    List<ServiceProvider> findByActiveTrueOrderByAvgRatingDesc();

    List<ServiceProvider> findByCategoryIdAndActiveTrueOrderByAvgRatingDesc(Long categoryId);

    // Search by name (case-insensitive)
    @Query("SELECT p FROM ServiceProvider p WHERE p.active = true AND " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<ServiceProvider> searchByName(@Param("query") String query);

    // Search by name within a category
    @Query("SELECT p FROM ServiceProvider p WHERE p.active = true AND " +
           "p.category.id = :categoryId AND " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<ServiceProvider> searchByNameAndCategory(@Param("query") String query,
                                                  @Param("categoryId") Long categoryId);

    boolean existsByPhone(String phone);
}
