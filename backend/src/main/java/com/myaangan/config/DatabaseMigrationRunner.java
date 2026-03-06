package com.myaangan.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runs idempotent DDL fixes on every startup — always safe to re-run.
 *
 * WHY THIS EXISTS:
 *   ddl-auto=update never widens existing columns, so adding longer enum
 *   values (e.g. FACILITY_MANAGER) would silently truncate data.
 *   This runner also ensures critical tables exist before DataInitializer seeds them.
 *
 * ORDER 1 — runs before DataInitializer (Order 2).
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DatabaseMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(ApplicationArguments args) {
        // ── Widen columns that may be too narrow from older deploys ──────────
        widenColumn("users", "role",   "VARCHAR(50)  NOT NULL");
        widenColumn("users", "status", "VARCHAR(30)  NOT NULL");

        // ── Ensure role_permissions table exists before DataInitializer seeds it
        ensureRolePermissionsTable();

        // ── Widen role_permissions columns if needed ──────────────────────────
        widenColumn("role_permissions", "role",       "VARCHAR(50) NOT NULL");
        widenColumn("role_permissions", "permission", "VARCHAR(60) NOT NULL");

        // ── Ensure poll tables exist (Hibernate creates them, but just in case) ─
        ensurePollTables();


        // ── Ensure notice tables exist ────────────────────────────────────────────
        ensureNoticeTables();

        ensureVehicleTables();
        migrateVehicleSlotRelationship();
        log.info("✅ DatabaseMigrationRunner complete");
    }

    private void ensureRolePermissionsTable() {
        try {
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS role_permissions (
                    id         BIGINT       NOT NULL AUTO_INCREMENT,
                    role       VARCHAR(50)  NOT NULL,
                    permission VARCHAR(60)  NOT NULL,
                    granted    TINYINT(1)   NOT NULL DEFAULT 0,
                    PRIMARY KEY (id),
                    UNIQUE KEY uk_role_permission (role, permission)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);
            log.info("role_permissions table ensured");
        } catch (Exception e) {
            log.warn("Could not ensure role_permissions table: {}", e.getMessage());
        }
    }

    private void ensurePollTables() {
        try {
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS polls (
                    id                BIGINT        NOT NULL AUTO_INCREMENT,
                    question          VARCHAR(300)  NOT NULL,
                    description       VARCHAR(1000),
                    type              VARCHAR(20)   NOT NULL,
                    status            VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
                    result_visibility VARCHAR(20)   NOT NULL DEFAULT 'AFTER_VOTE',
                    starts_at         DATETIME,
                    ends_at           DATETIME,
                    closed_at         DATETIME,
                    published_at      DATETIME,
                    anonymous         TINYINT(1)    NOT NULL DEFAULT 0,
                    allow_vote_change TINYINT(1)    NOT NULL DEFAULT 1,
                    allow_comments    TINYINT(1)    NOT NULL DEFAULT 1,
                    max_choices       INT           NOT NULL DEFAULT 0,
                    target_blocks     VARCHAR(200),
                    created_by_id     BIGINT        NOT NULL,
                    created_at        DATETIME,
                    updated_at        DATETIME,
                    PRIMARY KEY (id),
                    KEY fk_poll_creator (created_by_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);

            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS poll_options (
                    id            BIGINT       NOT NULL AUTO_INCREMENT,
                    poll_id       BIGINT       NOT NULL,
                    text          VARCHAR(300) NOT NULL,
                    display_order INT          NOT NULL DEFAULT 0,
                    emoji         VARCHAR(10),
                    PRIMARY KEY (id),
                    KEY fk_option_poll (poll_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);

            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS poll_votes (
                    id           BIGINT      NOT NULL AUTO_INCREMENT,
                    poll_id      BIGINT      NOT NULL,
                    voter_id     BIGINT      NOT NULL,
                    option_id    BIGINT,
                    yes_no_value VARCHAR(10),
                    rating_value INT,
                    created_at   DATETIME,
                    updated_at   DATETIME,
                    PRIMARY KEY (id),
                    UNIQUE KEY uk_vote (poll_id, voter_id, option_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);

            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS poll_comments (
                    id         BIGINT        NOT NULL AUTO_INCREMENT,
                    poll_id    BIGINT        NOT NULL,
                    author_id  BIGINT        NOT NULL,
                    text       VARCHAR(1000) NOT NULL,
                    created_at DATETIME,
                    PRIMARY KEY (id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);

            log.info("Poll tables ensured");
        } catch (Exception e) {
            log.warn("Could not ensure poll tables: {}", e.getMessage());
        }
    }

    /**
     * Alters a column only if its current VARCHAR size is smaller than required.
     * Non-VARCHAR columns are skipped. Completely safe to run repeatedly.
     */
    private void ensureVehicleTables() {
        try {
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS vehicles (
                    id           BIGINT       NOT NULL AUTO_INCREMENT,
                    owner_id     BIGINT       NOT NULL,
                    plate_number VARCHAR(20)  NOT NULL,
                    type         VARCHAR(10)  NOT NULL,
                    make         VARCHAR(50)  NOT NULL,
                    model        VARCHAR(50)  NOT NULL,
                    colour       VARCHAR(30),
                    year         VARCHAR(20),
                    photo_path   VARCHAR(500),
                    assigned_slot_id BIGINT,
                    status       VARCHAR(15)  NOT NULL DEFAULT 'PENDING',
                    admin_note   VARCHAR(500),
                    approved_by_id BIGINT,
                    approved_at  DATETIME,
                    created_at   DATETIME,
                    updated_at   DATETIME,
                    PRIMARY KEY (id),
                    UNIQUE KEY uk_plate (plate_number)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS parking_slots (
                    id                  BIGINT      NOT NULL AUTO_INCREMENT,
                    block               VARCHAR(5)  NOT NULL,
                    slot_number         VARCHAR(10) NOT NULL,
                    level               VARCHAR(20),
                    type                VARCHAR(10) NOT NULL,
                    status              VARCHAR(15) NOT NULL DEFAULT 'AVAILABLE',
                    assigned_vehicle_id BIGINT,
                    notes               VARCHAR(500),
                    created_at          DATETIME,
                    updated_at          DATETIME,
                    PRIMARY KEY (id),
                    UNIQUE KEY uk_slot (block, slot_number)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS visitor_vehicles (
                    id                   BIGINT       NOT NULL AUTO_INCREMENT,
                    plate_number         VARCHAR(20)  NOT NULL,
                    vehicle_description  VARCHAR(30),
                    host_flat            VARCHAR(10)  NOT NULL,
                    visitor_name         VARCHAR(100) NOT NULL,
                    visitor_phone        VARCHAR(20)  NOT NULL,
                    slot_id              BIGINT,
                    logged_by_id         BIGINT       NOT NULL,
                    exited_at            DATETIME,
                    notes                VARCHAR(200),
                    entered_at           DATETIME,
                    PRIMARY KEY (id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS parking_violations (
                    id              BIGINT        NOT NULL AUTO_INCREMENT,
                    vehicle_id      BIGINT,
                    plate_number    VARCHAR(20)   NOT NULL,
                    slot_id         BIGINT,
                    violation_type  VARCHAR(20)   NOT NULL,
                    description     VARCHAR(1000) NOT NULL,
                    photo_path      VARCHAR(500),
                    reported_by_id  BIGINT        NOT NULL,
                    status          VARCHAR(25)   NOT NULL DEFAULT 'OPEN',
                    resolved        TINYINT(1)    NOT NULL DEFAULT 0,
                    owner_notified_at DATETIME,
                    owner_action_at  DATETIME,
                    resolution_note VARCHAR(500),
                    resolved_by_id  BIGINT,
                    resolved_at     DATETIME,
                    reported_at     DATETIME,
                    PRIMARY KEY (id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);

            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS parking_notifications (
                    id           BIGINT      NOT NULL AUTO_INCREMENT,
                    recipient_id BIGINT      NOT NULL,
                    violation_id BIGINT      NOT NULL,
                    message      VARCHAR(300) NOT NULL,
                    read         TINYINT(1)  NOT NULL DEFAULT 0,
                    read_at      DATETIME,
                    created_at   DATETIME,
                    PRIMARY KEY (id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);
            log.info("parking_notifications table ensured");
            log.info("Vehicle & parking tables ensured");
        } catch (Exception e) {
            log.warn("Could not ensure vehicle tables: {}", e.getMessage());
        }
        try {
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS visitor_passes (
                    id              BIGINT       NOT NULL AUTO_INCREMENT,
                    token           VARCHAR(8)   NOT NULL UNIQUE,
                    created_by_id   BIGINT       NOT NULL,
                    visitor_name    VARCHAR(100) NOT NULL,
                    visitor_phone   VARCHAR(20),
                    purpose         VARCHAR(100),
                    pass_type       VARCHAR(10)  NOT NULL,
                    status          VARCHAR(10)  NOT NULL DEFAULT 'ACTIVE',
                    valid_date      DATE,
                    window_start    TIME,
                    window_end      TIME,
                    allowed_days    VARCHAR(20),
                    standing_from   DATE,
                    standing_until  DATE,
                    notes           VARCHAR(300),
                    created_at      DATETIME,
                    updated_at      DATETIME,
                    PRIMARY KEY (id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS visitor_pass_logs (
                    id                BIGINT       NOT NULL AUTO_INCREMENT,
                    pass_id           BIGINT       NOT NULL,
                    checked_in_by_id  BIGINT       NOT NULL,
                    check_in_status   VARCHAR(15)  NOT NULL DEFAULT 'CHECKED_IN',
                    override_reason   VARCHAR(300),
                    checked_in_at     DATETIME,
                    PRIMARY KEY (id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);
            log.info("Visitor pass tables ensured");
        } catch (Exception e) {
            log.warn("Could not ensure visitor pass tables: {}", e.getMessage());
        }
    }

    private void ensureVisitorPassTables() { /* tables created above inline */ }

    private void ensureNoticeTables() {
        try {
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS notices (
                    id                       BIGINT        NOT NULL AUTO_INCREMENT,
                    title                    VARCHAR(300)  NOT NULL,
                    content                  TEXT          NOT NULL,
                    type                     VARCHAR(20)   NOT NULL,
                    priority                 VARCHAR(10)   NOT NULL DEFAULT 'NORMAL',
                    status                   VARCHAR(15)   NOT NULL DEFAULT 'DRAFT',
                    pinned                   TINYINT(1)    NOT NULL DEFAULT 0,
                    requires_acknowledgement TINYINT(1)    NOT NULL DEFAULT 0,
                    target_blocks            VARCHAR(200),
                    publish_at               DATETIME,
                    expires_at               DATETIME,
                    published_at             DATETIME,
                    archived_at              DATETIME,
                    created_by_id            BIGINT        NOT NULL,
                    created_at               DATETIME,
                    updated_at               DATETIME,
                    PRIMARY KEY (id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS notice_attachments (
                    id            BIGINT       NOT NULL AUTO_INCREMENT,
                    notice_id     BIGINT       NOT NULL,
                    original_name VARCHAR(500) NOT NULL,
                    stored_path   VARCHAR(1000)NOT NULL,
                    file_type     VARCHAR(10)  NOT NULL,
                    file_size     BIGINT       NOT NULL DEFAULT 0,
                    uploaded_at   DATETIME,
                    PRIMARY KEY (id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS notice_reads (
                    id               BIGINT    NOT NULL AUTO_INCREMENT,
                    notice_id        BIGINT    NOT NULL,
                    user_id          BIGINT    NOT NULL,
                    acknowledged     TINYINT(1)NOT NULL DEFAULT 0,
                    read_at          DATETIME,
                    acknowledged_at  DATETIME,
                    PRIMARY KEY (id),
                    UNIQUE KEY uk_notice_user (notice_id, user_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS notice_comments (
                    id         BIGINT        NOT NULL AUTO_INCREMENT,
                    notice_id  BIGINT        NOT NULL,
                    author_id  BIGINT        NOT NULL,
                    text       VARCHAR(1000) NOT NULL,
                    created_at DATETIME,
                    PRIMARY KEY (id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);
            log.info("Notice tables ensured");
        } catch (Exception e) {
            log.warn("Could not ensure notice tables: {}", e.getMessage());
        }
    }

    /**
     * Moves the slot assignment FK from parking_slots.assigned_vehicle_id
     * to vehicles.assigned_slot_id (one-to-many: a slot can hold multiple bikes).
     * Idempotent — safe to run on every startup.
     */
    private void migrateVehicleSlotRelationship() {
        try {
            // 1. Add assigned_slot_id column to vehicles if it doesn't exist
            jdbc.execute("""
                ALTER TABLE vehicles
                ADD COLUMN IF NOT EXISTS assigned_slot_id BIGINT DEFAULT NULL
            """);

            // 2. Migrate existing data: copy the mapping that was stored in parking_slots
            jdbc.execute("""
                UPDATE vehicles v
                JOIN parking_slots s ON s.assigned_vehicle_id = v.id
                SET v.assigned_slot_id = s.id
                WHERE v.assigned_slot_id IS NULL
            """);

            // 3. Update slot status: set OCCUPIED where a CAR is now assigned
            jdbc.execute("""
                UPDATE parking_slots s
                SET s.status = 'OCCUPIED'
                WHERE EXISTS (
                    SELECT 1 FROM vehicles v
                    WHERE v.assigned_slot_id = s.id AND v.type = 'CAR'
                )
            """);

            log.info("✅ Vehicle-slot relationship migration complete");
        } catch (Exception e) {
            log.warn("Vehicle-slot migration skipped or partial: {}", e.getMessage());
        }
    }

    private void widenColumn(String table, String column, String newDefinition) {
        try {
            String currentType = jdbc.queryForObject(
                "SELECT COLUMN_TYPE FROM information_schema.COLUMNS " +
                "WHERE TABLE_SCHEMA = DATABASE() " +
                "AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                String.class, table, column);

            int currentLen  = extractVarcharLength(currentType);
            int requiredLen = extractVarcharLength(newDefinition);

            if (currentLen < requiredLen) {
                log.info("Widening {}.{} from {} to {}", table, column, currentType, newDefinition);
                jdbc.execute("ALTER TABLE `" + table + "` MODIFY COLUMN `" + column + "` " + newDefinition);
                log.info("✅ Widened {}.{}", table, column);
            }
        } catch (Exception e) {
            // Non-fatal — table may not exist yet; Hibernate will create it correctly.
            log.debug("Could not check/widen {}.{}: {}", table, column, e.getMessage());
        }
    }

    private int extractVarcharLength(String typeStr) {
        if (typeStr == null) return 0;
        java.util.regex.Matcher m =
            java.util.regex.Pattern.compile("\\((\\d+)\\)").matcher(typeStr);
        return m.find() ? Integer.parseInt(m.group(1)) : 0;
    }
}
