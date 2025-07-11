import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { Blog } from '../../../models/Blog';
import { BlogService } from '../../../Services/blog.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-all-blogs-user',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './all-blogs-user.component.html',
  styleUrl: './all-blogs-user.component.css'
})
export class AllBlogsUserComponent implements OnInit  {

  blogs: Blog[] = [];
  isLoading = true;
  error: string | null = null;
  imagesBaseUrl = environment.apiUploadUrl;

  constructor(private blogService: BlogService) { }

  ngOnInit(): void { this.loadBlogs(); }

  loadBlogs(): void {
    this.isLoading = true;
    this.error = null;
    this.blogService.getAllBlogs().subscribe({
      next: (data) => {
        this.blogs = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching blogs:', err);
        this.error = 'Failed to load posts. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
