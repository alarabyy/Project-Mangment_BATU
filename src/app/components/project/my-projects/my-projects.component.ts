// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Router, RouterModule } from '@angular/router';
// import { HttpErrorResponse } from '@angular/common/http';
// import { ProjectService } from '../../../Services/project.service';
// import { AuthService } from '../../../Services/auth.service';
// import { Project } from '../../../models/project';
// import { finalize } from 'rxjs';

// @Component({
//   selector: 'app-my-projects',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './my-projects.component.html',
//   styleUrls: ['./my-projects.component.css']
// })
// export class MyProjectsComponent implements OnInit {
//   public projects: Project[] = [];
//   public isLoading = true;
//   public errorMessage: string | null = null;
//   public deletingProjectIds = new Set<number>();

//   constructor(
//     private projectService: ProjectService,
//     private authService: AuthService,
//     private router: Router
//   ) {}

//   ngOnInit(): void {
//     this.loadMyProjects();
//   }

//   public loadMyProjects(): void {
//     const userId = this.authService.getUserId();
//     if (!userId) {
//       this.errorMessage = "Could not identify the current user. Please log in again.";
//       this.isLoading = false;
//       return;
//     }

//     this.isLoading = true;
//     this.errorMessage = null;

//     // استدعاء الدالة الصحيحة من الخدمة
//     this.projectService.getProjectsByUserId(userId).pipe(
//       finalize(() => this.isLoading = false)
//     ).subscribe({
//       // تم تحديد نوع المتغير لحل الخطأ
//       next: (userProjects: Project[]) => {
//         this.projects = userProjects;
//       },
//       error: (err: HttpErrorResponse) => {
//         console.error('API Error in MyProjectsComponent:', err);
//         this.errorMessage = `Failed to load your projects. (Error: ${err.status})`;
//       }
//     });
//   }

//   public deleteProject(projectId: number): void {
//     if (this.deletingProjectIds.has(projectId)) return;
//     const confirmation = confirm('Are you sure you want to permanently delete this project?');
//     if (!confirmation) return;

//     this.deletingProjectIds.add(projectId);
//     this.errorMessage = null;

//     // لا داعي لـ setTimeout هنا، إلا إذا كان لهدف جمالي
//     this.projectService.deleteProject(projectId).pipe(
//       finalize(() => this.deletingProjectIds.delete(projectId))
//     ).subscribe({
//       next: () => {
//         // تم تصحيح Id إلى id
//         this.projects = this.projects.filter(p => p.id !== projectId);
//       },
//       error: (err: HttpErrorResponse) => {
//         console.error('Deletion Error:', err);
//         this.errorMessage = `Failed to delete project #${projectId}.`;
//       }
//     });
//   }

//   public addProject(): void {
//     this.router.navigate(['/projects/add']);
//   }

//   public editProject(projectId: number): void {
//     this.router.navigate(['/projects/edit', projectId]);
//   }

//   // تم تصحيح Id إلى id
//   public trackByProjectId(index: number, project: Project): number {
//     return project.id;
//   }
// }
