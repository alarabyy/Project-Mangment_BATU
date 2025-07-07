import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../../Services/project.service';
import { Project } from '../../../models/project';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css']
})
export class ProjectListComponent implements OnInit {
  projects$!: Observable<Project[]>;

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.projects$ = this.projectService.getProjects();
  }

  deleteProject(id: number, event: MouseEvent): void {
    event.stopPropagation(); // منع التنقل إلى صفحة التعديل عند النقر على زر الحذف
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectService.deleteProject(id).subscribe({
        next: () => {
          console.log(`Project with id ${id} was deleted successfully.`);
          this.loadProjects(); // إعادة تحميل القائمة بعد الحذف
        },
        error: (err) => console.error('Error deleting project:', err)
      });
    }
  }

  // دالة مساعدة للحصول على صورة العرض الأولى للمشروع
  getProjectCoverImage(project: Project): string {
    if (project.images && project.images.length > 0) {
      return project.images[0].url; // إرجاع رابط أول صورة
    }
    // إرجاع صورة افتراضية في حالة عدم وجود صور
    return 'assets/images/project-placeholder.png';
  }
}
