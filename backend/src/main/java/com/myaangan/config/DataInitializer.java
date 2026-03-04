package com.myaangan.config;

import com.myaangan.entity.ServiceCategory;
import com.myaangan.entity.User;
import com.myaangan.enums.Role;
import com.myaangan.enums.UserStatus;
import com.myaangan.repository.ServiceCategoryRepository;
import com.myaangan.repository.UserRepository;
import com.myaangan.entity.EscalationSetting;
import com.myaangan.entity.RolePermission;
import com.myaangan.enums.Permission;
import com.myaangan.repository.EscalationSettingRepository;
import com.myaangan.repository.RolePermissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(2)
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired private UserRepository userRepository;
    @Autowired private ServiceCategoryRepository categoryRepository;
    @Autowired private EscalationSettingRepository escalationSettingRepository;
    @Autowired private RolePermissionRepository rolePermissionRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        createDefaultAdmin();
        createDefaultCategories();
        createEscalationSettings();
        seedDefaultPermissions();
    }

    private void createDefaultAdmin() {
        seedUser("admin@myaangan.com", "Admin@1234", "Society", "Admin",
            "9999999999", Role.ADMIN, "IMPORTANT: Change the default admin password after first login!");
        seedUser("fm@myaangan.com", "Fm@12345", "Facility", "Manager",
            "9999999998", Role.FACILITY_MANAGER, "Default Facility Manager: fm@myaangan.com / Fm@12345");
        seedUser("bm@myaangan.com", "Bm@12345", "Builder", "Manager",
            "9999999997", Role.BUILDER_MANAGER, "Default Builder Manager: bm@myaangan.com / Bm@12345");
        seedUser("bda@myaangan.com", "Bda@1234", "BDA", "Engineer",
            "9999999996", Role.BDA_ENGINEER, "Default BDA Engineer: bda@myaangan.com / Bda@1234");
        seedUser("president@myaangan.com", "Pres@1234", "Society", "President",
            "9999999995", Role.PRESIDENT, "Default President: president@myaangan.com / Pres@1234");
    }

    private void seedUser(String email, String password, String firstName, String lastName,
                          String phone, Role role, String logMsg) {
        if (!userRepository.existsByEmail(email)) {
            User user = User.builder()
                .email(email).password(passwordEncoder.encode(password))
                .firstName(firstName).lastName(lastName).phone(phone)
                .role(role).status(UserStatus.ACTIVE).societyName("MyAangan Society")
                .build();
            userRepository.save(user);
            logger.info(logMsg);
        }
    }

    private void createDefaultCategories() {
        List<String[]> defaults = List.of(
            new String[]{"Painter",           "🎨"},
            new String[]{"Electrician",        "⚡"},
            new String[]{"Plumber",            "🔧"},
            new String[]{"Maid / Housekeeping","🧹"},
            new String[]{"Tiles & Granite",    "🪟"},
            new String[]{"Carpenter",          "🪚"}
        );
        for (String[] cat : defaults) {
            if (!categoryRepository.existsByNameIgnoreCase(cat[0])) {
                categoryRepository.save(ServiceCategory.builder()
                    .name(cat[0]).icon(cat[1]).active(true).build());
                logger.info("Default category created: {}", cat[0]);
            }
        }
    }

    private void createEscalationSettings() {
        seedSetting("FM_SLA_HOURS",  48,  "Hours before FM auto-escalates to Builder Manager");
        seedSetting("BM_SLA_HOURS",  168, "Hours before BM auto-escalates to BDA Engineer (7 days)");
        seedSetting("BDA_SLA_HOURS", 720, "Hours BDA Engineer has before President can escalate (30 days)");
    }

    private void seedSetting(String key, int hours, String desc) {
        if (escalationSettingRepository.findBySettingKey(key).isEmpty()) {
            escalationSettingRepository.save(EscalationSetting.builder()
                .settingKey(key).hours(hours).description(desc).build());
            logger.info("Escalation setting seeded: {} = {} hours", key, hours);
        }
    }

    private void seedDefaultPermissions() {
        try {
            if (rolePermissionRepository.count() > 0) return;
        } catch (Exception e) {
            logger.warn("Could not check permission count: {}", e.getMessage());
            return;
        }

        // ── Security Guard ────────────────────────────────────────────────────
        grant(Role.SECURITY_GUARD, Permission.DELIVERY_LOG);
        grant(Role.SECURITY_GUARD, Permission.DELIVERY_VIEW_ALL);
        grant(Role.SECURITY_GUARD, Permission.SERVICE_VIEW);
        grant(Role.SECURITY_GUARD, Permission.POLL_VIEW);
        grant(Role.SECURITY_GUARD, Permission.POLL_VOTE);

        // ── Resident ──────────────────────────────────────────────────────────
        grant(Role.RESIDENT, Permission.DELIVERY_VIEW_OWN);
        grant(Role.RESIDENT, Permission.DELIVERY_OTP_RESIDENT);
        grant(Role.RESIDENT, Permission.DELIVERY_PREFERENCES);
        grant(Role.RESIDENT, Permission.COMPLAINT_RAISE);
        grant(Role.RESIDENT, Permission.COMPLAINT_VIEW_OWN);
        grant(Role.RESIDENT, Permission.SERVICE_VIEW);
        grant(Role.RESIDENT, Permission.SERVICE_ADD);
        grant(Role.RESIDENT, Permission.SERVICE_REVIEW);
        grant(Role.RESIDENT, Permission.POLL_VIEW);
        grant(Role.RESIDENT, Permission.POLL_VOTE);

        // ── Facility Manager ──────────────────────────────────────────────────
        grant(Role.FACILITY_MANAGER, Permission.COMPLAINT_RAISE);
        grant(Role.FACILITY_MANAGER, Permission.COMPLAINT_VIEW_OWN);
        grant(Role.FACILITY_MANAGER, Permission.COMPLAINT_VIEW_ALL);
        grant(Role.FACILITY_MANAGER, Permission.COMPLAINT_MANAGE);
        grant(Role.FACILITY_MANAGER, Permission.COMPLAINT_INTERNAL_NOTE);
        grant(Role.FACILITY_MANAGER, Permission.COMPLAINT_ESCALATE);
        grant(Role.FACILITY_MANAGER, Permission.SERVICE_VIEW);
        grant(Role.FACILITY_MANAGER, Permission.POLL_VIEW);
        grant(Role.FACILITY_MANAGER, Permission.POLL_VOTE);

        // ── Builder Manager ───────────────────────────────────────────────────
        grant(Role.BUILDER_MANAGER, Permission.COMPLAINT_VIEW_ALL);
        grant(Role.BUILDER_MANAGER, Permission.COMPLAINT_MANAGE);
        grant(Role.BUILDER_MANAGER, Permission.COMPLAINT_INTERNAL_NOTE);
        grant(Role.BUILDER_MANAGER, Permission.COMPLAINT_ESCALATE);
        grant(Role.BUILDER_MANAGER, Permission.SERVICE_VIEW);
        grant(Role.BUILDER_MANAGER, Permission.POLL_VIEW);
        grant(Role.BUILDER_MANAGER, Permission.POLL_VOTE);

        // ── BDA Engineer ──────────────────────────────────────────────────────
        grant(Role.BDA_ENGINEER, Permission.COMPLAINT_VIEW_ALL);
        grant(Role.BDA_ENGINEER, Permission.COMPLAINT_MANAGE);
        grant(Role.BDA_ENGINEER, Permission.COMPLAINT_INTERNAL_NOTE);
        grant(Role.BDA_ENGINEER, Permission.SERVICE_VIEW);
        grant(Role.BDA_ENGINEER, Permission.POLL_VIEW);
        grant(Role.BDA_ENGINEER, Permission.POLL_VOTE);

        // ── President ─────────────────────────────────────────────────────────
        grant(Role.PRESIDENT, Permission.COMPLAINT_RAISE);
        grant(Role.PRESIDENT, Permission.COMPLAINT_VIEW_OWN);
        grant(Role.PRESIDENT, Permission.COMPLAINT_VIEW_ALL);
        grant(Role.PRESIDENT, Permission.COMPLAINT_PDF);
        grant(Role.PRESIDENT, Permission.SERVICE_VIEW);
        grant(Role.PRESIDENT, Permission.POLL_VIEW);
        grant(Role.PRESIDENT, Permission.POLL_VOTE);
        grant(Role.PRESIDENT, Permission.POLL_MANAGE);

        // ── Secretary ─────────────────────────────────────────────────────────
        grant(Role.SECRETARY, Permission.COMPLAINT_RAISE);
        grant(Role.SECRETARY, Permission.COMPLAINT_VIEW_OWN);
        grant(Role.SECRETARY, Permission.COMPLAINT_VIEW_ALL);
        grant(Role.SECRETARY, Permission.COMPLAINT_PDF);
        grant(Role.SECRETARY, Permission.SERVICE_VIEW);
        grant(Role.SECRETARY, Permission.POLL_VIEW);
        grant(Role.SECRETARY, Permission.POLL_VOTE);
        grant(Role.SECRETARY, Permission.POLL_MANAGE);

        // ── Volunteer ─────────────────────────────────────────────────────────
        grant(Role.VOLUNTEER, Permission.DELIVERY_VIEW_OWN);
        grant(Role.VOLUNTEER, Permission.DELIVERY_OTP_RESIDENT);
        grant(Role.VOLUNTEER, Permission.DELIVERY_PREFERENCES);
        grant(Role.VOLUNTEER, Permission.COMPLAINT_RAISE);
        grant(Role.VOLUNTEER, Permission.COMPLAINT_VIEW_OWN);
        grant(Role.VOLUNTEER, Permission.COMPLAINT_VIEW_ALL);
        grant(Role.VOLUNTEER, Permission.COMPLAINT_PDF);
        grant(Role.VOLUNTEER, Permission.SERVICE_VIEW);
        grant(Role.VOLUNTEER, Permission.SERVICE_ADD);
        grant(Role.VOLUNTEER, Permission.SERVICE_REVIEW);
        grant(Role.VOLUNTEER, Permission.POLL_VIEW);
        grant(Role.VOLUNTEER, Permission.POLL_VOTE);
        grant(Role.VOLUNTEER, Permission.POLL_MANAGE);

        logger.info("✅ Default role permissions seeded");
    }

    private void grant(Role role, Permission permission) {
        try {
            rolePermissionRepository.save(RolePermission.builder()
                .role(role).permission(permission).granted(true).build());
        } catch (Exception e) {
            logger.debug("Permission already exists or could not be saved: {} / {}", role, permission);
        }
    }

}