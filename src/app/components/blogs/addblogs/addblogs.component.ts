import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms'; // إضافة FormArray
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BlogService } from '../../../Services/blog.service';

@Component({
  selector: 'app-addblogs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './addblogs.component.html',
  styleUrls: ['./addblogs.component.css']
})
export class AddblogsComponent {
  blogForm: FormGroup;
  isSubmitting = false;
  selectedHeaderImage: File | null = null;
  selectedHeaderImagePreview: string | ArrayBuffer | null = null; // لمعاينة الصورة الرئيسية

  // لم تعد هناك حاجة لـ selectedImages: File[] بشكل مباشر للتحكم في الإدخال،
  // بدلاً من ذلك، سنستخدم FormArray من أجل ملفات الصور الإضافية
  // ولكن ما زلنا نحتاج إلى تخزين ملفات File الفعلية للرفع
  galleryFiles: File[] = [];
  galleryPreviews: { file: File, url: string | ArrayBuffer | null }[] = []; // لتخزين الملفات ومعاينتها

  constructor(
    private fb: FormBuilder,
    private blogService: BlogService,
    private router: Router
  ) {
    this.blogForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', [Validators.required, Validators.minLength(10)]],
      headerImage: [null],
      // images: this.fb.array([]) // لم نعد نحتاج FormArray هنا للتحقق فقط، بل لرفع الملفات
    });
  }

  onHeaderImageChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedHeaderImage = file;
      this.blogForm.get('headerImage')?.setErrors(null); // Clear errors

      // معاينة الصورة الرئيسية
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedHeaderImagePreview = reader.result;
      };
      reader.readAsDataURL(file);

    } else {
      this.selectedHeaderImage = null;
      this.selectedHeaderImagePreview = null;
      this.blogForm.get('headerImage')?.setErrors({ 'required': true });
      this.blogForm.get('headerImage')?.markAsTouched();
    }
  }

  // دالة لإضافة صور المعرض
  onAddGalleryImages(event: any): void {
    const files = Array.from(event.target.files) as File[];
    if (files.length > 0) {
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          this.galleryPreviews.push({ file: file, url: reader.result });
          this.galleryFiles.push(file); // إضافة الملف الفعلي للرفع
        };
        reader.readAsDataURL(file);
      });
      // مسح قيمة input file بعد اختيار الملفات للسماح باختيار نفس الملفات مرة أخرى
      event.target.value = '';
    }
  }

  removeGalleryImage(index: number): void {
    this.galleryPreviews.splice(index, 1);
    this.galleryFiles.splice(index, 1);
  }

  onSubmit(): void {
    // تحقق يدويًا من صورة الهيدر
    if (!this.selectedHeaderImage) {
      this.blogForm.get('headerImage')?.setErrors({ 'required': true });
      this.blogForm.get('headerImage')?.markAsTouched();
    } else {
      this.blogForm.get('headerImage')?.setErrors(null);
    }

    if (this.blogForm.invalid || !this.selectedHeaderImage) {
      this.blogForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();
    formData.append('title', this.blogForm.get('title')?.value);
    formData.append('content', this.blogForm.get('content')?.value);

    // selectedHeaderImage مضمون ألا يكون null هنا
    formData.append('headerImage', this.selectedHeaderImage, this.selectedHeaderImage.name);

    // إضافة صور المعرض إلى FormData
    if (this.galleryFiles.length > 0) {
      this.galleryFiles.forEach(file => {
        formData.append('images', file, file.name); // 'images' هو اسم الحقل المتوقع في الباك إند لمجموعة الصور
      });
    }

    this.blogService.createBlog(formData).subscribe({
      next: (response) => {
        alert('Blog post created successfully!');
        this.router.navigate(['/blogs']);
      },
      error: (err) => {
        console.error('Error creating blog post:', err);
        alert('An error occurred while creating the post. You might need to be logged in.');
        this.isSubmitting = false;
      }
    });
  }

  get title() { return this.blogForm.get('title'); }
  get content() { return this.blogForm.get('content'); }
  get headerImageError() {
    // عرض خطأ required فقط إذا لم يتم اختيار صورة وإذا كان الحقل touched/dirty
    return !this.selectedHeaderImage && (this.blogForm.get('headerImage')?.dirty || this.blogForm.get('headerImage')?.touched);
  }
}
