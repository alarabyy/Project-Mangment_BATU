import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Department, DepartmentCreatePayload } from '../models/department';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Fetches all departments from the API.
   */
  getAllDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.apiUrl}/department/get/all`);
  }

  /**
   * Creates a new department.
   */
  createDepartment(departmentData: DepartmentCreatePayload): Observable<Department> {
    const createUrl = `${this.apiUrl}/department/create`;
    return this.http.post<Department>(createUrl, departmentData);
  }

  /**
   * Updates an existing department.
   */
  updateDepartment(departmentData: Department): Observable<any> {
    const updateUrl = `${this.apiUrl}/department/update`;
    return this.http.put(updateUrl, departmentData);
  }

  /**
   * Deletes a department by its ID.
   */
  deleteDepartment(id: number): Observable<any> {
    const deleteUrl = `${this.apiUrl}/department/delete`;
    const params = new HttpParams().set('id', id.toString());
    return this.http.delete(deleteUrl, { params });
  }
}
