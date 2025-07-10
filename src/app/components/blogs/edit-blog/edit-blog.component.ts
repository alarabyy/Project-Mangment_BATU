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
  imagesBaseUrl = environment.imagesBaseUrl;

  selectedHeaderImage: File | null = null;
  selectedImages: File[] = [];

  constructor(
    private fb: FormBuilder,
    private blogService: BlogService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.blogForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      headerImage: [null],
      images: [null]
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
    }
  }

  onImagesChange(event: any): void {
    this.selectedImages = Array.from(event.target.files);
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

    if (this.selectedHeaderImage) {
      formData.append('headerImage', this.selectedHeaderImage, this.selectedHeaderImage.name);
    }

    if (this.selectedImages.length > 0) {
      this.selectedImages.forEach(file => {
        formData.append('images', file, file.name);
      });
    }

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
}
