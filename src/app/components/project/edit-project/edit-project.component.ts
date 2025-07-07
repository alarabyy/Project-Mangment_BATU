import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../Services/project.service';
import { Project, ProjectImage } from '../../../models/project';
import { finalize } from 'rxjs';

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
  pageTitle = 'Loading Project...';

  // متغيرات خاصة بإدارة الصور
  selectedFile: File | null = null;
  isUploading = false;
  imagesBeingDeleted: Set<number> = new Set(); // لتتبع الصور التي يتم حذفها

  private projectId!: number;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.router.navigate(['/projects']);
      return;
    }
    this.projectId = +idParam;
    this.initializeForm();
    this.loadProjectData();
  }

  initializeForm(): void {
    this.projectForm = this.fb.group({
      id: [this.projectId],
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      problemStatement: ['', Validators.required],
      technologies: ['', Validators.required],
      toolsUsed: ['', Validators.required],
      grade: [null, [Validators.required, Validators.min(0)]],
      leaderId: ['', Validators.required],
      categoryId: [null, Validators.required],
      departmentId: [null, Validators.required]
    });
  }

  loadProjectData(): void {
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (projectData) => {
        this.project = projectData;
        this.pageTitle = `Edit Project: ${projectData.title}`;
        this.projectForm.patchValue(projectData);
      },
      error: (err) => {
        console.error("Could not fetch project data", err);
        this.router.navigate(['/projects']);
      }
    });
  }

  get f() { return this.projectForm.controls; }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    this.projectService.updateProject(this.projectForm.value).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => {
        this.router.navigate(['/projects']);
      },
      error: (err) => console.error('Error updating project:', err)
    });
  }

  // =================== 🔽 دوال إدارة الصور 🔽 ===================

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.selectedFile = fileList[0];
    } else {
      this.selectedFile = null;
    }
  }

  onImageUpload(): void {
    if (!this.selectedFile) {
      alert('Please select a file to upload.');
      return;
    }
    this.isUploading = true;
    this.projectService.uploadImage(this.projectId, this.selectedFile).pipe(
      finalize(() => {
        this.isUploading = false;
        this.selectedFile = null;
        // إعادة تعيين حقل الإدخال
        const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
      })
    ).subscribe({
      next: () => {
        console.log('Image uploaded successfully.');
        this.loadProjectData(); // إعادة تحميل بيانات المشروع لإظهار الصورة الجديدة
      },
      error: (err) => console.error('Error uploading image:', err)
    });
  }

  deleteImage(imageId: number): void {
    if (confirm('Are you sure you want to delete this image?')) {
      this.imagesBeingDeleted.add(imageId); // إظهار مؤشر الحذف لهذه الصورة

      this.projectService.deleteImage(imageId).pipe(
        finalize(() => this.imagesBeingDeleted.delete(imageId)) // إخفاء المؤشر
      ).subscribe({
        next: () => {
          console.log('Image deleted successfully.');
          this.loadProjectData(); // إعادة تحميل بيانات المشروع لتحديث المعرض
        },
        error: (err) => console.error('Error deleting image:', err)
      });
    }
  }

  // ===============================================================

  onCancel(): void {
    this.router.navigate(['/projects']);
  }
}
