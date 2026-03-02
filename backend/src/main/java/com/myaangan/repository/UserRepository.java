package com.myaangan.repository;

import com.myaangan.entity.User;
import com.myaangan.enums.Role;
import com.myaangan.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    List<User> findByRole(Role role);
    List<User> findByStatus(UserStatus status);
    List<User> findByRoleAndStatus(Role role, UserStatus status);

    // Delivery: find resident by flat number to auto-link delivery
    Optional<User> findByFlatNumberAndBlockAndRoleAndStatus(
        String flatNumber, String block, Role role, UserStatus status);

    Optional<User> findByFlatNumberAndRoleAndStatus(
        String flatNumber, Role role, UserStatus status);
}
