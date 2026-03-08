package com.myaangan.service;

import com.myaangan.entity.*;
import com.myaangan.enums.*;
import com.myaangan.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final UserRepository             userRepo;
    private final ComplaintRepository        complaintRepo;
    private final NoticeRepository           noticeRepo;
    private final NoticeReadRepository       noticeReadRepo;
    private final PollRepository             pollRepo;
    private final PollVoteRepository         pollVoteRepo;
    private final MaintenanceBillRepository  billRepo;

    public Map<String, Object> getSummary() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("generatedAt", LocalDateTime.now().toString());
        result.put("society",     buildSocietyStats());
        result.put("maintenance", buildMaintenanceStats());
        result.put("complaints",  buildComplaintStats());
        result.put("noticesPolls",buildNoticesPollsStats());
        return result;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SOCIETY OVERVIEW
    // ═══════════════════════════════════════════════════════════════════════
    private Map<String, Object> buildSocietyStats() {
        List<User> all = userRepo.findAll();

        long total    = all.size();
        long active   = all.stream().filter(u -> u.getStatus() == UserStatus.ACTIVE).count();
        long pending  = all.stream().filter(u -> u.getStatus() == UserStatus.PENDING_APPROVAL).count();
        long suspended= all.stream().filter(u -> u.getStatus() == UserStatus.SUSPENDED).count();

        // Role breakdown (excluding ADMIN)
        Map<String, Long> byRole = all.stream()
            .filter(u -> u.getStatus() == UserStatus.ACTIVE && u.getRole() != Role.ADMIN)
            .collect(Collectors.groupingBy(u -> u.getRole().name(), Collectors.counting()));

        // Unique occupied flats
        long uniqueFlats = all.stream()
            .filter(u -> u.getStatus() == UserStatus.ACTIVE
                      && u.getFlatNumber() != null && !u.getFlatNumber().isBlank())
            .map(u -> (u.getBlock() != null ? u.getBlock() : "") + "-" + u.getFlatNumber())
            .distinct().count();

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalUsers",    total);
        m.put("activeUsers",   active);
        m.put("pendingApproval", pending);
        m.put("suspended",     suspended);
        m.put("occupiedFlats", uniqueFlats);
        m.put("roleBreakdown", byRole);
        return m;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MAINTENANCE
    // ═══════════════════════════════════════════════════════════════════════
    private Map<String, Object> buildMaintenanceStats() {
        LocalDate today = LocalDate.now();
        int year  = today.getYear();
        int month = today.getMonthValue();

        // This month's bills
        List<MaintenanceBill> thisMonth = billRepo.findByBillYearAndBillMonthOrderByFlatKey(year, month);
        long totalBills = thisMonth.size();
        long paidBills  = thisMonth.stream().filter(b -> b.getStatus() == BillStatus.PAID).count();
        long unpaidBills= thisMonth.stream().filter(b -> b.getStatus() == BillStatus.UNPAID).count();
        long waivedBills= thisMonth.stream().filter(b -> b.getStatus() == BillStatus.WAIVED).count();

        BigDecimal collected = thisMonth.stream()
            .filter(b -> b.getStatus() == BillStatus.PAID)
            .map(MaintenanceBill::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal outstanding = thisMonth.stream()
            .filter(b -> b.getStatus() == BillStatus.UNPAID)
            .map(MaintenanceBill::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        double collectionRate = totalBills > 0
            ? BigDecimal.valueOf(paidBills * 100.0 / totalBills).setScale(1, RoundingMode.HALF_UP).doubleValue()
            : 0.0;

        // Defaulters (2+ unpaid)
        long defaulterCount = billRepo.findDefaulters().size();

        // 6-month trend
        List<Map<String, Object>> trend = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.from(today).minusMonths(i);
            List<MaintenanceBill> monthBills = billRepo.findByBillYearAndBillMonthOrderByFlatKey(ym.getYear(), ym.getMonthValue());
            BigDecimal monthCollected = monthBills.stream()
                .filter(b -> b.getStatus() == BillStatus.PAID)
                .map(MaintenanceBill::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            long monthTotal = monthBills.size();
            long monthPaid  = monthBills.stream().filter(b -> b.getStatus() == BillStatus.PAID).count();

            Map<String, Object> tm = new LinkedHashMap<>();
            tm.put("month",     ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + ym.getYear());
            tm.put("collected", monthCollected);
            tm.put("total",     monthTotal);
            tm.put("paid",      monthPaid);
            tm.put("rate",      monthTotal > 0 ? Math.round(monthPaid * 100.0 / monthTotal) : 0);
            trend.add(tm);
        }

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("currentMonth",    Month.of(month).getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + year);
        m.put("totalBills",      totalBills);
        m.put("paidBills",       paidBills);
        m.put("unpaidBills",     unpaidBills);
        m.put("waivedBills",     waivedBills);
        m.put("collectionRate",  collectionRate);
        m.put("collected",       collected);
        m.put("outstanding",     outstanding);
        m.put("defaulterCount",  defaulterCount);
        m.put("trend",           trend);
        return m;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COMPLAINTS
    // ═══════════════════════════════════════════════════════════════════════
    private Map<String, Object> buildComplaintStats() {
        List<Complaint> all = complaintRepo.findAll();

        long open       = all.stream().filter(c -> c.getStatus() == ComplaintStatus.OPEN).count();
        long inProgress = all.stream().filter(c -> c.getStatus() == ComplaintStatus.IN_PROGRESS
                                               || c.getStatus() == ComplaintStatus.ACKNOWLEDGED).count();

        // Resolved this month
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        long resolvedThisMonth = all.stream()
            .filter(c -> (c.getStatus() == ComplaintStatus.RESOLVED || c.getStatus() == ComplaintStatus.CLOSED)
                      && c.getUpdatedAt() != null
                      && c.getUpdatedAt().toLocalDate().isAfter(startOfMonth.minusDays(1)))
            .count();

        long totalResolved = all.stream()
            .filter(c -> c.getStatus() == ComplaintStatus.RESOLVED || c.getStatus() == ComplaintStatus.CLOSED)
            .count();

        // Average resolution time (days) for resolved complaints
        OptionalDouble avgResolutionDays = all.stream()
            .filter(c -> (c.getStatus() == ComplaintStatus.RESOLVED || c.getStatus() == ComplaintStatus.CLOSED)
                      && c.getCreatedAt() != null && c.getUpdatedAt() != null)
            .mapToLong(c -> Duration.between(c.getCreatedAt(), c.getUpdatedAt()).toDays())
            .average();

        // SLA breached (overdue)
        long slaBreached = complaintRepo.countByEscalationLevel(EscalationLevel.BDA_ENGINEER);

        // Category breakdown (top 5 open)
        Map<String, Long> byCategory = all.stream()
            .filter(c -> c.getStatus() == ComplaintStatus.OPEN || c.getStatus() == ComplaintStatus.IN_PROGRESS
                      || c.getStatus() == ComplaintStatus.ACKNOWLEDGED)
            .collect(Collectors.groupingBy(
                c -> c.getCategory() != null ? c.getCategory().name() : "OTHER",
                Collectors.counting()
            ))
            .entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(5)
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue,
                (e1, e2) -> e1, LinkedHashMap::new));

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("open",              open);
        m.put("inProgress",        inProgress);
        m.put("resolvedThisMonth", resolvedThisMonth);
        m.put("totalResolved",     totalResolved);
        m.put("avgResolutionDays", avgResolutionDays.isPresent()
            ? BigDecimal.valueOf(avgResolutionDays.getAsDouble()).setScale(1, RoundingMode.HALF_UP).doubleValue()
            : 0.0);
        m.put("slaBreached",       slaBreached);
        m.put("byCategory",        byCategory);
        return m;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // NOTICES & POLLS
    // ═══════════════════════════════════════════════════════════════════════
    private Map<String, Object> buildNoticesPollsStats() {
        // Notices
        List<Notice> allNotices = noticeRepo.findAll();
        long publishedNotices = allNotices.stream()
            .filter(n -> n.getStatus() != null && n.getStatus().name().equals("PUBLISHED")).count();
        long totalNotices     = allNotices.size();

        // Avg read rate across published notices
        List<Notice> published = allNotices.stream()
            .filter(n -> n.getStatus() != null && n.getStatus().name().equals("PUBLISHED"))
            .collect(Collectors.toList());

        double avgReadRate = 0.0;
        long   totalReads  = 0;
        if (!published.isEmpty()) {
            // Get total active residents for denominator
            long activeResidents = Math.max(1,
                userRepo.findByStatus(UserStatus.ACTIVE).stream()
                    .filter(u -> u.getRole() == Role.RESIDENT).count());

            long totalPossibleReads = published.size() * activeResidents;
            totalReads = noticeReadRepo.count();
            avgReadRate = totalPossibleReads > 0
                ? BigDecimal.valueOf(totalReads * 100.0 / totalPossibleReads)
                    .min(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP).doubleValue()
                : 0.0;
        }

        // Notices this month
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        long noticesThisMonth = allNotices.stream()
            .filter(n -> n.getCreatedAt() != null
                      && n.getCreatedAt().toLocalDate().isAfter(startOfMonth.minusDays(1)))
            .count();

        // Polls
        List<Poll> allPolls   = pollRepo.findAll();
        long activePolls      = allPolls.stream().filter(p -> p.getStatus() == PollStatus.ACTIVE).count();
        long totalPolls       = allPolls.size();
        long totalVotes       = pollVoteRepo.count();

        // Votes this month
        long votesThisMonth = pollVoteRepo.findAll().stream()
            .filter(v -> v.getCreatedAt() != null
                      && v.getCreatedAt().toLocalDate().isAfter(startOfMonth.minusDays(1)))
            .count();

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("publishedNotices",  publishedNotices);
        m.put("totalNotices",      totalNotices);
        m.put("noticesThisMonth",  noticesThisMonth);
        m.put("totalReads",        totalReads);
        m.put("avgReadRate",       avgReadRate);
        m.put("activePolls",       activePolls);
        m.put("totalPolls",        totalPolls);
        m.put("totalVotes",        totalVotes);
        m.put("votesThisMonth",    votesThisMonth);
        return m;
    }
}
