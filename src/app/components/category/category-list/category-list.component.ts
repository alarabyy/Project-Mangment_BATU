import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common'; // مهم لاستخدام *ngIf و *ngFor
import { Category } from '../../../models/category';
import { CategoryService } from '../../../Services/category.service';

/**
 * @component CategoryListComponent
 * @description Manages the display and interaction logic for the categories list.
 * It uses CategoryService for data operations and handles UI states and animations.
 */
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
  public deletingCategoryIds = new Set<number>(); // يستخدم لتتبع الفئات التي يتم حذفها

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  /**
   * @method loadCategories
   * @description Fetches categories using the service and handles UI states.
   */
  public async loadCategories(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    try {
      const categories$ = this.categoryService.getAllCategories();
      this.categories = await firstValueFrom(categories$);
    } catch (error) {
      console.error('API Error:', error);
      this.errorMessage = 'Failed to load categories. The server might be down or an issue occurred.';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * @method deleteCategory
   * @description Deletes a category with an exit animation and updates the list.
   * @param categoryId - The ID of the category to delete.
   */
  public async deleteCategory(categoryId: number): Promise<void> {
    // منع الحذف المتعدد لنفس العنصر
    if (this.deletingCategoryIds.has(categoryId)) {
      console.warn(`Deletion already in progress for category ID: ${categoryId}`);
      return;
    }

    const confirmation = confirm('Are you sure you want to permanently delete this category? This action cannot be undone.');
    if (!confirmation) {
      return;
    }

    // أضف الـ ID إلى المجموعة لتفعيل animation الحذف
    this.deletingCategoryIds.add(categoryId);

    // انتظر قليلاً للسماح لـ animation الحذف بالتشغيل قبل الإزالة الفعلية
    setTimeout(async () => {
      try {
        await firstValueFrom(this.categoryService.deleteCategory(categoryId));
        // قم بإزالة العنصر من المصفوفة بعد الحذف الناجح
        this.categories = this.categories.filter(c => c.id !== categoryId);
        // قم بإزالة الـ ID من مجموعة التتبع
        this.deletingCategoryIds.delete(categoryId);
        console.log(`Category with ID ${categoryId} deleted successfully.`);
      } catch (error) {
        console.error('Deletion Error:', error);
        this.errorMessage = `Failed to delete category ID: ${categoryId}. Please try again.`;
        // في حالة الفشل، أزل الـ ID للسماح بالمحاولة مرة أخرى وإظهار العنصر
        this.deletingCategoryIds.delete(categoryId);
      }
    }, 500); // يجب أن تتوافق هذه المدة مع مدة animation الإزالة (fadeOutShrink) في CSS
  }

  /**
   * @method addCategory
   * @description Navigates to the add category page.
   */
  public addCategory(): void {
    this.router.navigate(['/add-category']); // المسار لصفحة إضافة فئة جديدة
  }

  /**
   * @method editCategory
   * @description Navigates to the category edit page with the specified category ID.
   * @param categoryId - The ID of the category to edit.
   */
  public editCategory(categoryId: number): void {
    this.router.navigate(['/categoryEdit', categoryId]); // المسار المطلوب لصفحة التعديل
  }
}
