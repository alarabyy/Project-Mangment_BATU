import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoryCreatePayload } from '../../../models/category';
import { CategoryService } from '../../../Services/category.service';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-add-category',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.css']
})
export class AddCategoryComponent {
  newCategory: CategoryCreatePayload = { name: '', description: '' };
  isSaving = false;
  errorMessage: string | null = null;
  saveSuccess = false;

  constructor(private categoryService: CategoryService, private router: Router) {}

  public createCategory(): void {
    if (this.isFormInvalid()) return;

    this.isSaving = true;
    this.errorMessage = null;
    this.saveSuccess = false;

    this.categoryService.createCategory(this.newCategory).pipe(
      finalize(() => (this.isSaving = false)),
      catchError(err => {
        this.errorMessage = err.error?.message || 'Failed to create category. Please try again.';
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
    if (!this.newCategory.name || this.newCategory.name.trim().length < 3) {
      return true;
    }
    if (!this.newCategory.description || this.newCategory.description.trim().length < 10) {
      return true;
    }
    return false;
  }
}
