import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Faculty, FacultyCreatePayload } from '../../../models/faculty'; // تأكد من المسار
import { FacultyService } from '../../../Services/faculty.service'; // تأكد من المسار
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-faculty-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './faculty-edit.component.html',
  styleUrls: ['./faculty-edit.component.css']
})
export class FacultyEditComponent implements OnInit {
  facultyId: number | null = null;
  faculty: Faculty | null = null;
  isLoading: boolean = true;
  isSaving: boolean = false;
  errorMessage: string | null = null;
  saveSuccess: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private facultyService: FacultyService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.facultyId = idParam ? +idParam : null;

    if (this.facultyId === null || isNaN(this.facultyId) || this.facultyId <= 0) {
      this.errorMessage = 'Invalid or missing Faculty ID. Please navigate from the faculties list.';
      this.isLoading = false;
      return;
    }
    this.loadFacultyDetails();
  }

  /**
   * @private
   * @method loadFacultyDetails
   * Loads the details of the faculty to be edited.
   */
  private loadFacultyDetails(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.facultyService.getFacultyById(this.facultyId!).pipe(
      finalize(() => this.isLoading = false),
      catchError(err => {
        console.error('Error fetching faculty details:', err);
        if (err.status === 404) {
          this.errorMessage = 'Faculty not found. It might have been deleted.';
        } else {
          this.errorMessage = 'Failed to load faculty details. Please try again later.';
        }
        return of(null);
      })
    ).subscribe(data => {
      if (data) {
        // Create a deep copy to prevent direct mutation and ensure form data is distinct
        this.faculty = { ...data, dean: { ...data.dean } };
      } else {
        this.faculty = null;
        // Error message is set in catchError
      }
    });
  }

  /**
   * @public
   * @method saveChanges
   * Saves the updated faculty details to the API.
   */
  public saveChanges(): void {
    if (!this.faculty) {
      this.errorMessage = 'No faculty data to save.';
      return;
    }

    // Client-side validation
    if (!this.faculty.name || this.faculty.name.trim() === '') {
      this.errorMessage = 'Faculty Name cannot be empty.';
      return;
    }
    if (!this.faculty.description || this.faculty.description.trim() === '') {
      this.errorMessage = 'Description cannot be empty.';
      return;
    }
    if (typeof this.faculty.deanId !== 'number' || isNaN(this.faculty.deanId) || this.faculty.deanId <= 0) {
      this.errorMessage = 'Dean ID is required and must be a positive number.';
      return;
    }
    if (!this.faculty.dean.name || this.faculty.dean.name.trim() === '') {
      this.errorMessage = 'Dean Name cannot be empty.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;
    this.saveSuccess = false;

    this.facultyService.updateFaculty(this.faculty).pipe(
      finalize(() => this.isSaving = false),
      catchError(err => {
        console.error('Error updating faculty:', err);
        this.errorMessage = 'Failed to update faculty. Please check your input and try again.';
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.saveSuccess = true;
        console.log('Faculty updated successfully!', response);
        setTimeout(() => {
          this.router.navigate(['/FacultyList']); // Navigate back to the list page
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
