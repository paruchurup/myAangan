package com.myaangan.service;

import com.myaangan.dto.*;
import com.myaangan.entity.*;
import com.myaangan.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ServiceProviderService {

    private final ServiceProviderRepository providerRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final ServiceReviewRepository reviewRepository;
    private final UserRepository userRepository;

    // ── List / Search ────────────────────────────────────────────────────────

    public List<ProviderSummaryResponse> getAll(Long categoryId, String search) {
        List<ServiceProvider> providers;

        if (search != null && !search.isBlank() && categoryId != null) {
            providers = providerRepository.searchByNameAndCategory(search.trim(), categoryId);
        } else if (search != null && !search.isBlank()) {
            providers = providerRepository.searchByName(search.trim());
        } else if (categoryId != null) {
            providers = providerRepository.findByCategoryIdAndActiveTrueOrderByAvgRatingDesc(categoryId);
        } else {
            providers = providerRepository.findByActiveTrueOrderByAvgRatingDesc();
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

    // ── Add Provider ─────────────────────────────────────────────────────────

    public ProviderSummaryResponse create(ProviderRequest req, String userEmail) {
        ServiceCategory category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (providerRepository.existsByPhone(req.getPhone())) {
            throw new RuntimeException(
                "A provider with this phone number already exists in the directory");
        }

        com.myaangan.entity.User addedBy = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ServiceProvider provider = ServiceProvider.builder()
                .name(req.getName().trim())
                .phone(req.getPhone())
                .area(req.getArea())
                .category(category)
                .addedBy(addedBy)
                .availability(ServiceProvider.Availability.AVAILABLE)
                .avgRating(0.0)
                .reviewCount(0)
                .active(true)
                .build();

        return ProviderSummaryResponse.from(providerRepository.save(provider));
    }

    // ── Update Provider ───────────────────────────────────────────────────────

    public ProviderSummaryResponse update(Long id, ProviderUpdateRequest req, String userEmail) {
        ServiceProvider provider = providerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service provider not found"));

        if (req.getName() != null) provider.setName(req.getName().trim());
        if (req.getPhone() != null) provider.setPhone(req.getPhone());
        if (req.getArea() != null) provider.setArea(req.getArea());
        if (req.getAvailability() != null) {
            provider.setAvailability(
                ServiceProvider.Availability.valueOf(req.getAvailability()));
        }
        if (req.getCategoryId() != null) {
            ServiceCategory cat = categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            provider.setCategory(cat);
        }

        return ProviderSummaryResponse.from(providerRepository.save(provider));
    }

    // ── Delete Provider (admin only) ──────────────────────────────────────────

    public void delete(Long id) {
        ServiceProvider provider = providerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service provider not found"));
        provider.setActive(false);
        providerRepository.save(provider);
    }

    // ── Reviews ───────────────────────────────────────────────────────────────

    public ReviewResponse addOrUpdateReview(Long providerId, ReviewRequest req, String userEmail) {
        ServiceProvider provider = providerRepository.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Service provider not found"));

        com.myaangan.entity.User reviewer = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if this user already reviewed — update if yes
        ServiceReview review = reviewRepository
                .findByProviderIdAndReviewedByEmail(providerId, userEmail)
                .orElse(ServiceReview.builder()
                        .provider(provider)
                        .reviewedBy(reviewer)
                        .build());

        review.setStars(req.getStars());
        review.setComment(req.getComment());
        reviewRepository.save(review);

        // Recalculate cached avg rating and count
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
