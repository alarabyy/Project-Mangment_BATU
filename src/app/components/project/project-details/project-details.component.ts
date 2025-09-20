// src/app/components/project/project-details/project-details.component.ts
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { ProjectService } from '../../../Services/project.service';
import { Project, ProjectHistory } from '../../../models/project';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../../Services/auth.service';

interface ProjectDetailsState {
  project?: Project;
  history?: ProjectHistory[];
  isLoading: boolean;
  error?: string;
}

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectDetailsComponent implements OnInit {
  state$!: Observable<ProjectDetailsState>;
  mainImageFilename: string | null = null;
  currentUserId: string | null = null;

  public readonly imageBaseUrl = environment.imageBaseUrl;
  public readonly docBaseUrl = environment.docBaseUrl;
  public readonly placeholderImage = 'project-placeholder.png';

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const projectId = +idParam;
      if (!isNaN(projectId)) {
        this.loadProject(projectId);
      } else {
        this.state$ = of({ isLoading: false, error: 'Invalid Project ID provided.' });
      }
    } else {
      this.state$ = of({ isLoading: false, error: 'No Project ID provided.' });
    }
  }

  loadProject(id: number): void {
    this.state$ = forkJoin({
      project: this.projectService.getProjectById(id),
      history: this.projectService.getProjectHistory(id)
    }).pipe(
      tap(({ project }) => {
        if (project.images && project.images.length > 0) {
          this.mainImageFilename = project.images[0];
        } else {
          this.mainImageFilename = null;
        }
      }),
      map(({ project, history }) => ({ project, history, isLoading: false })),
      catchError(() => of({ isLoading: false, error: 'Could not load project details. The project may not exist.' }))
    );
  }

  selectImage(filename: string): void {
    this.mainImageFilename = filename;
  }

  getMainImageUrl(project: Project): string {
    const imageToShow = this.mainImageFilename || project.images?.[0];
    return imageToShow ? this.imageBaseUrl + imageToShow : this.placeholderImage;
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.placeholderImage;
  }

  isProjectLeader(leaderId: number): boolean {
    return this.currentUserId === leaderId.toString();
  }

  getFileIconClass(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'fas fa-file-pdf';
      case 'doc':
      case 'docx':
        return 'fas fa-file-word';
      case 'xls':
      case 'xlsx':
        return 'fas fa-file-excel';
      case 'ppt':
      case 'pptx':
        return 'fas fa-file-powerpoint';
      case 'zip':
      case 'rar':
        return 'fas fa-file-archive';
      default:
        return 'fas fa-file-alt';
    }
  }
}
