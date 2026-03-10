import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServiceDirectoryService } from '@services/service-directory.service';
import { Category } from '@models/service.model';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./categories.component.html",
  styleUrls: ["./categories.component.scss"]
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];
  loading = true;
  newName = '';
  newIcon = '🔧';
  adding = false;
  addError = '';
  addSuccess = false;
  editingId: number | null = null;
  editName = '';
  editIcon = '';

  constructor(private svc: ServiceDirectoryService) {}

  ngOnInit() { this.loadCategories(); }

  loadCategories() {
    this.loading = true;
    this.svc.getAllCategories().subscribe({
      next: r => { this.categories = r.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  addCategory() {
    if (!this.newName.trim()) return;
    this.adding = true;
    this.addError = '';
    this.addSuccess = false;

    this.svc.createCategory({ name: this.newName.trim(), icon: this.newIcon || '🔧' })
      .subscribe({
        next: () => {
          this.adding = false;
          this.addSuccess = true;
          this.newName = '';
          this.newIcon = '🔧';
          this.loadCategories();
          setTimeout(() => this.addSuccess = false, 3000);
        },
        error: err => {
          this.adding = false;
          this.addError = err.error?.message || 'Failed to add category';
        }
      });
  }

  startEdit(cat: Category) {
    this.editingId = cat.id;
    this.editName = cat.name;
    this.editIcon = cat.icon || '🔧';
  }

  saveEdit(cat: Category) {
    if (!this.editName.trim()) return;
    this.svc.updateCategory(cat.id, { name: this.editName.trim(), icon: this.editIcon })
      .subscribe({
        next: () => { this.editingId = null; this.loadCategories(); },
        error: err => alert(err.error?.message || 'Update failed')
      });
  }

  cancelEdit() { this.editingId = null; }

  deleteCategory(cat: Category) {
    if (!confirm(`Deactivate "${cat.name}"? It will be hidden from users.`)) return;
    this.svc.deleteCategory(cat.id).subscribe({
      next: () => this.loadCategories()
    });
  }
}
