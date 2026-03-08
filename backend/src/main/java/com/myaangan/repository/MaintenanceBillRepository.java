package com.myaangan.repository;

import com.myaangan.entity.MaintenanceBill;
import com.myaangan.enums.BillStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MaintenanceBillRepository extends JpaRepository<MaintenanceBill, Long> {

    Optional<MaintenanceBill> findByFlatKeyAndBillYearAndBillMonth(
            String flatKey, Integer year, Integer month);

    boolean existsByFlatKeyAndBillYearAndBillMonth(
            String flatKey, Integer year, Integer month);

    List<MaintenanceBill> findByFlatKeyOrderByBillYearDescBillMonthDesc(String flatKey);

    List<MaintenanceBill> findByBillYearAndBillMonthOrderByFlatKey(Integer year, Integer month);

    List<MaintenanceBill> findByResidentEmailOrderByBillYearDescBillMonthDesc(String email);

    /** Defaulters: flats with 2+ unpaid bills. */
    @Query("SELECT b.flatKey, COUNT(b) as cnt FROM MaintenanceBill b " +
           "WHERE b.status = 'UNPAID' GROUP BY b.flatKey HAVING COUNT(b) >= 2 ORDER BY cnt DESC")
    List<Object[]> findDefaulters();

    /** Bills pending penalty recalculation (unpaid, past due date). */
    @Query("SELECT b FROM MaintenanceBill b WHERE b.status = 'UNPAID' AND b.dueDate < CURRENT_DATE")
    List<MaintenanceBill> findOverdueBills();

    /** Monthly collection summary. */
    @Query("SELECT b.billYear, b.billMonth, COUNT(b), " +
           "SUM(CASE WHEN b.status = 'PAID' THEN b.totalAmount ELSE 0 END), " +
           "SUM(CASE WHEN b.status = 'UNPAID' THEN b.totalAmount ELSE 0 END) " +
           "FROM MaintenanceBill b GROUP BY b.billYear, b.billMonth " +
           "ORDER BY b.billYear DESC, b.billMonth DESC")
    List<Object[]> getMonthlySummary();

    Optional<MaintenanceBill> findByRazorpayOrderId(String orderId);
}
