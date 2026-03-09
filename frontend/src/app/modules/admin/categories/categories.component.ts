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
  template: `
    <div class="page">

      <div class="page-header">
        <div class="header-row">
          <a class="back-btn" routerLink="/dashboard">← Back</a>
        </div>
        <h1>📂 Service Categories</h1>
        <p>Manage service directory categories</p>
      </div>

      <!-- Add Category Form -->
      <div class="add-form">
        <h3>Add New Category</h3>
        <div class="input-row">
          <input
            type="text"
            [(ngModel)]="newIcon"
            placeholder="Icon (emoji)"
            class="icon-input"
            maxlength="4"
          />
          <input
            type="text"
            [(ngModel)]="newName"
            placeholder="Category name"
            class="name-input"
            (keyup.enter)="addCategory()"
          />
          <button class="btn-add" (click)="addCategory()"
            [disabled]="!newName.trim() || adding">
            {{ adding ? '...' : '+ Add' }}
          </button>
        </div>
        <div class="error-msg" *ngIf="addError">{{ addError }}</div>
        <div class="success-msg" *ngIf="addSuccess">✅ Category added!</div>
      </div>

      <!-- Categories List -->
      <div class="categories-section">
        <h3>All Categories</h3>
        <div class="loading" *ngIf="loading">Loading...</div>
        <div class="cat-list">
          <div class="cat-card" *ngFor="let cat of categories"
            [class.inactive]="!cat.active">

            <!-- View mode -->
            <ng-container *ngIf="editingId !== cat.id">
              <div class="cat-icon">{{ cat.icon || '🔧' }}</div>
              <div class="cat-info">
                <div class="cat-name">{{ cat.name }}</div>
                <div class="cat-status" [class.active]="cat.active">
                  {{ cat.active ? 'Active' : 'Inactive' }}
                </div>
              </div>
              <div class="cat-actions">
                <button class="btn-edit" (click)="startEdit(cat)">✏️</button>
                <button class="btn-del" (click)="deleteCategory(cat)"
                  *ngIf="cat.active">🗑</button>
              </div>
            </ng-container>

            <!-- Edit mode -->
            <ng-container *ngIf="editingId === cat.id">
              <input [(ngModel)]="editIcon" class="edit-icon" maxlength="4" />
              <input [(ngModel)]="editName" class="edit-name"
                (keyup.enter)="saveEdit(cat)" />
              <div class="cat-actions">
                <button class="btn-save" (click)="saveEdit(cat)">✅</button>
                <button class="btn-cancel" (click)="cancelEdit()">✕</button>
              </div>
            </ng-container>

          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f5f6fa; padding-bottom: 80px; }

    .page-header { background: linear-gradient(135deg, #1a1a2e, #0f3460); padding: 16px 16px 24px; color: white; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .back-btn { background: rgba(255,255,255,0.15); border: none; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .page-header h1 { font-size: 22px; margin: 0 0 4px; font-weight: 700; }
    .page-header p { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }

    .add-form {
      background: white; margin: 16px; border-radius: 14px; padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    }
    .add-form h3 { font-size: 15px; font-weight: 700; margin: 0 0 12px; color: #1a1a2e; }

    .input-row { display: flex; gap: 8px; align-items: center; }
    .icon-input {
      width: 56px; flex-shrink: 0; padding: 10px 8px; border: 1.5px solid #ddd;
      border-radius: 10px; font-size: 18px; text-align: center; outline: none;
    }
    .name-input {
      flex: 1; padding: 10px 12px; border: 1.5px solid #ddd;
      border-radius: 10px; font-size: 15px; outline: none;
    }
    .name-input:focus, .icon-input:focus { border-color: #0f3460; }
    .btn-add {
      background: #0f3460; color: white; border: none; padding: 10px 16px;
      border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer;
      white-space: nowrap;
    }
    .btn-add:disabled { background: #ccc; cursor: not-allowed; }

    .error-msg { color: #dc2626; font-size: 12px; margin-top: 8px; }
    .success-msg { color: #166534; font-size: 12px; margin-top: 8px; }

    .categories-section { padding: 0 16px; }
    .categories-section h3 { font-size: 15px; font-weight: 700; color: #1a1a2e; margin: 8px 0 12px; }
    .loading { text-align: center; color: #888; padding: 20px; }

    .cat-list { display: flex; flex-direction: column; gap: 8px; }
    .cat-card {
      background: white; border-radius: 12px; padding: 12px 14px;
      display: flex; align-items: center; gap: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .cat-card.inactive { opacity: 0.5; }
    .cat-icon { font-size: 26px; flex-shrink: 0; width: 36px; text-align: center; }
    .cat-info { flex: 1; }
    .cat-name { font-size: 15px; font-weight: 600; color: #1a1a2e; }
    .cat-status { font-size: 11px; margin-top: 2px; color: #aaa; }
    .cat-status.active { color: #166534; }

    .cat-actions { display: flex; gap: 6px; }
    .btn-edit, .btn-del, .btn-save, .btn-cancel {
      width: 34px; height: 34px; border-radius: 8px; border: none;
      font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .btn-edit { background: #e8f0fe; }
    .btn-del { background: #fee2e2; }
    .btn-save { background: #dcfce7; }
    .btn-cancel { background: #f3f4f6; }

    .edit-icon {
      width: 48px; padding: 6px; border: 1.5px solid #0f3460;
      border-radius: 8px; font-size: 18px; text-align: center; outline: none;
    }
    .edit-name {
      flex: 1; padding: 6px 10px; border: 1.5px solid #0f3460;
      border-radius: 8px; font-size: 14px; outline: none;
    }
  `]
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
