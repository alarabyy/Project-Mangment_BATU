import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../Services/project.service';
import { Project, Member, Supervisor } from '../../../models/project';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-edit-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-project.component.html',
  styleUrls: ['./edit-project.component.css']
})
export class EditProjectComponent implements OnInit {
  projectForm!: FormGroup;
  project: Project | null = null;
  isSubmitting = false;
  isLoading = true;
  pageTitle = 'Loading Project...';
  selectedFiles: File[] = [];
  isUploading = false;
  imagesBeingDeleted = new Set<string>();
  private projectId!: number;

  public readonly imageBaseUrl = environment.imageBaseUrl;
  public readonly placeholderImage = 'project-placeholder.png';

  constructor(private fb: FormBuilder, private projectService: ProjectService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) { this.router.navigate(['/ProjectList']); return; }
    this.projectId = +idParam;
    this.initializeForm();
    this.loadProjectData();
  }

  initializeForm(): void {
    this.projectForm = this.fb.group({
      id: [this.projectId],
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      problemStatement: ['', Validators.required],
      technologies: ['', Validators.required],
      toolsUsed: ['', Validators.required],
      grade: [null, [Validators.min(0), Validators.max(100)]],
      categoryId: [null, Validators.required],
      departmentId: [null, Validators.required],
      members: this.fb.array([]),
      supervisors: this.fb.array([])
    });
  }

  get f() { return this.projectForm.controls; }
  get members() { return this.projectForm.get('members') as FormArray; }
  get supervisorsArray() { return this.projectForm.get('supervisors') as FormArray; }

  newMember(name: string = '', academicId: number | null = null): FormGroup {
    return this.fb.group({
      name: [name, Validators.required],
      academicId: [academicId, [Validators.required, Validators.min(1), Validators.pattern("^[0-9]*$")]]
    });
  }

  addMember(): void {
    this.members.push(this.newMember());
  }

  removeMember(index: number): void {
    this.members.removeAt(index);
  }

  newSupervisor(id: number | null = null): FormGroup {
    return this.fb.group({
      id: [id, [Validators.required, Validators.min(1), Validators.pattern("^[0-9]*$")]]
    });
  }

  addSupervisor(): void {
    this.supervisorsArray.push(this.newSupervisor());
  }

  removeSupervisor(index: number): void {
    this.supervisorsArray.removeAt(index);
  }

  loadProjectData(): void {
    this.isLoading = true;
    this.projectService.getProjectById(this.projectId).pipe(finalize(() => this.isLoading = false))
    .subscribe({
      next: (projectData) => {
        this.project = projectData;
        this.pageTitle = `Edit: ${projectData.title}`;

        this.projectForm.patchValue({
             id: projectData.id,
             title: projectData.title,
             description: projectData.description,
             problemStatement: projectData.problemStatement,
             technologies: projectData.technologies,
             toolsUsed: projectData.toolsUsed,
             grade: projectData.grade,
             categoryId: projectData.category?.id,
             departmentId: projectData.department?.id
        });

        this.members.clear();
        if (projectData.members && projectData.members.length > 0) {
          projectData.members.forEach(member => {
            this.members.push(this.newMember(member.name, member.academicId));
          });
        } else {
          this.addMember();
        }

        this.supervisorsArray.clear();
        if (projectData.supervisors && projectData.supervisors.length > 0) {
          projectData.supervisors.forEach(supervisor => {
            this.supervisorsArray.push(this.newSupervisor(supervisor.id));
          });
        } else {
          this.addSupervisor();
        }
      },
      error: () => this.router.navigate(['/not-found'])
    });
  }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      this.members.controls.forEach(control => {
        if (control instanceof FormGroup) {
          Object.values(control.controls).forEach(c => c.markAsTouched());
        }
      });
      this.supervisorsArray.controls.forEach(control => {
        if (control instanceof FormGroup) {
          Object.values(control.controls).forEach(c => c.markAsTouched());
        }
      });
      return;
    }
    this.isSubmitting = true;

    const formValue = this.projectForm.value;
    const payload = {
      Id: formValue.id,
      Title: formValue.title,
      Description: formValue.description,
      Technologies: formValue.technologies,
      ToolsUsed: formValue.toolsUsed,
      ProblemStatement: formValue.problemStatement,
      CategoryId: formValue.categoryId,
      DepartmentId: formValue.departmentId,
      members: formValue.members.map((m: any) => ({
        name: m.name,
        academicId: Number(m.academicId)
      })),
      supervisors: formValue.supervisors.map((s: any) => Number(s.id))
    };

    this.projectService.updateProject(payload).pipe(finalize(() => this.isSubmitting = false))
    .subscribe({
      next: () => this.router.navigate(['/ProjectDetails', this.projectId]),
      error: (err) => {
        console.error('Error updating project:', err);
        alert('Failed to update the project.');
      }
    });
  }

  onFilesSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    this.selectedFiles = element.files ? Array.from(element.files) : [];
  }

  onImageUpload(): void {
    if (this.selectedFiles.length === 0) return;
    this.isUploading = true;

    this.projectService.uploadImages(this.projectId, this.selectedFiles).pipe(
      finalize(() => {
        this.isUploading = false;
        this.selectedFiles = [];
        const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      })
    ).subscribe({
      next: () => this.loadProjectData(),
      error: (err) => console.error('Error uploading images:', err)
    });
  }

  deleteImage(filename: string): void {
    if (!filename) { console.error("Filename is empty"); return; }
    if (confirm(`Are you sure you want to delete this image? (${filename})`)) {
      this.imagesBeingDeleted.add(filename);
      // ***** التعديل هنا: إضافة console.log لتصحيح الأخطاء *****
      const payloadSent = { id: this.project!.id, files: [filename] };
      console.log('Attempting to delete image with payload:', payloadSent);

      this.projectService.deleteImage(this.project!.id, [filename]).pipe(finalize(() => this.imagesBeingDeleted.delete(filename)))
      .subscribe({
        next: () => this.loadProjectData(),
        error: (err) => {
          console.error('Error deleting image:', err);
          alert('Failed to delete the image. Please check the console for details or contact support.'); // رسالة أكثر إفادة للمستخدم
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/ProjectDetails', this.projectId]);
  }

  onImageError(event: Event): void {
    const element = event.target as HTMLImageElement;
    if (element.src !== this.placeholderImage) {
      console.warn(`Image not found, replacing with placeholder: ${element.src}`);
      element.src = this.placeholderImage;
    }
  }
}
