package com.myaangan.service;

import com.myaangan.dto.CategoryRequest;
import com.myaangan.dto.CategoryResponse;
import com.myaangan.entity.ServiceCategory;
import com.myaangan.repository.ServiceCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ServiceCategoryService {

    private final ServiceCategoryRepository categoryRepository;

    public List<CategoryResponse> getAllActive() {
        return categoryRepository.findByActiveTrueOrderByNameAsc()
                .stream().map(CategoryResponse::from).collect(Collectors.toList());
    }

    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll()
                .stream().map(CategoryResponse::from).collect(Collectors.toList());
    }

    public CategoryResponse create(CategoryRequest req) {
        if (categoryRepository.existsByNameIgnoreCase(req.getName())) {
            throw new RuntimeException("Category '" + req.getName() + "' already exists");
        }
        ServiceCategory category = ServiceCategory.builder()
                .name(req.getName().trim())
                .icon(req.getIcon() != null ? req.getIcon() : "🔧")
                .active(true)
                .build();
        return CategoryResponse.from(categoryRepository.save(category));
    }

    public CategoryResponse update(Long id, CategoryRequest req) {
        ServiceCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        category.setName(req.getName().trim());
        if (req.getIcon() != null) category.setIcon(req.getIcon());
        return CategoryResponse.from(categoryRepository.save(category));
    }

    public void delete(Long id) {
        ServiceCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        // Soft delete
        category.setActive(false);
        categoryRepository.save(category);
    }
}
