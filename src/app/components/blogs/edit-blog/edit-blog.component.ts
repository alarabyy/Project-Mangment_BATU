import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { BlogDetails, BlogDetailsForEdit } from '../../../models/Blog';
import { BlogService } from '../../../Services/blog.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

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
  currentBlog: BlogDetailsForEdit | null = null;
  imagesBaseUrl = environment.imageBaseUrl;

  selectedHeaderImage: File | null = null;
  selectedHeaderImagePreview: string | ArrayBuffer | null = null;

  newGalleryFiles: File[] = [];
  newGalleryPreviews: { file: File, url: string | ArrayBuffer | null }[] = [];

  deletedImageUrls: string[] = [];

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
      alert('Error: Blog ID is missing. Redirecting to blogs list.');
      this.isLoading = false;
      this.router.navigate(['/blogs']);
    }
  }

  loadBlogData(): void {
    if (!this.blogId) {
        this.isLoading = false;
        return;
    }

    this.isLoading = true;
    this.blogService.getBlogDetails(this.blogId).pipe(
      finalize(() => this.isLoading = false),
      catchError(err => {
        console.error('Error loading blog data in component:', err);
        alert(`Failed to load blog data: ${err.message || 'The post may not exist or an error occurred.'}`);
        this.router.navigate(['/blogs']);
        return of(null);
      })
    ).subscribe({
      next: (data) => {
        if (!data) return;

        const blogImages = Array.isArray(data.images)
                           ? data.images
                           : (typeof data.images === 'string'
                               ? data.images.split(',').filter(s => s.trim() !== '')
                               : []);

        this.currentBlog = { ...data, images: blogImages } as BlogDetailsForEdit;
        this.blogForm.patchValue({
          title: data.title,
          content: data.content
        });
        if (data.headerImage) {
          this.selectedHeaderImagePreview = this.imagesBaseUrl + data.headerImage;
        }
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
          this.newGalleryFiles.push(file);
        };
        reader.readAsDataURL(file);
      });
      event.target.value = '';
    }
  }

  removeCurrentGalleryImage(imageUrl: string): void {
    if (this.currentBlog) {
      this.currentBlog.images = this.currentBlog.images.filter(img => img !== imageUrl);
      this.deletedImageUrls.push(imageUrl);
      console.log('Deleted Image URLs:', this.deletedImageUrls);
    }
  }

  removeNewGalleryImage(index: number): void {
    this.newGalleryFiles.splice(index, 1);
    this.newGalleryPreviews.splice(index, 1);
    console.log('New Gallery Files after removal:', this.newGalleryFiles.map(f => f.name));
  }

  onSubmit(): void {
    if (this.blogForm.invalid) {
      this.blogForm.markAllAsTouched();
      alert('Please fill in all required fields correctly.');
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

    // 2. تجميع أسماء الصور النهائية للمعرض في حقل 'addedImages' (وفقاً لـ Backend API الذي قدمته)
    const finalGalleryImageNames: string[] = [];

    // إضافة أسماء الصور الموجودة (التي لم تُحذف بعد من currentBlog.images)
    if (this.currentBlog && this.currentBlog.images.length > 0) {
      finalGalleryImageNames.push(...this.currentBlog.images);
    }
    // إضافة أسماء الملفات الجديدة (هنا يجب أن يكون الـ Backend قد تلقاها في خطوة رفع منفصلة أو أنه يعالج الأسماء فقط)
    this.newGalleryFiles.forEach(file => {
      finalGalleryImageNames.push(file.name); // نرسل أسماء الملفات الجديدة
    });

    // إرسال addedImages كـ Array<string> (كل اسم صورة كحقل منفصل باسم 'addedImages')
    finalGalleryImageNames.forEach(imageName => {
        formData.append('addedImages', imageName);
    });

    // 3. إرسال قائمة بمسارات الصور الموجودة التي تم تحديدها للحذف
    // (وفقاً لـ Backend API الذي قدمته: حقل `removedImages` من نوع string مفصول بفواصل)
    if (this.deletedImageUrls.length > 0) {
      formData.append('removedImages', this.deletedImageUrls.join(','));
    }

    this.blogService.updateBlog(formData).pipe(
      finalize(() => this.isSubmitting = false),
      catchError(err => {
        console.error('Error updating blog in component:', err);
        alert(`An error occurred while updating the post: ${err.message || 'Please check console for details.'}`);
        return of(null);
      })
    ).subscribe({
      next: (response) => {
        if (response) {
          alert('Blog post updated successfully!');
          this.router.navigate(['/blogs', this.blogId]);
        }
      }
    });
  }

  // Getters for form controls
  get title() { return this.blogForm.get('title'); }
  get content() { return this.blogForm.get('content'); }
}
