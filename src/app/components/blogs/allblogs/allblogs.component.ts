import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { environment } from '../../../environments/environment';
import { Blog } from '../../../models/Blog';
import { BlogService } from '../../../Services/blog.service';

@Component({
  selector: 'app-All-blogs',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './allblogs.component.html',
  styleUrls: ['./allblogs.component.css']
})
export class AllblogsComponent implements OnInit {
  blogs: Blog[] = [];
  isLoading = true;
  error: string | null = null;
  imagesBaseUrl = environment.imagesBaseUrl;

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

  onDelete(event: MouseEvent, id: number): void {
    event.stopPropagation();
    event.preventDefault();

    if (confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      this.blogService.deleteBlog(id).subscribe({
        next: () => {
          alert('Blog post deleted successfully!');
          this.loadBlogs();
        },
        error: (err) => {
          console.error(`Error deleting blog with id ${id}:`, err);
          alert('An error occurred while deleting the post. You might need to be logged in.');
        }
      });
    }
  }
}
