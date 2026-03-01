package com.myaangan.config;

import com.myaangan.entity.ServiceCategory;
import com.myaangan.entity.User;
import com.myaangan.enums.Role;
import com.myaangan.enums.UserStatus;
import com.myaangan.repository.ServiceCategoryRepository;
import com.myaangan.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired private UserRepository userRepository;
    @Autowired private ServiceCategoryRepository categoryRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        createDefaultAdmin();
        createDefaultCategories();
    }

    private void createDefaultAdmin() {
        if (!userRepository.existsByEmail("admin@myaangan.com")) {
            User admin = User.builder()
                    .email("admin@myaangan.com")
                    .password(passwordEncoder.encode("Admin@1234"))
                    .firstName("Society")
                    .lastName("Admin")
                    .phone("9999999999")
                    .role(Role.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .societyName("MyAangan Society")
                    .build();
            userRepository.save(admin);
            logger.info("Default admin created: admin@myaangan.com / Admin@1234");
            logger.warn("IMPORTANT: Change the default admin password after first login!");
        }
    }

    private void createDefaultCategories() {
        List<String[]> defaults = List.of(
            new String[]{"Painter",          "🎨"},
            new String[]{"Electrician",       "⚡"},
            new String[]{"Plumber",           "🔧"},
            new String[]{"Maid / Housekeeping","🧹"},
            new String[]{"Tiles & Granite",   "🪟"},
            new String[]{"Carpenter",         "🪚"}
        );
        for (String[] cat : defaults) {
            if (!categoryRepository.existsByNameIgnoreCase(cat[0])) {
                categoryRepository.save(
                    ServiceCategory.builder()
                        .name(cat[0])
                        .icon(cat[1])
                        .active(true)
                        .build());
                logger.info("Default category created: {}", cat[0]);
            }
        }
    }
}
