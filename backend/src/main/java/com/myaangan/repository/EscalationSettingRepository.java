package com.myaangan.repository;

import com.myaangan.entity.EscalationSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EscalationSettingRepository extends JpaRepository<EscalationSetting, Long> {
    Optional<EscalationSetting> findBySettingKey(String settingKey);
}
