package com.myaangan.repository;

import com.myaangan.entity.VisitorVehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface VisitorVehicleRepository extends JpaRepository<VisitorVehicle, Long> {

    @Query("SELECT v FROM VisitorVehicle v WHERE v.exitedAt IS NULL ORDER BY v.enteredAt DESC")
    List<VisitorVehicle> findCurrentlyInside();

    @Query("SELECT v FROM VisitorVehicle v ORDER BY v.enteredAt DESC")
    List<VisitorVehicle> findAllOrderByEnteredAtDesc();

    List<VisitorVehicle> findByHostFlatOrderByEnteredAtDesc(String hostFlat);
}
