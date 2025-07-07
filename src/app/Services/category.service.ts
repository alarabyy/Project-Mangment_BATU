import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Category, CategoryCreatePayload } from '../models/category';

/**
 * @service CategoryService
 * @description Centralized service for all category-related API operations.
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private baseUrl = `${environment.apiUrl}/category`;

  constructor(private http: HttpClient) { }

  /**
   * @method getAllCategories
   * @description Fetches all categories from the API.
   */
  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/get/all`);
  }

  /**
   * @method getCategoryById
   * @description Fetches a single category by its ID.
   */
  getCategoryById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/get/${id}`);
  }

  /**
   * @method createCategory
   * @description Creates a new category.
   */
  createCategory(categoryData: CategoryCreatePayload): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/create`, categoryData);
  }

  /**
   * @method updateCategory
   * @description Updates an existing category.
   */
  updateCategory(categoryData: Category): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/update`, categoryData);
  }

  /**
   * @method deleteCategory
   * @description Deletes a category by its ID using a query parameter.
   * @param id The ID of the category to delete.
   * @returns An Observable of void.
   */
  deleteCategory(id: number): Observable<void> {
    // --- التعديل هنا ---
    // 1. إنشاء HttpParams لوضع الـ ID كـ query parameter
    const params = new HttpParams().set('id', id.toString());

    // 2. إرسال الطلب مع الرابط الصحيح والـ params
    // الرابط الناتج سيكون: .../api/category/delete?id=1
    return this.http.delete<void>(`${this.baseUrl}/delete`, { params: params });
  }
}

