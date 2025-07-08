import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { ProjectService } from '../../../Services/project.service';
import { Project } from '../../../models/project';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  mainImageFilename: string | null = null;

  public readonly imageBaseUrl = environment.imageBaseUrl;
  public readonly placeholderImage = '/project-placeholder.png';

  constructor(private route: ActivatedRoute, private router: Router, private projectService: ProjectService) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const projectId = +idParam;
      if (!isNaN(projectId)) { this.loadProject(projectId); }
      else { this.handleInvalidId(); }
    } else { this.handleInvalidId(); }
  }

  loadProject(id: number): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.projectService.getProjectById(id).pipe(finalize(() => this.isLoading = false))
    .subscribe({
      next: (data) => {
        this.project = data;
        if (data.images && data.images.length > 0) {
            this.mainImageFilename = data.images[0];
        }
      },
      error: (err) => {
        console.error('Failed to load project details', err);
        this.errorMessage = 'Could not load project. It may not exist or the ID is incorrect.';
      }
    });
  }

  selectImage(filename: string): void {
    this.mainImageFilename = filename;
  }

  getMainImageUrl(): string {
    if (this.mainImageFilename) {
      return this.imageBaseUrl + this.mainImageFilename;
    }
    // This will only be reached if there are no images.
    return this.placeholderImage;
  }

  onImageError(event: Event): void {
    const element = event.target as HTMLImageElement;
    if (element.src !== this.placeholderImage) {
      element.src = this.placeholderImage;
    }
  }

  private handleInvalidId(): void {
    this.isLoading = false;
    this.errorMessage = 'Invalid Project ID provided.';
    this.router.navigate(['/ProjectList']);
  }
}
