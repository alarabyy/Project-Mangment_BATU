import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FacultyCreatePayload } from '../../../models/faculty';
import { FacultyService } from '../../../Services/faculty.service';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-add-faculty',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-faculty.component.html',
  styleUrls: ['./add-faculty.component.css']
})
export class AddFacultyComponent {
  // الآن، هذا التعريف صحيح تمامًا بفضل تعديل الواجهة
  newFaculty: FacultyCreatePayload = {
    name: '',
    description: '',
    deanId: null,
    deanName: ''
  };
  isSaving = false;
  errorMessage: string | null = null;
  saveSuccess = false;

  constructor(
    private facultyService: FacultyService,
    private router: Router
  ) {}

  public createFaculty(): void {
    if (this.isFormInvalid()) {
      // رسالة الخطأ يتم عرضها الآن من خلال التحقق الفوري في النموذج
      // يمكنك ترك هذا التحقق كحماية إضافية
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;
    this.saveSuccess = false;

    this.facultyService.createFaculty(this.newFaculty).pipe(
      finalize(() => this.isSaving = false),
      catchError(err => {
        this.errorMessage = err.error?.message || 'Failed to create faculty. Please try again.';
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.saveSuccess = true;
        // العودة إلى صفحة القائمة بعد 1.5 ثانية
        setTimeout(() => this.router.navigate(['/FacultyList']), 1500);
      }
    });
  }

  public cancel(): void {
    this.router.navigate(['/FacultyList']);
  }

  private isFormInvalid(): boolean {
    const model = this.newFaculty;
    return !model.name || model.name.trim().length < 3 ||
           !model.description || model.description.trim().length < 10 ||
           model.deanId === null || model.deanId <= 0 ||
           !model.deanName || model.deanName.trim().length < 3;
  }
}
