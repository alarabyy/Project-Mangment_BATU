import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
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
  private readonly placeholderImage = 'assets/images/project-placeholder.png';

  constructor(private projectService: ProjectService, private router: Router) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.projects$ = this.projectService.getProjects();
  }

  deleteProject(id: number, event: MouseEvent): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this project?')) {
      this.projectService.deleteProject(id).subscribe({
        next: () => this.loadProjects(),
        error: (err) => console.error('Error deleting project:', err)
      });
    }
  }

  viewDetails(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/projects', id]);
  }

  editProject(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/projects/edit', id]);
  }

  getProjectCoverImage(project: Project): string {
    if (project.images && project.images.length > 0 && project.images[0]?.url) {
      return project.images[0].url;
    }
    return this.placeholderImage;
  }

  onImageError(event: Event): void {
    const element = event.target as HTMLImageElement;
    element.src = this.placeholderImage;
  }
}
