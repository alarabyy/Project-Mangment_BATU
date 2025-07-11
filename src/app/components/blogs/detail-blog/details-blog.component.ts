import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { BlogDetails, BlogDetailsDisplay } from '../../../models/Blog';
import { BlogService } from '../../../Services/blog.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-details-blog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './details-blog.component.html',
  styleUrls: ['./details-blog.component.css']
})
export class DetailsBlogComponent implements OnInit {
  blogDetails: BlogDetailsDisplay | null = null;
  isLoading = true;
  blogId: number | null = null;
  imagesBaseUrl = environment.imageBaseUrl;

  constructor(
    private blogService: BlogService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.blogId = +idParam;
      this.loadBlogDetails();
    } else {
      console.error('Blog ID not found in URL.');
      alert('Error: Blog ID is missing.');
      this.isLoading = false;
      this.router.navigate(['/blogs']);
    }
  }

  loadBlogDetails(): void {
    if (!this.blogId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.blogService.getBlogDetails(this.blogId).pipe(
      finalize(() => this.isLoading = false),
      catchError(err => {
        console.error('Error loading blog details:', err);
        alert(`Failed to load blog details: ${err.message || 'The blog post may not exist or an error occurred.'}`);
        this.router.navigate(['/blogs']);
        return of(null);
      })
    ).subscribe({
      next: (data) => {
        if (!data) return;

        const imagesArray = Array.isArray(data.images)
                          ? data.images
                          : (typeof data.images === 'string'
                              ? data.images.split(',').filter(s => s.trim() !== '')
                              : []);

        this.blogDetails = { ...data, images: imagesArray } as BlogDetailsDisplay;
        console.log('Loaded Blog Details:', this.blogDetails);
      }
    });
  }
}
