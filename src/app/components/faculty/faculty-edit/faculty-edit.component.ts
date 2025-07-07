import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Faculty } from '../../../models/faculty';
import { FacultyService } from '../../../Services/faculty.service';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-faculty-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faculty-edit.component.html',
  styleUrls: ['./faculty-edit.component.css']
})
export class FacultyEditComponent implements OnInit {
  facultyId: number | null = null;
  faculty: Faculty | null = null;
  isLoading = true;
  isSaving = false;
  errorMessage: string | null = null;
  saveSuccess = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private facultyService: FacultyService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.facultyId = +idParam;
      this.loadFacultyDetails();
    } else {
      this.isLoading = false;
      this.errorMessage = 'Faculty ID is missing from the URL.';
    }
  }

  loadFacultyDetails(): void {
    if (!this.facultyId) return;
    this.isLoading = true;
    this.facultyService.getFacultyById(this.facultyId).pipe(
      finalize(() => this.isLoading = false),
      catchError(err => {
        this.errorMessage = err.status === 404 ? 'Faculty not found.' : 'Failed to load details.';
        return of(null);
      })
    ).subscribe(data => {
      this.faculty = data;
    });
  }

  saveChanges(): void {
    if (!this.faculty || this.isFormInvalid()) {
      this.errorMessage = 'Please fill all fields with valid data.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;
    this.saveSuccess = false;

    this.facultyService.updateFaculty(this.faculty).pipe(
      finalize(() => this.isSaving = false),
      catchError(err => {
        this.errorMessage = err.error?.message || 'Failed to update faculty.';
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.saveSuccess = true;
        setTimeout(() => this.router.navigate(['/FacultyList']), 1500);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/FacultyList']);
  }

  private isFormInvalid(): boolean {
    if (!this.faculty) return true;
    const model = this.faculty;
    return !model.name || model.name.trim().length < 3 ||
           !model.description || model.description.trim().length < 10 ||
           model.deanId === null || model.deanId <= 0 ||
           !model.dean.name || model.dean.name.trim().length < 3;
  }
}
