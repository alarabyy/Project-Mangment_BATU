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
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectService.deleteProject(id).subscribe({
        next: () => {
          console.log(`Project with id ${id} was deleted successfully.`);
          this.loadProjects();
        },
        error: (err) => console.error('Error deleting project:', err)
      });
    }
  }
}
