import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FacultyCreatePayload } from '../../../models/faculty'; // تأكد من المسار
import { FacultyService } from '../../../Services/faculty.service'; // تأكد من المسار
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-add-faculty',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-faculty.component.html',
  styleUrls: ['./add-faculty.component.css']
})
export class AddFacultyComponent implements OnInit {
  // Initializing newFaculty with default values to avoid errors with two-way binding
  newFaculty: FacultyCreatePayload = {
    name: '',
    description: '',
    deanId: null as any, // Use null and handle validation for number input
    deanName: ''
  };
  isSaving: boolean = false;
  errorMessage: string | null = null;
  saveSuccess: boolean = false;

  constructor(
    private facultyService: FacultyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // No initial data loading needed for adding a new faculty
  }

  /**
   * @public
   * @method createFaculty
   * Handles the form submission to create a new faculty.
   */
  public createFaculty(): void {
    // Client-side validation
    if (!this.newFaculty.name || this.newFaculty.name.trim() === '') {
      this.errorMessage = 'Faculty Name cannot be empty.';
      return;
    }
    if (!this.newFaculty.description || this.newFaculty.description.trim() === '') {
      this.errorMessage = 'Description cannot be empty.';
      return;
    }
    if (typeof this.newFaculty.deanId !== 'number' || isNaN(this.newFaculty.deanId) || this.newFaculty.deanId <= 0) {
      this.errorMessage = 'Dean ID is required and must be a positive number.';
      return;
    }
    if (!this.newFaculty.deanName || this.newFaculty.deanName.trim() === '') {
      this.errorMessage = 'Dean Name cannot be empty.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;
    this.saveSuccess = false;

    this.facultyService.createFaculty(this.newFaculty).pipe(
      finalize(() => this.isSaving = false),
      catchError(err => {
        console.error('Error creating faculty:', err);
        this.errorMessage = 'Failed to create faculty. Please check your input and try again.';
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.saveSuccess = true;
        console.log('Faculty created successfully!', response);
        // Navigate back to the list after a short delay to show success message
        setTimeout(() => {
          this.router.navigate(['/FacultyList']);
        }, 1500);
      }
    });
  }

  /**
   * @public
   * @method cancel
   * Navigates back to the faculty list without saving changes.
   */
  public cancel(): void {
    this.router.navigate(['/FacultyList']);
  }
}
