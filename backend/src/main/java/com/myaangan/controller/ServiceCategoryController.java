package com.myaangan.controller;

import com.myaangan.dto.CategoryRequest;
import com.myaangan.dto.CategoryResponse;
import com.myaangan.dto.UserDto;
import com.myaangan.service.ServiceCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services/categories")
@RequiredArgsConstructor
public class ServiceCategoryController {

    private final ServiceCategoryService categoryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESIDENT','VOLUNTEER','SECURITY_GUARD','FACILITY_MANAGER','BUILDER_MANAGER','BDA_ENGINEER','PRESIDENT','SECRETARY')")
    public ResponseEntity<UserDto.ApiResponse<List<CategoryResponse>>> getActive() {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK", categoryService.getAllActive()));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse<List<CategoryResponse>>> getAll() {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK", categoryService.getAll()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse<CategoryResponse>> create(
            @Valid @RequestBody CategoryRequest req) {
        return ResponseEntity.ok(
            UserDto.ApiResponse.success("Category created", categoryService.create(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse<CategoryResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest req) {
        return ResponseEntity.ok(
            UserDto.ApiResponse.success("Category updated", categoryService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse<Void>> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.ok(UserDto.ApiResponse.success("Category deleted", null));
    }
}
