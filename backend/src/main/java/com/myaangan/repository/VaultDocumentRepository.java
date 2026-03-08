package com.myaangan.repository;

import com.myaangan.entity.VaultDocument;
import com.myaangan.enums.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface VaultDocumentRepository extends JpaRepository<VaultDocument, Long> {
    // Society docs — all active, visible to everyone
    List<VaultDocument> findByTypeAndActiveTrueOrderByCreatedAtDesc(DocumentType type);

    // NOC docs for a specific resident
    List<VaultDocument> findByTypeAndResidentEmailAndActiveTrueOrderByCreatedAtDesc(
        DocumentType type, String email);

    // All docs for admin view
    List<VaultDocument> findAllByActiveTrueOrderByCreatedAtDesc();

    // All docs of a type (admin)
    List<VaultDocument> findByTypeAndActiveTrueOrderByCreatedAtDesc(DocumentType type, org.springframework.data.domain.Sort sort);

    @Query("SELECT d FROM VaultDocument d WHERE d.active = true AND " +
           "(d.type = 'SOCIETY' OR d.type = 'MAINTENANCE' OR d.resident.email = :email) " +
           "ORDER BY d.createdAt DESC")
    List<VaultDocument> findVisibleToResident(@org.springframework.data.repository.query.Param("email") String email);
}
