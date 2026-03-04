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
