import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Department, DepartmentCreatePayload } from '../models/department';
import { environment } from '../environments/environment'; // Ensure this path is correct

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private apiUrl = environment.apiUrl; // Ensure environment.apiUrl is correctly configured

  constructor(private http: HttpClient) { }

  /**
   * @public
   * @method getAllDepartments
   * Fetches all departments from the API.
   * @returns An Observable of an array of Department objects.
   */
  getAllDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.apiUrl}/department/get/all`);
  }

  /**
   * @public
   * @method getDepartmentById
   * Fetches a single department by its ID from the API.
   * @param id - The ID of the department to fetch.
   * @returns An Observable of a Department object.
   */
  getDepartmentById(id: number): Observable<Department> {
    return this.http.get<Department>(`${this.apiUrl}/department/get/${id}`);
  }

  /**
   * @public
   * @method createDepartment
   * Sends a request to create a new department.
   * @param departmentData - The data for the new department.
   * @returns An Observable of the created Department object.
   */
  createDepartment(departmentData: DepartmentCreatePayload): Observable<Department> {
    const createUrl = `${this.apiUrl}/department/create`;
    return this.http.post<Department>(createUrl, departmentData);
  }

  /**
   * @public
   * @method updateDepartment
   * Sends a request to update an existing department.
   * @param departmentData - The updated data for the department.
   * @returns An Observable of the API response (e.g., success message).
   */
  updateDepartment(departmentData: Department): Observable<any> {
    const updateUrl = `${this.apiUrl}/department/update`;
    // Ensure the ID is passed correctly as part of the request body for PUT operations,
    // or as a path parameter if the API expects it that way.
    // Assuming the API expects the full Department object in the body for update.
    return this.http.put(updateUrl, departmentData);
  }

  /**
   * @public
   * @method deleteDepartment
   * Sends a request to delete a department by its ID.
   * @param id - The ID of the department to delete.
   * @returns An Observable of the API response.
   */
  deleteDepartment(id: number): Observable<any> {
    const deleteUrl = `${this.apiUrl}/department/delete`;
    const params = new HttpParams().set('id', id.toString());
    return this.http.delete(deleteUrl, { params });
  }
}
