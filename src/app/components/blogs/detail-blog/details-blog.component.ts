import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { environment } from '../../../environments/environment';
import { BlogDetails } from '../../../models/Blog';
import { BlogService } from '../../../Services/blog.service';

@Component({
  selector: 'app-details-blog',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './details-blog.component.html',
  styleUrls: ['./details-blog.component.css']
})
export class DetailsBlogComponent implements OnInit {
  blog: BlogDetails | null = null;
  isLoading = true;
  error: string | null = null;
  imagesBaseUrl = environment.imagesBaseUrl;

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBlogDetails(+id);
    } else {
      this.error = 'Blog post not found in URL.';
      this.isLoading = false;
    }
  }

  loadBlogDetails(id: number): void {
    this.isLoading = true;
    this.error = null;
    this.blogService.getBlogDetails(id).subscribe({
      next: (data) => {
        this.blog = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching blog details:', err);
        this.error = 'Failed to load blog post. It may have been deleted or the link is incorrect.';
        this.isLoading = false;
      }
    });
  }
}
