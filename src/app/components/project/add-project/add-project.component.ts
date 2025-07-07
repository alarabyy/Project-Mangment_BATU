import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../Services/project.service';
import { CategoryService } from '../../../Services/category.service';
import { DepartmentService } from '../../../Services/department.service';
import { Category } from '../../../models/category';
import { Department } from '../../../models/department';
import { finalize } from 'rxjs';
// 1. استيراد الموديل المفقود لضمان سلامة الأنواع
import { Project } from '../../../models/project';

@Component({
  selector: 'app-add-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css']
})
export class AddProjectComponent implements OnInit {
  projectForm!: FormGroup;
  isSubmitting = false;
  categories: Category[] = [];
  departments: Department[] = [];

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

  // 3. تم توحيد تهيئة الفورم لتكون منطقية ومتوافقة مع الـ HTML
  initializeForm(): void {
    this.projectForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      // جعل الحقل اختيارياً مع التحقق من القيمة إذا أدخلت
      grade: [null, [Validators.min(0), Validators.max(100)]],
      technologies: ['', Validators.required],
      toolsUsed: ['', Validators.required],
      problemStatement: ['', Validators.required],
      // استخدام valdiator للتحقق من أن المدخل هو رقم
      leaderId: [null, [Validators.required, Validators.pattern("^[0-9]*$")]],
      categoryId: [null, Validators.required],
      departmentId: [null, Validators.required]
    });
  }

  // استخدام الخدمات الحقيقية لتحميل بيانات القوائم المنسدلة
  loadDropdownData(): void {
    this.categoryService.getAllCategories().subscribe(data => this.categories = data);
    this.departmentService.getAllDepartments().subscribe(data => this.departments = data);
  }

  // Getter للوصول السهل لعناصر التحكم في الفورم من الـ HTML
  get f() { return this.projectForm.controls; }

  // 2. تحسين منطق onSubmit لاستخدام استجابة الـ API وتوجيه المستخدم لصفحة التعديل
  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    // تحويل قيمة الفورم إلى النوع الذي تتوقعه الخدمة لضمان سلامة الأنواع
    const projectData = this.projectForm.value as Omit<Project, 'id'>;

    this.projectService.createProject(projectData).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: (newProject) => {
        console.log('Project created successfully:', newProject);
        // توجيه المستخدم لصفحة التعديل مع `id` المشروع الجديد
        // هذا يسمح للمستخدم بإضافة الصور والتفاصيل مباشرة بعد الإنشاء
        this.router.navigate(['/projects/edit', newProject.id]);
      },
      error: (err) => {
        console.error('Error creating project:', err);
        // يمكنك هنا عرض رسالة خطأ للمستخدم
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/projects']);
  }
}
