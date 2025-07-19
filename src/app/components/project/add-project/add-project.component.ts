import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, AbstractControl, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../Services/project.service';
import { CategoryService } from '../../../Services/category.service';
import { DepartmentService } from '../../../Services/department.service';
// import { FacultyService } from '../../../Services/faculty.service'; // تم إزالة الاستيراد لأن الكليات ستكون ثابتة
import { finalize } from 'rxjs';
import { Category } from '../../../models/category';
import { Department } from '../../../models/department';
import { Faculty } from '../../../models/faculty'; // لا يزال مستخدماً للنوع فقط
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
  // الكليات الثابتة المطلوبة، الآن مع جميع الخصائص المطلوبة من Faculty interface
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

  // قائمة 20 تقنية مركزة على الكليات المحددة
  availableTechnologies: string[] = [
    'Artificial Intelligence (AI)', 'Machine Learning (ML)', 'Data Science', 'Big Data Analytics',
    'Internet of Things (IoT)', 'Cybersecurity', 'Cloud Computing', 'Web Development',
    'Mobile App Development', 'Robotics', 'Embedded Systems', 'Digital Twins',
    'Bioinformatics', 'Medical Imaging', 'Telemedicine', 'Smart Manufacturing',
    'Renewable Energy Systems', 'Food Processing Automation', 'Quality Control Systems', 'Supply Chain Optimization'
  ];

  showSuccessPopup = false;
  popupTitle = '';
  popupMessage = '';

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
      // Technologies لا تزال FormArray مع Checkboxes
      technologies: this.fb.array([], this.minOneCheckboxSelectedValidator('technologies')),
      // Tools Used عادت إلى حقل نصي واحد
      toolsUsed: ['', Validators.required],
      problemStatement: ['', Validators.required],
      teamLeaderId: [null, [Validators.required, Validators.pattern("^[0-9]*$")]],
      categoryId: [null, Validators.required],
      departmentId: [null, Validators.required],
      facultyId: [null, Validators.required], // حقل الكلية
      members: this.fb.array([this.newMember()])
    });

    // ملء FormArray بالـ Checkboxes للـ Technologies فقط
    this.addTechnologyCheckboxes();
  }

  // دالة مساعدة لملء Technologies FormArray
  private addTechnologyCheckboxes(): void {
    this.availableTechnologies.forEach(() => (this.projectForm.get('technologies') as FormArray).push(this.fb.control(false)));
  }

  // Validator مخصص للتأكد من اختيار checkbox واحد على الأقل (للـ Technologies)
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
    // الكليات لم تعد تُجلب من الخدمة، بل هي ثابتة
  }

  get f() { return this.projectForm.controls; }
  get members() { return this.projectForm.get('members') as FormArray; }
  // Getter للـ FormArray الخاص بالـ Technologies فقط
  get technologiesArray() { return this.projectForm.get('technologies') as FormArray; }

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

  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      this.members.controls.forEach(control => {
        if (control instanceof FormGroup) {
          Object.values(control.controls).forEach(c => c.markAsTouched());
        }
      });
      this.technologiesArray.markAsTouched(); // للتأكد من التحقق من الـ Technologies
      return;
    }
    this.isSubmitting = true;

    const formValue = this.projectForm.value;

    // تحويل الـ Technologies المختارة إلى string مفصول بفاصلة
    const selectedTechnologies = this.availableTechnologies
      .filter((tech, i) => this.technologiesArray.controls[i].value)
      .join(', ');

    // Tools Used أصبح نصاً عادياً مباشرة من formValue
    const toolsUsed = formValue.toolsUsed;

    const payload = {
      title: formValue.title,
      description: formValue.description,
      grade: formValue.grade,
      technologies: selectedTechnologies, // استخدام السلسلة النصية المعالجة
      toolsUsed: toolsUsed,               // استخدام النص مباشرة
      problemStatement: formValue.problemStatement,
      teamLeaderId: Number(formValue.teamLeaderId),
      categoryId: formValue.categoryId,
      departmentId: formValue.departmentId,
      facultyId: formValue.facultyId, // تضمين facultyId
      members: formValue.members.map((m: any) => ({
        name: m.name,
        academicId: Number(m.academicId)
      }))
    };

    this.projectService.createProject(payload).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: (response) => {
        // Handle response from the backend. Assuming backend returns a string message or success object
        if (typeof response === 'string' && response.trim() !== '') {
            // If it's a string message, display it as an alert
            alert(response);
            this.router.navigate(['/Home']); // Navigate after displaying alert
        } else {
            // Otherwise, assume successful object response, show popup
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
