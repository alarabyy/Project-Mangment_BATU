  import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, SlicePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../Services/project.service';
import { Project } from '../../../models/project'; // Using the full Project interface
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink, SlicePipe],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css']
})
export class ProjectListComponent implements OnInit {
  projects$!: Observable<Project[]>;
  isLoading = true;
  error: string | null = null;

  constructor(private projectService: ProjectService, private router: Router) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoading = true;
    this.error = null;
    this.projectService.getProjects().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (data) => {
        this.projects$ = new Observable(observer => observer.next(data));
      },
      error: (err) => {
        console.error('Error loading projects:', err);
        this.error = 'Failed to load projects. Please try again later.';
      }
    });
  }

  deleteProject(id: number, event: MouseEvent): void {
    event.stopPropagation(); // Prevent the card's navigation from firing when clicking delete button
    if (confirm('Are you sure you want to permanently delete this project? This action cannot be undone.')) {
      this.projectService.deleteProject(id).subscribe({
        next: () => {
          console.log(`Project with id ${id} deleted successfully.`);
          this.loadProjects(); // Refresh the list after deletion
        },
        error: (err) => {
          console.error('Error deleting project:', err);
          alert('Failed to delete the project. Please try again.');
        }
      });
    }
  }

  /**
   * Navigates to the project details page for the given project ID.
   * This method is called when a project card is clicked.
   * @param projectId The ID of the project to view details for.
   */
  goToProjectDetails(projectId: number): void {
    this.router.navigate(['/ProjectDetails', projectId]);
  }
}
