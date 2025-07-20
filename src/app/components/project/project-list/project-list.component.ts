import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { CommonModule, SlicePipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../Services/project.service';
import { Project } from '../../../models/project';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, startWith, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink, SlicePipe, DatePipe],
  providers: [DatePipe],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css']
})
export class ProjectListComponent implements OnInit {
  public filteredProjects$!: Observable<Project[]>;
  public searchTermSubject = new BehaviorSubject<string>('');
  public isLoading = true;
  public error: string | null = null;

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    const allProjects$ = this.projectService.getProjects().pipe(
      finalize(() => this.isLoading = false),
      catchError(err => {
        console.error('Error loading projects:', err);
        this.error = 'Failed to load projects. Please try again later.';
        return of([]);
      }),
      // Ensures the API call is made once and its result is shared
      shareReplay(1)
    );

    this.filteredProjects$ = combineLatest([
      allProjects$,
      this.searchTermSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        startWith('')
      )
    ]).pipe(
      map(([projects, searchTerm]) => {
        if (!searchTerm) {
          return projects;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return projects.filter(project =>
          project.title.toLowerCase().includes(lowerCaseSearchTerm) ||
          project.description.toLowerCase().includes(lowerCaseSearchTerm) ||
          project.problemStatement.toLowerCase().includes(lowerCaseSearchTerm) ||
          project.technologies.toLowerCase().includes(lowerCaseSearchTerm) ||
          project.toolsUsed.toLowerCase().includes(lowerCaseSearchTerm)
        );
      })
    );

    this.isLoading = true;
    this.error = null;
  }

  onSearchChange(event: Event): void {
    this.searchTermSubject.next((event.target as HTMLInputElement).value);
  }

  deleteProject(id: number, event: MouseEvent): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this project? This action cannot be undone.')) {
      this.projectService.deleteProject(id).subscribe({
        next: () => {
          console.log(`Project with id ${id} deleted successfully.`);
          // Re-initialize to refresh the list after deletion
          this.ngOnInit();
        },
        error: (err) => {
          console.error('Error deleting project:', err);
          alert('Failed to delete the project. Please try again.');
        }
      });
    }
  }

  goToProjectDetails(projectId: number): void {
    this.router.navigate(['/ProjectDetails', projectId]);
  }
}
