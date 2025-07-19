import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { CommonModule, SlicePipe, DatePipe } from '@angular/common'; // DatePipe لم يعد ضروريًا للـ HTML لكنه موجود في providers
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../Services/project.service';
import { Project } from '../../../models/project';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, startWith, shareReplay } from 'rxjs/operators';

// استيراد jsPDF أولاً، ثم استيراد الـ plugin
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // <--- تأكد أن هذا الاستيراد يتم بعد jsPDF مباشرة

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink, SlicePipe, DatePipe], // DatePipe لا يزال مطلوباً إذا كنت ستستخدمه في مكان آخر
  providers: [DatePipe], // <--- لا يزال ضروريًا إذا كنت تحقنه في الـ constructor (حتى لو لم تستخدمه في هذا الكومبوننت)
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
    // بما أن البيانات التي تستقبلها لا تحتوي على تواريخ، قد لا تحتاج DatePipe هنا بعد الآن
    // ومع ذلك، إذا كانت هناك احتمالية أن يعود Backend بتواريخ لاحقًا، فاتركه.
    // سأتركه احتياطًا لتجنب أخطاء محتملة إذا قمت بتغيير الـ backend لاحقًا.
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    const allProjects$ = this.projectService.getProjects().pipe(
      finalize(() => this.isLoading = false),
      catchError(err => {
        console.error('Error loading projects:', err);
        this.error = 'Failed to load projects. Please try again later.';
        return of([]);
      }),
      shareReplay(1)
    );

    this.filteredProjects$ = combineLatest([
      allProjects$,
      this.searchTermSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        startWith('')
      )
    ]).pipe(
      map(([projects, searchTerm]) => {
        if (!searchTerm) {
          return projects;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return projects.filter(project =>
          project.title.toLowerCase().includes(lowerCaseSearchTerm) ||
          project.description.toLowerCase().includes(lowerCaseSearchTerm) ||
          project.problemStatement.toLowerCase().includes(lowerCaseSearchTerm) ||
          project.technologies.toLowerCase().includes(lowerCaseSearchTerm) ||
          project.toolsUsed.toLowerCase().includes(lowerCaseSearchTerm)
          // تم إزالة البحث عن category و department لأنها لم تعد في الواجهة
          // project.category?.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
          // project.department?.name?.toLowerCase().includes(lowerCaseSearchTerm)
        );
      })
    );

    this.isLoading = true;
    this.error = null;
  }

  onSearchChange(event: Event): void {
    this.searchTermSubject.next((event.target as HTMLInputElement).value);
  }

  // تم إزالة دوال getMembersDisplay و getSupervisorsDisplay لأن الحقول لم تعد موجودة

  downloadReport(): void {
    this.filteredProjects$.subscribe(projects => {
      if (projects.length === 0) {
        alert('No projects to download for the current filters/search!');
        return;
      }

      const doc = new jsPDF(); // إنشاء مستند PDF جديد

      // تعريف رؤوس الجدول - فقط الحقول الموجودة في الـ Backend JSON
      const head = [[
        'ID', 'Title', 'Description', 'Problem Statement', 'Technologies', 'Tools Used'
        // تم إزالة الحقول التالية من التقرير لأنها غير موجودة في الـ JSON المرفق:
        // 'Category', 'Department', 'Grade', 'Start Date', 'Submission Date',
        // 'Team Leader ID', 'Members', 'Supervisors'
      ]];

      // تحضير بيانات الجدول - فقط الحقول الموجودة في الـ Backend JSON
      const body = projects.map(project => {
        return [
          project.id,
          project.title,
          project.description,
          project.problemStatement,
          project.technologies,
          project.toolsUsed
        ];
      });

      // إضافة عنوان للتقرير
      doc.setFontSize(18);
      doc.text("Projects Report", 14, 20);

      // استخدام `as any` على `doc` عند استدعاء `autoTable` لضمان تعرف TypeScript عليها
      (doc as any).autoTable({
        head: head,
        body: body,
        startY: 30, // يبدأ الجدول بعد العنوان
        theme: 'striped', // ثيم مخطط للجدول لتحسين المظهر
        styles: {
            font: 'helvetica',
            fontSize: 8,
            cellPadding: 3,
            valign: 'middle',
            halign: 'left'
        },
        headStyles: {
            fillColor: [98, 0, 234], // لون خلفية الرأس (Deep Purple)
            textColor: 255, // لون نص الرأس (أبيض)
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            // تخصيص عرض الأعمدة الجديدة
            0: { cellWidth: 10 }, // ID
            1: { cellWidth: 30 }, // Title
            2: { cellWidth: 45 }, // Description
            3: { cellWidth: 45 }, // Problem Statement
            4: { cellWidth: 40 }, // Technologies
            5: { cellWidth: 30 }, // Tools Used
        },
        didParseCell: function(data: any) {
          // اقتطاع النصوص الطويلة فقط للحقول الموجودة
          if (data.section === 'body') {
            if (data.column.index === 2 || data.column.index === 3) { // Description & Problem Statement
              if (data.cell.raw && (data.cell.raw as string).length > 80) {
                data.cell.text = (data.cell.raw as string).substring(0, 77) + '...';
              }
            }
            if (data.column.index === 4 || data.column.index === 5) { // Technologies & Tools Used
              if (data.cell.raw && (data.cell.raw as string).length > 40) {
                data.cell.text = (data.cell.raw as string).substring(0, 37) + '...';
              }
            }
          }
        },
        didDrawPage: function (data: any) {
            let str = 'Page ' + (doc.internal as any).getNumberOfPages();
            doc.setFontSize(10);
            let pageSize = (doc.internal as any).pageSize;
            let pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            doc.text(str, data.settings.margin.left, pageHeight - 10);
        }
      });

      doc.save('projects_report.pdf');
    });
  }

  deleteProject(id: number, event: MouseEvent): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this project? This action cannot be undone.')) {
      this.projectService.deleteProject(id).subscribe({
        next: () => {
          console.log(`Project with id ${id} deleted successfully.`);
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
