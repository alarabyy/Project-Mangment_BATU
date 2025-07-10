import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../../Services/project.service';

// Define a minimal interface to match the ProjectMinimalDTO from the backend
export interface ProjectMinimal {
  id: number;
  title: string;
  description: string;
  technologies: string;
  toolsUsed: string;
  problemStatement: string;
}

@Component({
  selector: 'app-my-projects',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-projects.component.html',
  styleUrls: ['./my-projects.component.css']
})
export class MyProjectsComponent implements OnInit {

  public myProjects$!: Observable<ProjectMinimal[]>;
  public error: string | null = null;
  public isLoading = true;

  constructor(private projectService: ProjectService) { }

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoading = true;
    this.error = null;
    // We assume getMyProjects() returns an array matching ProjectMinimal[]
    this.myProjects$ = this.projectService.getMyProjects() as Observable<ProjectMinimal[]>;

    this.myProjects$.subscribe({
      next: (projects) => {
        console.log('My projects loaded successfully:', projects);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load my projects:', err);
        if (err.status === 401 || err.status === 403) {
          this.error = 'Unauthorized. Please log in to view your projects.';
        } else {
          this.error = 'An error occurred while loading projects. Please try again later.';
        }
        this.isLoading = false;
      }
    });
  }
}
