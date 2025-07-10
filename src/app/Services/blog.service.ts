import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Blog, BlogDetails } from '../models/Blog';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private apiUrl = `${environment.apiUrl}/blogs`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    // افترض أنك تحفظ التوكن في localStorage بعد تسجيل الدخول
    const token = localStorage.getItem('auth_token');

    // إذا لم يكن هناك توكن، أرجع هيدر فارغ
    if (!token) {
      return new HttpHeaders();
    }

    // إذا كان هناك توكن، أرجع الهيدر مع التوكن
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // --- دوال لا تحتاج تسجيل دخول ---
  getAllBlogs(): Observable<Blog[]> {
    return this.http.get<Blog[]>(`${this.apiUrl}/get/all`);
  }

  getBlogDetails(id: number): Observable<BlogDetails> {
    return this.http.get<BlogDetails>(`${this.apiUrl}/get/${id}`);
  }

  // --- دوال تحتاج تسجيل دخول (تم تعديلها لتشمل الهيدر) ---
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
