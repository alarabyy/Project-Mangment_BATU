import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Faculty } from '../../../models/faculty';
import { FacultyService } from '../../../Services/faculty.service';
import { CommonModule } from '@angular/common'; // مهم لاستخدام *ngIf و *ngFor

/**
 * @component FacultyListComponent
 * @description Manages the display and interaction logic for the faculties list.
 * It uses FacultyService for data operations and handles UI states and animations.
 */
@Component({
  selector: 'app-faculty-list',
  templateUrl: './faculty-list.component.html',
  styleUrls: ['./faculty-list.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class FacultyListComponent implements OnInit {
  public faculties: Faculty[] = [];
  public isLoading: boolean = true;
  public errorMessage: string | null = null;
  public deletingFacultyIds = new Set<number>(); // يستخدم لتتبع الأقسام التي يتم حذفها

  constructor(
    private facultyService: FacultyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFaculties();
  }

  /**
   * @method loadFaculties
   * @description Fetches faculties using the service and handles UI states.
   */
  public async loadFaculties(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    try {
      const faculties$ = this.facultyService.getFaculties();
      this.faculties = await firstValueFrom(faculties$);
    } catch (error) {
      console.error('API Error:', error);
      this.errorMessage = 'Failed to load data. The server might be down or an issue occurred.';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * @method deleteFaculty
   * @description Deletes a faculty with an exit animation and updates the list.
   * @param facultyId - The ID of the faculty to delete.
   */
  public async deleteFaculty(facultyId: number): Promise<void> {
    // منع الحذف المتعدد لنفس العنصر
    if (this.deletingFacultyIds.has(facultyId)) {
      console.warn(`Deletion already in progress for faculty ID: ${facultyId}`);
      return;
    }

    const confirmation = confirm('Are you sure you want to permanently delete this faculty? This action cannot be undone.');
    if (!confirmation) {
      return;
    }

    // أضف الـ ID إلى المجموعة لتفعيل animation الحذف
    this.deletingFacultyIds.add(facultyId);

    // انتظر قليلاً للسماح لـ animation الحذف بالتشغيل قبل الإزالة الفعلية
    setTimeout(async () => {
      try {
        await firstValueFrom(this.facultyService.deleteFaculty(facultyId));
        // قم بإزالة العنصر من المصفوفة بعد الحذف الناجح
        this.faculties = this.faculties.filter(f => f.id !== facultyId);
        // قم بإزالة الـ ID من مجموعة التتبع
        this.deletingFacultyIds.delete(facultyId);
        console.log(`Faculty with ID ${facultyId} deleted successfully.`);
      } catch (error) {
        console.error('Deletion Error:', error);
        this.errorMessage = `Failed to delete faculty ID: ${facultyId}. Please try again.`;
        // في حالة الفشل، أزل الـ ID للسماح بالمحاولة مرة أخرى وإظهار العنصر
        this.deletingFacultyIds.delete(facultyId);
      }
    }, 500); // يجب أن تتوافق هذه المدة مع مدة animation الإزالة (fadeOutShrink) في CSS
  }

  /**
   * @method addFaculty
   * @description Navigates to the add faculty page.
   */
  public addFaculty(): void {
    this.router.navigate(['/add-faculty']); // المسار لصفحة إضافة قسم جديد
  }

  /**
   * @method editFaculty
   * @description Navigates to the faculty edit page with the specified faculty ID.
   * @param facultyId - The ID of the faculty to edit.
   */
  public editFaculty(facultyId: number): void {
    this.router.navigate(['/facultyEdit', facultyId]); // المسار المطلوب لصفحة التعديل
  }
}
