import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { BlogDetails } from '../../../models/Blog';
import { BlogService } from '../../../Services/blog.service';

@Component({
  selector: 'app-edit-blog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './edit-blog.component.html',
  styleUrls: ['./edit-blog.component.css']
})
export class EditBlogComponent implements OnInit {
  blogForm: FormGroup;
  isSubmitting = false;
  isLoading = true;
  blogId: number | null = null;
  currentBlog: BlogDetails | null = null;
  imagesBaseUrl = environment.apiUploadUrl;

  selectedHeaderImage: File | null = null;
  selectedHeaderImagePreview: string | ArrayBuffer | null = null;

  newGalleryFiles: File[] = []; // ملفات الصور الجديدة التي يختارها المستخدم للإضافة
  newGalleryPreviews: { file: File, url: string | ArrayBuffer | null }[] = []; // معاينات للصور الجديدة

  deletedImageUrls: string[] = []; // مسارات URL للصور الموجودة التي تم تحديدها للحذف

  constructor(
    private fb: FormBuilder,
    private blogService: BlogService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.blogForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.blogId = +idParam;
      this.loadBlogData();
    } else {
      console.error('Blog ID not found in URL');
      alert('Error: Blog ID is missing.');
      this.isLoading = false;
      this.router.navigate(['/blogs']);
    }
  }

  loadBlogData(): void {
    if (!this.blogId) return;

    this.isLoading = true;
    this.blogService.getBlogDetails(this.blogId).subscribe({
      next: (data) => {
        this.currentBlog = data;
        this.blogForm.patchValue({
          title: data.title,
          content: data.content
        });
        if (data.headerImage) {
          this.selectedHeaderImagePreview = this.imagesBaseUrl + data.headerImage;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading blog data:', err);
        alert('Failed to load blog data. The post may not exist.');
        this.isLoading = false;
        this.router.navigate(['/blogs']);
      }
    });
  }

  onHeaderImageChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedHeaderImage = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedHeaderImagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedHeaderImage = null;
      // إذا لم يتم اختيار ملف جديد، نعيد معاينة الصورة الحالية
      this.selectedHeaderImagePreview = this.currentBlog?.headerImage ? this.imagesBaseUrl + this.currentBlog.headerImage : null;
    }
  }

  onAddNewGalleryImages(event: any): void {
    const files = Array.from(event.target.files) as File[];
    if (files.length > 0) {
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          this.newGalleryPreviews.push({ file: file, url: reader.result });
          this.newGalleryFiles.push(file); // إضافة الملف الفعلي للرفع
        };
        reader.readAsDataURL(file);
      });
      event.target.value = ''; // مسح قيمة input file للسماح باختيار نفس الملفات مرة أخرى
    }
  }

  removeCurrentGalleryImage(imageUrl: string): void {
    if (this.currentBlog && this.currentBlog.images) {
      // إزالة الصورة من قائمة الصور المعروضة حاليا
      this.currentBlog.images = this.currentBlog.images.filter(img => img !== imageUrl);
      // إضافة الصورة إلى قائمة الصور التي سيتم حذفها من الباك إند
      this.deletedImageUrls.push(imageUrl);
    }
  }

  removeNewGalleryImage(index: number): void {
    // إزالة الصورة من قائمة الصور الجديدة التي لم يتم رفعها بعد
    this.newGalleryFiles.splice(index, 1);
    this.newGalleryPreviews.splice(index, 1);
  }

  onSubmit(): void {
    if (this.blogForm.invalid) {
      this.blogForm.markAllAsTouched();
      return;
    }

    if (!this.blogId) {
      alert('Error: Cannot update post without an ID.');
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();
    formData.append('id', this.blogId.toString());
    formData.append('title', this.blogForm.get('title')?.value);
    formData.append('content', this.blogForm.get('content')?.value);

    // 1. إضافة صورة الهيدر الجديدة إذا تم تغييرها
    if (this.selectedHeaderImage) {
      formData.append('headerImage', this.selectedHeaderImage, this.selectedHeaderImage.name);
    }

    // 2. تجميع كل الصور التي يجب أن تكون في المعرض بعد التحديث
    // هذا يشمل الصور الموجودة التي لم تُحذف + الصور الجديدة التي أضافها المستخدم
    const finalGalleryImageFiles: File[] = [];
    const finalGalleryImageNames: string[] = [];

    // إضافة أسماء الصور الموجودة التي لم يتم حذفها (للباك إند لمعالجتها)
    if (this.currentBlog?.images && this.currentBlog.images.length > 0) {
      finalGalleryImageNames.push(...this.currentBlog.images);
    }

    // إضافة ملفات الصور الجديدة التي تم اختيارها
    if (this.newGalleryFiles.length > 0) {
      this.newGalleryFiles.forEach(file => {
        // نرسل ملفات الصور الجديدة بشكل فردي بحقل 'images' (كما في Add)
        formData.append('images', file, file.name);
      });
    }

    // 3. إرسال قائمة بمسارات الصور الموجودة التي تم حذفها
    if (this.deletedImageUrls.length > 0) {
      formData.append('deletedImages', this.deletedImageUrls.join(','));
    } else {
      formData.append('deletedImages', ''); // إرسال فارغ إذا لم يتم حذف أي صور
    }

    // ملاحظة: لا نرسل existingImages كحقل منفصل بمساراتها كـ string،
    // لأننا نعتمد على الباك إند لدمجها مع الصور الجديدة التي يتم رفعها كملفات.
    // يجب على الباك إند:
    // أ- حذف الصور المذكورة في 'deletedImages'.
    // ب- حفظ الصور التي تصل في 'images' (NewGalleryFiles).
    // ج- دمج الصور الجديدة التي تم حفظها مع الصور الموجودة سابقاً (من قاعدة البيانات) التي لم تُحذف، وتحديث حقل Images في قاعدة البيانات.

    this.blogService.updateBlog(formData).subscribe({
      next: () => {
        alert('Blog post updated successfully!');
        this.router.navigate(['/blogs']);
      },
      error: (err) => {
        console.error('Error updating blog:', err);
        alert('An error occurred while updating the post. You might need to be logged in.');
        this.isSubmitting = false;
      }
    });
  }

  // Getters for form controls
  get title() { return this.blogForm.get('title'); }
  get content() { return this.blogForm.get('content'); }
}
