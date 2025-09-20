// src/app/components/project/add-project/add-project.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, AbstractControl, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../Services/project.service';
import { CategoryService } from '../../../Services/category.service';
import { DepartmentService } from '../../../Services/department.service';
import { finalize } from 'rxjs';
import { Category } from '../../../models/category';
import { Department } from '../../../models/department';
import { PopupService } from '../../../Services/popup.service'; // استيراد خدمة الباوباب

@Component({
  selector: 'app-add-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // تم إزالة SuccessPopup لأنه سيتم استبداله بخدمة
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css']
})
export class AddProjectComponent implements OnInit {
  projectForm!: FormGroup;
  isSubmitting = false;
  categories: Category[] = [];
  departments: Department[] = [];

  availableTechnologies: string[] = ['AI/Machine Learning', 'Web Development', 'Mobile Development', 'IoT', 'Cybersecurity', 'Data Science', 'Cloud Computing', 'Robotics', 'Embedded Systems', 'Game Development'];
  availableTools: string[] = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C#', 'React', 'Angular', 'Vue.js', 'Node.js', 'ASP.NET Core', 'TensorFlow', 'PyTorch', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Firebase', 'Unity'];

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private categoryService: CategoryService,
    private departmentService: DepartmentService,
    private router: Router,
    private popupService: PopupService // حقن خدمة الباوباب
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadDropdownData();
  }

  initializeForm(): void {
    this.projectForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      score: [null, [Validators.min(0), Validators.max(100)]],
      technologies: this.buildCheckboxArray(this.availableTechnologies),
      toolsUsed: this.buildCheckboxArray(this.availableTools),
      problemStatement: ['', Validators.required],
      patentNumber: [null, [Validators.pattern("^[0-9]*$")]],
      patentDate: [null],
      categoryId: [null, Validators.required],
      departments: this.fb.array([], this.minOneCheckboxSelectedValidator()),
      members: this.fb.array([this.newMember()], Validators.required),
      supervisors: this.fb.array([this.newSupervisor()], Validators.required),
      evaluators: this.fb.array([this.newEvaluator()], Validators.required)
    });
  }

  buildCheckboxArray(items: string[]): FormArray {
    const arr = items.map(() => this.fb.control(false));
    return this.fb.array(arr, this.minOneCheckboxSelectedValidator());
  }

  loadDropdownData(): void {
    this.categoryService.getAllCategories().subscribe(data => this.categories = data);
    this.departmentService.getAllDepartments().subscribe(data => {
      this.departments = data;
      this.addDepartmentCheckboxes();
    });
  }

  addDepartmentCheckboxes(): void {
    const departmentsFormArray = this.projectForm.get('departments') as FormArray;
    departmentsFormArray.clear();
    this.departments.forEach(() => departmentsFormArray.push(this.fb.control(false)));
  }

  minOneCheckboxSelectedValidator(): ValidatorFn {
    return (formArray: AbstractControl): { [key: string]: any } | null => {
      if (formArray instanceof FormArray) {
        return formArray.controls.some(c => c.value) ? null : { required: true };
      }
      return null;
    };
  }

  get f() { return this.projectForm.controls; }
  get members() { return this.projectForm.get('members') as FormArray; }
  get supervisors() { return this.projectForm.get('supervisors') as FormArray; }
  get evaluators() { return this.projectForm.get('evaluators') as FormArray; }
  get departmentsArray() { return this.projectForm.get('departments') as FormArray; }
  get technologiesArray() { return this.projectForm.get('technologies') as FormArray; }
  get toolsUsedArray() { return this.projectForm.get('toolsUsed') as FormArray; }

  getSelectedItems(items: string[], formArray: FormArray): string[] {
    return items.filter((_, i) => formArray.at(i).value);
  }
  removeItem(index: number, formArray: FormArray): void {
    formArray.at(index).setValue(false);
  }

  newMember(): FormGroup { return this.fb.group({ name: ['', Validators.required], academicId: [null, [Validators.required, Validators.pattern("^[0-9]+$")]], academicDegree: [0, Validators.required] }); }
  addMember(): void { this.members.push(this.newMember()); }
  removeMember(index: number): void { this.members.removeAt(index); }

  newSupervisor(): FormGroup { return this.fb.group({ id: [null, [Validators.required, Validators.pattern("^[0-9]+$")]] }); }
  addSupervisor(): void { this.supervisors.push(this.newSupervisor()); }
  removeSupervisor(index: number): void { this.supervisors.removeAt(index); }

  newEvaluator(): FormGroup { return this.fb.group({ name: ['', Validators.required], academicDegree: [0, Validators.required], score: [null, [Validators.required, Validators.min(0), Validators.max(100)]] }); }
  addEvaluator(): void { this.evaluators.push(this.newEvaluator()); }
  removeEvaluator(index: number): void { this.evaluators.removeAt(index); }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      this.popupService.showError('Validation Error', 'Please fill all required fields correctly.');
      return;
    }
    this.isSubmitting = true;
    const formValue = this.projectForm.getRawValue();

    const payload = {
      title: formValue.title,
      description: formValue.description,
      score: formValue.score ? Number(formValue.score) : 0,
      technologies: this.getSelectedItems(this.availableTechnologies, this.technologiesArray).join(', '),
      toolsUsed: this.getSelectedItems(this.availableTools, this.toolsUsedArray).join(', '),
      problemStatement: formValue.problemStatement,
      patentNumber: formValue.patentNumber ? Number(formValue.patentNumber) : 0,
      patentDate: formValue.patentDate || null,
      categoryId: Number(formValue.categoryId),
      departments: this.departments.filter((_, i) => formValue.departments[i]).map(d => d.id),
      members: formValue.members,
      supervisors: formValue.supervisors.map((s: { id: number }) => s.id),
      evaluators: formValue.evaluators
    };

    this.projectService.createProject(payload).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => {
        this.popupService.showSuccess(
          'Project Created!',
          'Your project has been successfully created.',
          () => this.router.navigate(['/my-projects'])
        );
      },
      error: (err) => {
        const errorMessage = err.error || err.message || 'Failed to create project. Please try again.';
        this.popupService.showError('Creation Failed', errorMessage);
      }
    });
  }

  onCancel(): void { this.router.navigate(['/Home']); }
}
