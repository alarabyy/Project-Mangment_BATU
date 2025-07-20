// src/app/components/add-project/add-project.component.ts
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
import { Faculty } from '../../../models/faculty';
import { SuccessPopupComponent } from '../success-popup/success-popup.component';
import { Member } from '../../../models/project'; // Make sure Project model defines Member interface correctly

@Component({
  selector: 'app-add-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SuccessPopupComponent],
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css']
})
export class AddProjectComponent implements OnInit {
  projectForm!: FormGroup;
  isSubmitting = false;
  categories: Category[] = [];
  departments: Department[] = [];
  faculties: Faculty[] = [
    {
      id: 1,
      name: 'IT Faculty',
      description: 'Faculty dedicated to Information Technology and Computer Science.',
      deanId: 101,
      dean: { id: 101, name: 'Dr. Ahmad Adel' }
    },
    {
      id: 2,
      name: 'Industry & Energy Faculty',
      description: 'Faculty focused on industrial engineering and energy solutions.',
      deanId: 102,
      dean: { id: 102, name: 'Dr. Sara Hesham' }
    },
    {
      id: 3,
      name: 'Health Sciences Faculty',
      description: 'Faculty providing education in various health science disciplines.',
      deanId: 103,
      dean: { id: 103, name: 'Dr. Karim Tarek' }
    },
    {
      id: 4,
      name: 'Food Industries Faculty',
      description: 'Faculty specializing in food science, technology, and engineering.',
      deanId: 104,
      dean: { id: 104, name: 'Dr. Mona Hassan' }
    }
  ];

  availableTechnologies: string[] = [
    'Artificial Intelligence (AI)', 'Machine Learning (ML)', 'Data Science', 'Big Data Analytics',
    'Internet of Things (IoT)', 'Cybersecurity', 'Cloud Computing', 'Web Development',
    'Mobile App Development', 'Robotics', 'Embedded Systems', 'Digital Twins',
    'Bioinformatics', 'Medical Imaging', 'Telemedicine', 'Smart Manufacturing',
    'Renewable Energy Systems', 'Food Processing Automation', 'Quality Control Systems', 'Supply Chain Optimization'
  ];

  availableTools: string[] = [
    'Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'Node.js', 'React', 'Angular', 'Vue.js', 'Spring Boot',
    'Django', 'Flask', 'ASP.NET Core', 'SQL Server', 'MySQL', 'PostgreSQL', 'MongoDB', 'Firebase', 'AWS', 'Azure',
    'Google Cloud Platform (GCP)', 'Docker', 'Kubernetes', 'Git', 'GitHub', 'Jira', 'Confluence', 'Figma', 'Adobe XD', 'Photoshop',
    'Illustrator', 'Unity', 'Unreal Engine', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'MATLAB', 'RStudio'
  ];

  showSuccessPopup = false;
  popupTitle = '';
  popupMessage = '';

  // New state variables for toggling checkbox visibility
  showTechnologiesCheckboxes: boolean = false;
  showToolsUsedCheckboxes: boolean = false;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private categoryService: CategoryService,
    private departmentService: DepartmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadDropdownData();
  }

  initializeForm(): void {
    this.projectForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      grade: [null, [Validators.min(0), Validators.max(100)]],
      technologies: this.fb.array([], this.minOneCheckboxSelectedValidator('technologies')),
      toolsUsed: this.fb.array([], this.minOneCheckboxSelectedValidator('toolsUsed')),
      problemStatement: ['', Validators.required],
      // تم حذف teamLeaderId بناءً على الطلب
      categoryId: [null, Validators.required],
      departmentId: [null, Validators.required],
      facultyId: [null, Validators.required],
      members: this.fb.array([this.newMember()]),
      supervisors: this.fb.array([this.newSupervisor()]) // Supervisor ID validation handled within newSupervisor
    });

    this.addTechnologyCheckboxes();
    this.addToolsCheckboxes();
  }

  private addTechnologyCheckboxes(): void {
    this.availableTechnologies.forEach(() => (this.projectForm.get('technologies') as FormArray).push(this.fb.control(false)));
  }

  private addToolsCheckboxes(): void {
    this.availableTools.forEach(() => (this.projectForm.get('toolsUsed') as FormArray).push(this.fb.control(false)));
  }

  minOneCheckboxSelectedValidator(controlName: string): ValidatorFn {
    return (formArray: AbstractControl): { [key: string]: any } | null => {
      if (!(formArray instanceof FormArray)) {
        return null;
      }
      const selected = formArray.controls
        .map(control => control.value)
        .some(value => value === true);
      return selected ? null : { [`${controlName}Required`]: true };
    };
  }

  loadDropdownData(): void {
    this.categoryService.getAllCategories().subscribe({
        next: (data) => this.categories = data,
        error: (err) => console.error('Failed to load categories', err)
    });
    this.departmentService.getAllDepartments().subscribe({
        next: (data) => this.departments = data,
        error: (err) => console.error('Failed to load departments', err)
    });
  }

  get f() { return this.projectForm.controls; }
  get members() { return this.projectForm.get('members') as FormArray; }
  get technologiesArray() { return this.projectForm.get('technologies') as FormArray; }
  get toolsUsedArray() { return this.projectForm.get('toolsUsed') as FormArray; }
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
    // التحقق من وجود المشرف يتم على مستوى الـ Backend
    // هنا يتم فقط التحقق من صحة تنسيق الـ ID
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

  // New methods to toggle visibility
  toggleTechnologiesVisibility(): void {
    this.showTechnologiesCheckboxes = !this.showTechnologiesCheckboxes;
    // Optionally, mark as touched when shown to trigger validation feedback immediately
    if (this.showTechnologiesCheckboxes) {
      this.technologiesArray.markAsTouched();
    }
  }

  toggleToolsUsedVisibility(): void {
    this.showToolsUsedCheckboxes = !this.showToolsUsedCheckboxes;
    // Optionally, mark as touched when shown to trigger validation feedback immediately
    if (this.showToolsUsedCheckboxes) {
      this.toolsUsedArray.markAsTouched();
    }
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
      // Ensure hidden FormArrays are also marked as touched on submit
      this.technologiesArray.markAsTouched();
      this.toolsUsedArray.markAsTouched();
      return;
    }
    this.isSubmitting = true;

    const formValue = this.projectForm.value;

    const selectedTechnologies = this.availableTechnologies
      .filter((tech, i) => this.technologiesArray.controls[i].value)
      .join(', ');

    const selectedToolsUsed = this.availableTools
      .filter((tool, i) => this.toolsUsedArray.controls[i].value)
      .join(', ');

    const supervisorIds = formValue.supervisors.map((s: any) => Number(s.id));

    const payload = {
      title: formValue.title,
      description: formValue.description,
      grade: formValue.grade,
      technologies: selectedTechnologies,
      toolsUsed: selectedToolsUsed,
      problemStatement: formValue.problemStatement,
      // تم حذف teamLeaderId من الـ payload
      categoryId: formValue.categoryId,
      departmentId: formValue.departmentId,
      facultyId: formValue.facultyId,
      members: formValue.members.map((m: any) => ({
        name: m.name,
        academicId: Number(m.academicId)
      })),
      supervisors: supervisorIds
    };

    this.projectService.createProject(payload).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: (response) => {
        if (typeof response === 'string' && response.trim() !== '') {
            alert(response);
            this.router.navigate(['/Home']);
        } else {
            this.popupTitle = 'Project Created!';
            this.popupMessage = 'Your project has been successfully created. Find it in the project list to edit it and upload images.';
            this.showSuccessPopup = true;
        }
      },
      error: (err) => {
        console.error('An error occurred during project creation:', err);
        const errorMessage = err.error?.message || err.message || 'Failed to create the project. Please try again.';
        alert(errorMessage);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/Home']);
  }

  closePopup(): void {
    this.showSuccessPopup = false;
    this.router.navigate(['/Home']);
  }
}
