import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { Blog, BlogDetails } from '../models/Blog';
import { AuthService } from './auth.service'; // <--- تم إضافة هذا الاستيراد

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private apiUrl = `${environment.apiUrl}/blogs`;

  // <--- تم حقن AuthService هنا
  constructor(private http: HttpClient, private authService: AuthService) { }

  // <--- تم تعديل هذه الدالة لاستخدام AuthService لجلب الهيدرات
  private getAuthHeaders(): HttpHeaders {
    return this.authService.getAuthHeaders();
  }

  getAllBlogs(): Observable<Blog[]> {
    return this.http.get<Blog[]>(`${this.apiUrl}/get/all`);
  }

  getBlogDetails(id: number): Observable<BlogDetails> {
    return this.http.get<BlogDetails>(`${this.apiUrl}/get/${id}`).pipe(
      map(blog => {
        if (typeof blog.images === 'string') {
          return {
            ...blog,
            images: (blog.images as string).split(',').filter(s => s.trim() !== '')
          };
        }
        return blog;
      })
    );
  }

  createBlog(formData: FormData): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/create`, formData, { headers });
  }

  updateBlog(formData: FormData): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/update`, formData, { headers });
  }

  deleteBlog(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('id', id.toString());

    return this.http.delete<any>(`${this.apiUrl}/delete`, { headers, params });
  }
}
