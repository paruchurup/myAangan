package com.myaangan.repository;

import com.myaangan.entity.VisitorPassLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VisitorPassLogRepository extends JpaRepository<VisitorPassLog, Long> {
    List<VisitorPassLog> findByPassIdOrderByCheckedInAtDesc(Long passId);
}
