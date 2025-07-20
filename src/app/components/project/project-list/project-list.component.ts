import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of, TimeoutError } from 'rxjs'; // استيراد TimeoutError
import { CommonModule, SlicePipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../Services/project.service';
import { Project } from '../../../models/project';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, startWith, shareReplay, timeout } from 'rxjs/operators'; // استيراد timeout

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink, SlicePipe],
  providers: [DatePipe],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css']
})
export class ProjectListComponent implements OnInit {
  public filteredProjects$!: Observable<Project[]>;
  public searchTermSubject = new BehaviorSubject<string>('');
  public isLoading = true;
  public error: string | null = null;

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private datePipe: DatePipe // ليس مستخدماً حالياً ولكن جيد أن يكون موجوداً
  ) {}

  ngOnInit(): void {
    // إعادة تعيين الحالة عند إعادة التحميل
    this.isLoading = false;
    this.error = null;

    const allProjects$ = this.projectService.getProjects().pipe(
      // إضافة مهلة 10 ثوانٍ لطلب البيانات
       // يمكنك تعديل هذه القيمة (بالمللي ثانية) حسب الحاجة
      finalize(() => {
        // يتم تنفيذ هذا الكود سواء نجح الطلب أو فشل (بعد اكتمال أو خطأ)
        this.isLoading = false;
      }),
      catchError(err => {
        console.error('Error loading projects:', err);
        if (err instanceof TimeoutError) {
          this.error = 'Loading projects timed out. Please check your internet connection or try again.';
        } else {
          this.error = 'Failed to load projects. Please try again later.';
        }
        // إرجاع observable فارغ للسماح للتدفق بالاستمرار دون تعليق
        return of([]);
      }),
      // يضمن أن استدعاء API يتم مرة واحدة فقط ويتم مشاركة النتيجة بين المشتركين
      shareReplay(1)
    );

    this.filteredProjects$ = combineLatest([
      allProjects$,
      this.searchTermSubject.pipe(
        debounceTime(300), // انتظر 300 مللي ثانية بعد توقف المستخدم عن الكتابة
        distinctUntilChanged(), // لا تقم بمعالجة البحث إلا إذا تغير المصطلح
        startWith('') // ابدأ بسلسلة بحث فارغة عند التهيئة
      )
    ]).pipe(
      map(([projects, searchTerm]) => {
        if (!searchTerm) {
          return projects; // إذا كان مصطلح البحث فارغاً، أرجع جميع المشاريع
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return projects.filter(project =>
          project.title.toLowerCase().includes(lowerCaseSearchTerm) ||
          project.description.toLowerCase().includes(lowerCaseSearchTerm) ||
          project.problemStatement.toLowerCase().includes(lowerCaseSearchTerm) ||
          project.technologies.toLowerCase().includes(lowerCaseSearchTerm) ||
          project.toolsUsed.toLowerCase().includes(lowerCaseSearchTerm)
        );
      })
    );
  }

  onSearchChange(event: Event): void {
    this.searchTermSubject.next((event.target as HTMLInputElement).value);
  }

  deleteProject(id: number, event: MouseEvent): void {
    event.stopPropagation(); // يمنع النقر على البطاقة الأساسية
    if (confirm('Are you sure you want to permanently delete this project? This action cannot be undone.')) {
      this.projectService.deleteProject(id).subscribe({
        next: () => {
          console.log(`Project with id ${id} deleted successfully.`);
          // إعادة تهيئة المكون لتحديث القائمة بعد الحذف
          this.ngOnInit();
        },
        error: (err) => {
          console.error('Error deleting project:', err);
          alert('Failed to delete the project. Please try again.');
        }
      });
    }
  }

  goToProjectDetails(projectId: number): void {
    this.router.navigate(['/ProjectDetails', projectId]);
  }
}
