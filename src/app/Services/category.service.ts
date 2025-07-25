// src/app/services/category.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, CategoryCreatePayload } from '../models/category'; // تأكد من وجود موديل category.ts
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  // ***** التعديل هنا: إضافة '/api/' *****
  private baseUrl = `${environment.apiUrl}/api/category`;

  constructor(private http: HttpClient) { }

  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/get/all`);
  }

  getCategoryById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/get/${id}`);
  }

  createCategory(categoryData: CategoryCreatePayload): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/create`, categoryData);
  }

  updateCategory(categoryData: Category): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/update`, categoryData);
  }

  deleteCategory(id: number): Observable<void> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.delete<void>(`${this.baseUrl}/delete`, { params: params });
  }
}
