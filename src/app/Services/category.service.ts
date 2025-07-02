import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, CategoryCreatePayload } from '../models/category'; // استيراد CategoryCreatePayload
import { environment } from '../environments/environment';

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
   * @returns An Observable array of Category objects.
   */
  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/get/all`);
  }

  /**
   * @method getCategoryById
   * @description Fetches a single category by its ID from the API.
   * @param id The ID of the category to fetch.
   * @returns An Observable of a Category object.
   */
  getCategoryById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/get/${id}`);
  }

  /**
   * @method createCategory
   * @description Sends a request to create a new category.
   * @param categoryData The data for the new category.
   * @returns An Observable of the created Category object.
   */
  createCategory(categoryData: CategoryCreatePayload): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/create`, categoryData);
  }

  /**
   * @method updateCategory
   * @description Sends a request to update an existing category.
   * @param categoryData The updated data for the category.
   * @returns An Observable of the API response (e.g., success message or updated object).
   */
  updateCategory(categoryData: Category): Observable<any> {
    // Assuming the API expects the full Category object in the body for PUT
    return this.http.put<any>(`${this.baseUrl}/update`, categoryData);
  }

  /**
   * @method deleteCategory
   * @description Sends a request to delete a category by its ID.
   * @param id The ID of the category to delete.
   * @returns An Observable of void.
   */
  deleteCategory(id: number): Observable<void> {
    // Assuming the API expects the ID as a path parameter for DELETE
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }
}
