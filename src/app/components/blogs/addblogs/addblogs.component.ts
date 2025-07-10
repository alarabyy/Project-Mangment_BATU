import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
  selectedImages: File[] = [];

  constructor(
    private fb: FormBuilder,
    private blogService: BlogService,
    private router: Router
  ) {
    this.blogForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', [Validators.required, Validators.minLength(10)]],
      headerImage: [null, Validators.required],
      images: [null]
    });
  }

  onHeaderImageChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedHeaderImage = file;
      this.blogForm.patchValue({ headerImage: file.name });
    }
  }

  onImagesChange(event: any): void {
    this.selectedImages = Array.from(event.target.files);
    this.blogForm.patchValue({ images: this.selectedImages.length > 0 ? this.selectedImages.map(f => f.name) : null });
  }

  onSubmit(): void {
    if (this.blogForm.invalid) {
      this.blogForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();
    formData.append('title', this.blogForm.get('title')?.value);
    formData.append('content', this.blogForm.get('content')?.value);

    if (this.selectedHeaderImage) {
      formData.append('headerImage', this.selectedHeaderImage, this.selectedHeaderImage.name);
    }

    if (this.selectedImages.length > 0) {
      this.selectedImages.forEach(file => {
        formData.append('images', file, file.name);
      });
    }

    this.blogService.createBlog(formData).subscribe({
      next: (response) => {
        alert('Blog post created successfully!');
        this.router.navigate(['/blogs']);
      },
      error: (err) => {
        alert('An error occurred while creating the post. You might need to be logged in.');
        this.isSubmitting = false;
      }
    });
  }

  get title() { return this.blogForm.get('title'); }
  get content() { return this.blogForm.get('content'); }
  get headerImage() { return this.blogForm.get('headerImage'); }
}
