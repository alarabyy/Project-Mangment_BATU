// src/app/services/project.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Project } from '../models/project';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  // ***** التعديل هنا: إضافة '/api/' إلى المسار الأساسي *****
  // بناءً على رسائل الخطأ وكود AuthService، يبدو أن الـ Backend يتوقع مسارًا يبدأ بـ /api/
  private apiUrl = `${environment.apiUrl}/api/project`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getProjects(): Observable<Project[]> {
    // الآن سيبني هذا الـ URL: https://batuprojects.runasp.net/api/project/get/all
    return this.http.get<Project[]>(`${this.apiUrl}/get/all`);
  }

  getMyProjects(): Observable<Project[]> {
    const headers = this.getAuthHeaders();
    if (!headers.has('Authorization')) {
      return throwError(() => new Error('User not authenticated'));
    }
    const url = `${this.apiUrl}/get/myprojects`;
    return this.http.get<Project[]>(url, { headers });
  }

  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/get/${id}`);
  }

  createProject(projectData: any): Observable<string> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/create`, projectData, {
      headers: headers,
      responseType: 'text'
    });
  }

  updateProject(projectData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/update`, projectData, { headers: headers });
  }

  deleteProject(id: number): Observable<any> {
    // لاحظ: إذا كان الـ Backend يتوقع الـ ID في الـ URL (مثل /delete/id) بدلاً من Query Parameter،
    // فستحتاج إلى تغيير هذا أيضاً: return this.http.delete(`${this.apiUrl}/delete/${id}`, { headers: headers });
    const params = new HttpParams().set('id', id.toString());
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/delete`, { headers: headers, params });
  }

  uploadImages(projectId: number, files: File[]): Observable<any> {
    const formData = new FormData();
    formData.append('Id', projectId.toString());
    files.forEach(file => {
      formData.append('Files', file, file.name);
    });
    const headers = this.getAuthHeaders().delete('Content-Type'); // حذف Content-Type مهم لـ FormData
    return this.http.post(`${this.apiUrl}/images/upload`, formData, { headers: headers });
  }

  deleteImage(projectId: number, fileNames: string[]): Observable<any> {
    const payload = { id: projectId, files: fileNames };
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/images/delete`, payload, { headers: headers });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      return new HttpHeaders();
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
