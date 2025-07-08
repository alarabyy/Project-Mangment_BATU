import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { ProjectService } from '../../../Services/project.service';
import { Project } from '../../../models/project';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css']
})
export class ProjectDetailsComponent implements OnInit {
  project: Project | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  mainImage: string | null = null;

  private readonly placeholderImage = 'assets/images/project-placeholder.png';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const projectId = +idParam;
      this.loadProject(projectId);
    } else {
      this.router.navigate(['/projects']);
    }
  }

  loadProject(id: number): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.projectService.getProjectById(id).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (data) => {
        this.project = data;
        if (data.images && data.images.length > 0 && data.images[0]?.url) {
          this.mainImage = data.images[0].url;
        } else {
          this.mainImage = this.placeholderImage;
        }
      },
      error: (err) => {
        console.error('Failed to load project details', err);
        this.errorMessage = 'Could not load project. It may have been deleted or the ID is incorrect.';
      }
    });
  }

  selectImage(imageUrl: string): void {
    this.mainImage = imageUrl;
  }

  onImageError(event: Event): void {
    const element = event.target as HTMLImageElement;
    element.src = this.placeholderImage;
  }
}
