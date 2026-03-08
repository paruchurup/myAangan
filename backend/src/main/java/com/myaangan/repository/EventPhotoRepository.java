package com.myaangan.repository;
import com.myaangan.entity.EventPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EventPhotoRepository extends JpaRepository<EventPhoto, Long> {
    List<EventPhoto> findByEventIdOrderByUploadedAtDesc(Long eventId);
}
