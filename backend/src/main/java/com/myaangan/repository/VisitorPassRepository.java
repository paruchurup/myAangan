package com.myaangan.repository;

import com.myaangan.entity.VisitorPass;
import com.myaangan.enums.PassStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface VisitorPassRepository extends JpaRepository<VisitorPass, Long> {

    Optional<VisitorPass> findByToken(String token);

    List<VisitorPass> findByCreatedByEmailOrderByCreatedAtDesc(String email);

    @Query("SELECT p FROM VisitorPass p WHERE p.createdBy.email = :email AND p.status = :status ORDER BY p.createdAt DESC")
    List<VisitorPass> findByCreatedByEmailAndStatus(@Param("email") String email, @Param("status") PassStatus status);

    @Query("SELECT p FROM VisitorPass p ORDER BY p.createdAt DESC")
    List<VisitorPass> findAllOrderByCreatedAtDesc();

    boolean existsByToken(String token);
}
