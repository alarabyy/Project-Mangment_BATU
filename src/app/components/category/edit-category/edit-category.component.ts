import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Category } from '../../../models/category';
import { CategoryService } from '../../../Services/category.service';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-edit-category',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-category.component.html',
  styleUrls: ['./edit-category.component.css']
})
export class EditCategoryComponent implements OnInit {
  categoryId: number | null = null;
  category: Category | null = null;
  isLoading = true;
  isSaving = false;
  errorMessage: string | null = null;
  saveSuccess = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.categoryId = +id;
      this.loadCategoryDetails();
    } else {
      this.isLoading = false;
      this.errorMessage = 'Category ID is missing from the URL.';
    }
  }

  loadCategoryDetails(): void {
    if (!this.categoryId) return;
    this.isLoading = true;
    this.categoryService.getCategoryById(this.categoryId).pipe(
      finalize(() => (this.isLoading = false)),
      catchError(err => {
        this.errorMessage = err.status === 404 ? 'Category not found.' : 'Failed to load details.';
        return of(null);
      })
    ).subscribe(data => (this.category = data));
  }

  saveChanges(): void {
    if (!this.category || this.isFormInvalid()) return;

    this.isSaving = true;
    this.errorMessage = null;
    this.saveSuccess = false;

    this.categoryService.updateCategory(this.category).pipe(
      finalize(() => (this.isSaving = false)),
      catchError(err => {
        this.errorMessage = err.error?.message || 'Failed to update category. Please try again.';
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.saveSuccess = true;
        // عند النجاح، يتم عرض رسالة ثم العودة لصفحة القائمة
        setTimeout(() => this.router.navigate(['/CategoryList']), 1500);
      }
    });
  }

  public cancel(): void {
    this.router.navigate(['/CategoryList']);
  }

  private isFormInvalid(): boolean {
    if (!this.category) return true;
    if (!this.category.name || this.category.name.trim().length < 3) return true;
    if (!this.category.description || this.category.description.trim().length < 10) return true;
    return false;
  }
}
