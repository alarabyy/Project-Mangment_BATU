import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Category } from '../../../models/category';
import { CategoryService } from '../../../Services/category.service';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class CategoryListComponent implements OnInit {
  public categories: Category[] = [];
  public isLoading: boolean = true;
  public errorMessage: string | null = null;
  public deletingCategoryIds = new Set<number>();

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  public async loadCategories(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    try {
      this.categories = await firstValueFrom(this.categoryService.getAllCategories());
    } catch (error) {
      console.error('API Error:', error);
      this.errorMessage = 'Failed to load categories. The server might be down or an issue occurred.';
    } finally {
      this.isLoading = false;
    }
  }

  public async deleteCategory(categoryId: number): Promise<void> {
    if (this.deletingCategoryIds.has(categoryId)) return;

    const confirmation = confirm('Are you sure you want to permanently delete this category? This action cannot be undone.');
    if (!confirmation) return;

    this.deletingCategoryIds.add(categoryId);
    setTimeout(async () => {
      try {
        await firstValueFrom(this.categoryService.deleteCategory(categoryId));
        this.categories = this.categories.filter(c => c.id !== categoryId);
      } catch (error) {
        console.error('Deletion Error:', error);
        this.errorMessage = `Failed to delete category ID: ${categoryId}. Please try again.`;
      } finally {
        this.deletingCategoryIds.delete(categoryId);
      }
    }, 500);
  }

  public addCategory(): void {
    // التنقل إلى صفحة الإضافة كما هو محدد في app.routes.ts
    this.router.navigate(['/add-category']);
  }

  public editCategory(categoryId: number): void {
    // التنقل إلى صفحة التعديل مع تمرير الـ ID
    this.router.navigate(['/categoryEdit', categoryId]);
  }

  // دالة لتحسين أداء العرض في *ngFor
  public trackByCategory(index: number, category: Category): number {
    return category.id;
  }
}
