import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Department, DepartmentCreatePayload } from '../models/department'; // تأكد من وجود موديل department.ts
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private apiUrl = `${environment.apiUrl}/department`;

  constructor(private http: HttpClient) { }

  getAllDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.apiUrl}/get/all`);
  }

  getDepartmentById(id: number): Observable<Department> {
    return this.http.get<Department>(`${this.apiUrl}/get/${id}`);
  }

  createDepartment(departmentData: DepartmentCreatePayload): Observable<Department> {
    return this.http.post<Department>(`${this.apiUrl}/create`, departmentData);
  }

  updateDepartment(departmentData: Department): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, departmentData);
  }

  deleteDepartment(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.delete(`${this.apiUrl}/delete`, { params });
  }
}
