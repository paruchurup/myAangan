package com.myaangan.service;

import com.myaangan.dto.*;
import com.myaangan.entity.*;
import com.myaangan.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ServiceProviderService {

    private final ServiceProviderRepository providerRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final ServiceReviewRepository reviewRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.dir:/app/uploads/photos}")
    private String uploadDir;

    // ── List / Search ─────────────────────────────────────────────────────────

    public List<ProviderSummaryResponse> getAll(Long categoryId, String search, String sort) {
        List<ServiceProvider> providers;
        boolean mostReviewed = "most_reviewed".equals(sort);

        if (search != null && !search.isBlank()) {
            providers = categoryId != null
                ? providerRepository.searchByNameAndCategory(search.trim(), categoryId)
                : providerRepository.searchByName(search.trim());
        } else if (categoryId != null) {
            providers = mostReviewed
                ? providerRepository.findByCategoryIdAndActiveTrueOrderByReviewCountDesc(categoryId)
                : providerRepository.findByCategoryIdAndActiveTrueOrderByAvgRatingDesc(categoryId);
        } else {
            providers = mostReviewed
                ? providerRepository.findByActiveTrueOrderByReviewCountDesc()
                : providerRepository.findByActiveTrueOrderByAvgRatingDesc();
        }

        return providers.stream().map(ProviderSummaryResponse::from).collect(Collectors.toList());
    }

    public ProviderDetailResponse getById(Long id) {
        ServiceProvider provider = providerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service provider not found"));
        List<ReviewResponse> reviews = reviewRepository
                .findByProviderIdOrderByCreatedAtDesc(id)
                .stream().map(ReviewResponse::from).collect(Collectors.toList());
        return ProviderDetailResponse.from(provider, reviews);
    }

    public List<ProviderSummaryResponse> getMyProviders(String email) {
        return providerRepository
                .findByAddedByEmailAndActiveTrueOrderByCreatedAtDesc(email)
                .stream().map(ProviderSummaryResponse::from).collect(Collectors.toList());
    }

    // ── Create ────────────────────────────────────────────────────────────────

    public ProviderSummaryResponse create(ProviderRequest req, String userEmail) {
        ServiceCategory category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (providerRepository.existsByPhone(req.getPhone())) {
            throw new RuntimeException(
                "A provider with this phone number already exists in the directory");
        }

        User addedBy = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ServiceProvider provider = ServiceProvider.builder()
                .name(req.getName().trim())
                .phone(req.getPhone())
                .area(req.getArea())
                .category(category)
                .addedBy(addedBy)
                .availability(ServiceProvider.Availability.AVAILABLE)
                .build();

        return ProviderSummaryResponse.from(providerRepository.save(provider));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public ProviderSummaryResponse update(Long id, ProviderUpdateRequest req, String userEmail) {
        ServiceProvider provider = providerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service provider not found"));

        // Phone uniqueness check — exclude self
        if (req.getPhone() != null && !req.getPhone().equals(provider.getPhone())) {
            if (providerRepository.existsByPhoneAndIdNot(req.getPhone(), id)) {
                throw new RuntimeException("Another provider with this phone number already exists");
            }
        }

        if (req.getName() != null)         provider.setName(req.getName().trim());
        if (req.getPhone() != null)         provider.setPhone(req.getPhone());
        if (req.getArea() != null)          provider.setArea(req.getArea());
        if (req.getAvailability() != null)  provider.setAvailability(
                ServiceProvider.Availability.valueOf(req.getAvailability()));
        if (req.getCategoryId() != null) {
            ServiceCategory cat = categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            provider.setCategory(cat);
        }

        return ProviderSummaryResponse.from(providerRepository.save(provider));
    }

    // ── Photo Upload ──────────────────────────────────────────────────────────

    public ProviderSummaryResponse uploadPhoto(Long id, MultipartFile file, String userEmail) {
        ServiceProvider provider = providerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service provider not found"));

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("Photo must be under 5MB");
        }

        try {
            // Delete old photo if exists
            if (provider.getPhotoFilename() != null) {
                Files.deleteIfExists(Paths.get(uploadDir, provider.getPhotoFilename()));
            }

            // Save new photo with unique filename
            String ext = contentType.contains("png") ? ".png"
                       : contentType.contains("gif") ? ".gif" : ".jpg";
            String filename = UUID.randomUUID().toString() + ext;

            Path uploadPath = Paths.get(uploadDir);
            Files.createDirectories(uploadPath);
            Files.copy(file.getInputStream(), uploadPath.resolve(filename),
                       StandardCopyOption.REPLACE_EXISTING);

            provider.setPhotoFilename(filename);
            return ProviderSummaryResponse.from(providerRepository.save(provider));

        } catch (IOException e) {
            throw new RuntimeException("Failed to save photo: " + e.getMessage());
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    public void delete(Long id) {
        ServiceProvider provider = providerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service provider not found"));
        // Delete photo file if exists
        if (provider.getPhotoFilename() != null) {
            try { Files.deleteIfExists(Paths.get(uploadDir, provider.getPhotoFilename())); }
            catch (IOException ignored) {}
        }
        provider.setActive(false);
        providerRepository.save(provider);
    }

    // ── Reviews ───────────────────────────────────────────────────────────────

    public ReviewResponse addOrUpdateReview(Long providerId, ReviewRequest req, String userEmail) {
        ServiceProvider provider = providerRepository.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Service provider not found"));

        User reviewer = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ServiceReview review = reviewRepository
                .findByProviderIdAndReviewedByEmail(providerId, userEmail)
                .orElse(ServiceReview.builder()
                        .provider(provider).reviewedBy(reviewer).build());

        review.setStars(req.getStars());
        review.setComment(req.getComment());
        reviewRepository.save(review);
        recalculateRating(provider);
        return ReviewResponse.from(review);
    }

    public void deleteReview(Long providerId, Long reviewId) {
        ServiceReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        reviewRepository.delete(review);
        ServiceProvider provider = providerRepository.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Provider not found"));
        recalculateRating(provider);
    }

    private void recalculateRating(ServiceProvider provider) {
        Double avg = reviewRepository.getAvgRatingForProvider(provider.getId());
        long count = reviewRepository.countByProviderId(provider.getId());
        provider.setAvgRating(avg != null ? avg : 0.0);
        provider.setReviewCount((int) count);
        providerRepository.save(provider);
    }
}
