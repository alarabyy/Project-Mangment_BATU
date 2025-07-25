import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Faculty } from '../../../models/faculty';
import { FacultyService } from '../../../Services/faculty.service';
import { catchError, finalize, firstValueFrom, of } from 'rxjs';

@Component({
  selector: 'app-faculty-list',
  templateUrl: './faculty-list.component.html',
  styleUrls: ['./faculty-list.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class FacultyListComponent implements OnInit {
  public faculties: Faculty[] = [];
  public isLoading = true;
  public errorMessage: string | null = null;
  public deletingFacultyIds = new Set<number>();

  constructor(
    private facultyService: FacultyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFaculties();
  }

  public async loadFaculties(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    try {
      // ***** التعديل هنا: استخدام getAllFaculties بدلاً من getFaculties *****
      this.faculties = await firstValueFrom(this.facultyService.getAllFaculties());
    } catch (error) {
      console.error('API Error:', error);
      this.errorMessage = 'Failed to load faculties. Server might be unavailable.';
    } finally {
      this.isLoading = false;
    }
  }

  public deleteFaculty(facultyId: number): void {
    if (this.deletingFacultyIds.has(facultyId)) return;
    const confirmation = confirm('Are you sure you want to permanently delete this faculty? This action cannot be undone.');
    if (!confirmation) return;

    this.deletingFacultyIds.add(facultyId);
    this.errorMessage = null;

    setTimeout(() => { // استخدام setTimeout اختياري، يمكن إزالته
      this.facultyService.deleteFaculty(facultyId).pipe(
        finalize(() => this.deletingFacultyIds.delete(facultyId))
      ).subscribe({
        next: () => {
          this.faculties = this.faculties.filter(f => f.id !== facultyId);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Deletion Error:', err);
          if (err.error?.message) {
            this.errorMessage = `Error: ${err.error.message}`;
          } else if (err.status === 409) {
            this.errorMessage = `Cannot delete faculty #${facultyId}. It is linked to other data (e.g., departments).`;
          } else {
            this.errorMessage = `Failed to delete faculty. Status: ${err.statusText || 'Unknown Error'}`;
          }
        }
      });
    }, 500);
  }

  public addFaculty(): void {
    this.router.navigate(['/add-faculty']);
  }

  public editFaculty(facultyId: number): void {
    this.router.navigate(['/facultyEdit', facultyId]);
  }

  public trackByFacultyId(index: number, faculty: Faculty): number {
    return faculty.id;
  }
}
