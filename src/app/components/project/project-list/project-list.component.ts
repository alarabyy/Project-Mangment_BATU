import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, SlicePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../Services/project.service';
import { Project } from '../../../models/project';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink, SlicePipe],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css']
})
export class ProjectListComponent implements OnInit {
  projects$!: Observable<Project[]>;

  constructor(private projectService: ProjectService, private router: Router) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.projects$ = this.projectService.getProjects();
  }

  deleteProject(id: number, event: MouseEvent): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this project? This action cannot be undone.')) {
      this.projectService.deleteProject(id).subscribe({
        next: () => {
          console.log(`Project with id ${id} deleted successfully.`);
          this.loadProjects();
        },
        error: (err) => {
          console.error('Error deleting project:', err);
          alert('Failed to delete the project. Please try again.');
        }
      });
    }
  }
}
