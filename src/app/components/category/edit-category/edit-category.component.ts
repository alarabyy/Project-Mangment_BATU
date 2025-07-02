import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Category } from '../../../models/category'; // تأكد من المسار
import { CategoryService } from '../../../Services/category.service'; // تأكد من المسار
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-edit-category',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './edit-category.component.html',
  styleUrls: ['./edit-category.component.css']
})
export class EditCategoryComponent implements OnInit {
  categoryId: number | null = null;
  category: Category | null = null;
  isLoading: boolean = true;
  isSaving: boolean = false;
  errorMessage: string | null = null;
  saveSuccess: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.categoryId = idParam ? +idParam : null;

    if (this.categoryId === null || isNaN(this.categoryId) || this.categoryId <= 0) {
      this.errorMessage = 'Invalid or missing Category ID. Please navigate from the categories list.';
      this.isLoading = false;
      return;
    }
    this.loadCategoryDetails();
  }

  /**
   * @private
   * @method loadCategoryDetails
   * Loads the details of the category to be edited.
   */
  private loadCategoryDetails(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.categoryService.getCategoryById(this.categoryId!).pipe(
      finalize(() => this.isLoading = false),
      catchError(err => {
        console.error('Error fetching category details:', err);
        if (err.status === 404) {
          this.errorMessage = 'Category not found. It might have been deleted.';
        } else {
          this.errorMessage = 'Failed to load category details. Please try again later.';
        }
        return of(null);
      })
    ).subscribe(data => {
      if (data) {
        // Create a copy to edit
        this.category = { ...data };
      } else {
        this.category = null;
        // Error message is set in catchError
      }
    });
  }

  /**
   * @public
   * @method saveChanges
   * Saves the updated category details to the API.
   */
  public saveChanges(): void {
    if (!this.category) {
      this.errorMessage = 'No category data to save.';
      return;
    }

    // Client-side validation
    if (!this.category.name || this.category.name.trim() === '') {
      this.errorMessage = 'Category Name cannot be empty.';
      return;
    }
    if (!this.category.description || this.category.description.trim() === '') {
      this.errorMessage = 'Description cannot be empty.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;
    this.saveSuccess = false;

    this.categoryService.updateCategory(this.category).pipe(
      finalize(() => this.isSaving = false),
      catchError(err => {
        console.error('Error updating category:', err);
        this.errorMessage = 'Failed to update category. Please check your input and try again.';
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.saveSuccess = true;
        console.log('Category updated successfully!', response);
        // Navigate back to the list after a short delay to show success message
        setTimeout(() => {
          this.router.navigate(['/CategoryList']); // Navigate back to the list page
        }, 1500);
      }
    });
  }

  /**
   * @public
   * @method cancel
   * Navigates back to the category list without saving changes.
   */
  public cancel(): void {
    this.router.navigate(['/CategoryList']);
  }
}
