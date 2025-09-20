// src/app/components/project/edit-project/edit-project.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../Services/project.service';
import { CategoryService } from '../../../Services/category.service';
import { DepartmentService } from '../../../Services/department.service';
import { Project, Member, Supervisor, Evaluator, Department, Category } from '../../../models/project';
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

  categories: Category[] = [];
  departments: Department[] = [];

  availableTechnologies: string[] = ['AI/Machine Learning', 'Web Development', 'Mobile Development', 'IoT', 'Cybersecurity', 'Data Science', 'Cloud Computing', 'Robotics'];
  availableTools: string[] = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C#', 'React', 'Angular', 'Vue.js', 'Node.js', 'ASP.NET Core', 'TensorFlow', 'PyTorch', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Firebase'];

  selectedImageFiles: File[] = [];
  isUploadingImages = false;
  imagesBeingDeleted = new Set<string>();

  // ✅ NEW: Properties for document management
  selectedDocFiles: File[] = [];
  isUploadingDocs = false;
  docsBeingDeleted = new Set<string>();

  private projectId!: number;
  public readonly imageBaseUrl = environment.imageBaseUrl;
  public readonly docBaseUrl = environment.docBaseUrl; // Ensure this is in your environment file
  public readonly placeholderImage = '/assets/Images/project-placeholder.png';

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private categoryService: CategoryService,
    private departmentService: DepartmentService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) { this.router.navigate(['/ProjectList']); return; }
    this.projectId = +idParam;
    this.initializeForm();
    this.loadInitialData();
  }

  initializeForm(): void {
    this.projectForm = this.fb.group({
      id: [this.projectId],
      title: ['', Validators.required],
      description: ['', Validators.required],
      score: [null, [Validators.min(0), Validators.max(100)]],
      technologies: this.fb.array(this.availableTechnologies.map(() => this.fb.control(false))),
      toolsUsed: this.fb.array(this.availableTools.map(() => this.fb.control(false))),
      problemStatement: ['', Validators.required],
      patentNumber: [null],
      patentDate: [null],
      leaderId: [null, Validators.required],
      categoryId: [null, Validators.required],
      departments: this.fb.array([]),
      members: this.fb.array([]),
      supervisors: this.fb.array([]),
      evaluators: this.fb.array([])
    });
  }

  loadInitialData(): void {
    this.isLoading = true;
    this.categoryService.getAllCategories().subscribe(cats => {
      this.categories = cats;
      this.departmentService.getAllDepartments().subscribe(deps => {
        this.departments = deps;
        this.loadProjectData();
      });
    });
  }

  loadProjectData(): void {
    this.projectService.getProjectById(this.projectId).pipe(finalize(() => this.isLoading = false))
    .subscribe(projectData => {
      this.project = projectData;
      this.pageTitle = `Edit: ${projectData.title}`;
      this.patchForm(projectData);
    });
  }

  patchForm(p: Project): void {
    this.projectForm.patchValue({
      id: p.id, title: p.title, description: p.description, score: p.score,
      problemStatement: p.problemStatement, patentNumber: p.patentNumber,
      patentDate: p.patentDate ? p.patentDate.split('T')[0] : null,
      leaderId: p.leader?.id, categoryId: p.category?.id,
    });
    this.patchCheckboxArray(this.technologiesArray, this.availableTechnologies, p.technologies);
    this.patchCheckboxArray(this.toolsUsedArray, this.availableTools, p.toolsUsed);
    this.patchDepartmentCheckboxes(p.department);
    this.setFormArrayData(this.members, p.members, this.newMember);
    this.setFormArrayData(this.supervisorsArray, p.supervisers, this.newSupervisor);
    this.setFormArrayData(this.evaluators, p.evaluators, this.newEvaluator);
  }

  patchCheckboxArray(formArray: FormArray, availableItems: string[], selectedItemsStr: string): void {
    const selectedItems = selectedItemsStr ? selectedItemsStr.split(',').map(item => item.trim()) : [];
    availableItems.forEach((item, index) => {
      formArray.at(index).setValue(selectedItems.includes(item));
    });
  }

  patchDepartmentCheckboxes(selectedDepartments: Department[]): void {
    const departmentIds = selectedDepartments.map(d => d.id);
    const departmentsFormArray = this.fb.array(
      this.departments.map(dept => this.fb.control(departmentIds.includes(dept.id)))
    );
    this.projectForm.setControl('departments', departmentsFormArray);
  }

  setFormArrayData(formArray: FormArray, data: any[], createGroupFn: (item?: any) => FormGroup): void {
    formArray.clear();
    if (data && data.length > 0) data.forEach(item => formArray.push(createGroupFn(item)));
    else formArray.push(createGroupFn());
  }

  get f() { return this.projectForm.controls; }
  get members() { return this.projectForm.get('members') as FormArray; }
  get supervisorsArray() { return this.projectForm.get('supervisors') as FormArray; }
  get evaluators() { return this.projectForm.get('evaluators') as FormArray; }
  get departmentsArray() { return this.projectForm.get('departments') as FormArray; }
  get technologiesArray() { return this.projectForm.get('technologies') as FormArray; }
  get toolsUsedArray() { return this.projectForm.get('toolsUsed') as FormArray; }

  newMember = (m?: Member): FormGroup => this.fb.group({ id: [m?.id || 0], name: [m?.name || '', Validators.required], academicId: [m?.academicId || null, Validators.required], academicDegree: [m?.academicDegree ?? 0, Validators.required] });
  addMember(): void { this.members.push(this.newMember()); }
  removeMember(index: number): void { this.members.removeAt(index); }

  newSupervisor = (s?: Supervisor): FormGroup => this.fb.group({ id: [s?.id || null, Validators.required] });
  addSupervisor(): void { this.supervisorsArray.push(this.newSupervisor()); }
  removeSupervisor(index: number): void { this.supervisorsArray.removeAt(index); }

  newEvaluator = (e?: Evaluator): FormGroup => this.fb.group({ id: [e?.id || 0], name: [e?.name || '', Validators.required], academicDegree: [e?.academicDegree ?? 0, Validators.required], score: [e?.score ?? null, Validators.required] });
  addEvaluator(): void { this.evaluators.push(this.newEvaluator()); }
  removeEvaluator(index: number): void { this.evaluators.removeAt(index); }

  onSubmit(): void {
    if (this.projectForm.invalid) { this.projectForm.markAllAsTouched(); return; }
    this.isSubmitting = true;
    const formValue = this.projectForm.getRawValue();
    const payload = {
      id: formValue.id, title: formValue.title, description: formValue.description, score: formValue.score,
      technologies: this.availableTechnologies.filter((_, i) => formValue.technologies[i]).join(', '),
      toolsUsed: this.availableTools.filter((_, i) => formValue.toolsUsed[i]).join(', '),
      problemStatement: formValue.problemStatement, patentNumber: formValue.patentNumber, patentDate: formValue.patentDate,
      leaderId: formValue.leaderId, categoryId: formValue.categoryId,
      departments: this.departments.filter((_, i) => formValue.departments[i]).map(d => d.id),
      members: formValue.members, evaluators: formValue.evaluators,
      supervisors: formValue.supervisors.map((s: {id: number}) => s.id)
    };

    this.projectService.updateProject(payload).pipe(finalize(() => this.isSubmitting = false))
    .subscribe({
      next: () => this.router.navigate(['/ProjectDetails', this.projectId]),
      error: (err) => alert(err.error?.message || 'Failed to update project.')
    });
  }

  onFilesSelected(event: Event, type: 'image' | 'doc'): void {
    const element = event.currentTarget as HTMLInputElement;
    const files = element.files ? Array.from(element.files) : [];
    if (type === 'image') this.selectedImageFiles = files;
    else this.selectedDocFiles = files;
  }

  onImageUpload(): void {
    if (this.selectedImageFiles.length === 0) return;
    this.isUploadingImages = true;
    this.projectService.uploadImages(this.projectId, this.selectedImageFiles).pipe(finalize(() => { this.isUploadingImages = false; this.selectedImageFiles = []; const el = document.getElementById('imageUpload') as HTMLInputElement; if(el) el.value = ''; }))
    .subscribe({ next: () => this.loadProjectData(), error: (err) => console.error(err) });
  }

  deleteImage(filename: string): void {
    if (confirm(`Delete this image? (${filename})`)) {
      this.imagesBeingDeleted.add(filename);
      this.projectService.deleteImage(this.project!.id, [filename]).pipe(finalize(() => this.imagesBeingDeleted.delete(filename)))
      .subscribe({ next: () => this.loadProjectData(), error: () => alert('Failed to delete image.') });
    }
  }

  onDocumentUpload(): void {
    if (this.selectedDocFiles.length === 0) return;
    this.isUploadingDocs = true;
    this.projectService.uploadDocuments(this.projectId, this.selectedDocFiles).pipe(finalize(() => { this.isUploadingDocs = false; this.selectedDocFiles = []; const el = document.getElementById('docUpload') as HTMLInputElement; if(el) el.value = ''; }))
    .subscribe({ next: () => this.loadProjectData(), error: (err) => console.error(err) });
  }

  deleteDocument(filename: string): void {
    if (confirm(`Delete this document? (${filename})`)) {
      this.docsBeingDeleted.add(filename);
      this.projectService.deleteDocument(this.project!.id, [filename]).pipe(finalize(() => this.docsBeingDeleted.delete(filename)))
      .subscribe({ next: () => this.loadProjectData(), error: () => alert('Failed to delete document.') });
    }
  }

  getFileIconClass(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'fas fa-file-pdf';
    if (ext === 'doc' || ext === 'docx') return 'fas fa-file-word';
    if (ext === 'xls' || ext === 'xlsx') return 'fas fa-file-excel';
    if (ext === 'ppt' || ext === 'pptx') return 'fas fa-file-powerpoint';
    return 'fas fa-file-alt';
  }

  onCancel(): void { this.router.navigate(['/ProjectDetails', this.projectId]); }
  onImageError(event: Event): void { (event.target as HTMLImageElement).src = this.placeholderImage; }
}
