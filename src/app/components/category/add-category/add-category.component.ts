import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CategoryCreatePayload } from '../../../models/category'; // تأكد من المسار
import { CategoryService } from '../../../Services/category.service'; // تأكد من المسار
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-add-category',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.css']
})
export class AddCategoryComponent implements OnInit {
  // Initializing newCategory with default values for two-way binding
  newCategory: CategoryCreatePayload = {
    name: '',
    description: ''
  };
  isSaving: boolean = false;
  errorMessage: string | null = null;
  saveSuccess: boolean = false;

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // No initial data loading needed for adding a new category
  }

  /**
   * @public
   * @method createCategory
   * Handles the form submission to create a new category.
   */
  public createCategory(): void {
    // Client-side validation
    if (!this.newCategory.name || this.newCategory.name.trim() === '') {
      this.errorMessage = 'Category Name cannot be empty.';
      return;
    }
    if (!this.newCategory.description || this.newCategory.description.trim() === '') {
      this.errorMessage = 'Description cannot be empty.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;
    this.saveSuccess = false;

    this.categoryService.createCategory(this.newCategory).pipe(
      finalize(() => this.isSaving = false),
      catchError(err => {
        console.error('Error creating category:', err);
        this.errorMessage = 'Failed to create category. Please check your input and try again.';
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.saveSuccess = true;
        console.log('Category created successfully!', response);
        // Navigate back to the list after a short delay to show success message
        setTimeout(() => {
          this.router.navigate(['/CategoryList']);
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
