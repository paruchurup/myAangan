package com.myaangan.repository;
import com.myaangan.entity.HelpdeskComment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HelpdeskCommentRepository extends JpaRepository<HelpdeskComment, Long> {
    List<HelpdeskComment> findByRequestIdOrderByCreatedAtAsc(Long requestId);
}
