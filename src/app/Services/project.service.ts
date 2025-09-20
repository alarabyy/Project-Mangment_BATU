// src/app/Services/project.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Project, ProjectHistory } from '../models/project';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/api/project`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getProjects(): Observable<Project[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Project[]>(`${this.apiUrl}/get/all`, { headers });
  }

  getMyProjects(): Observable<Project[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Project[]>(`${this.apiUrl}/get/myprojects`, { headers });
  }

  getProjectById(id: number): Observable<Project> {
    const headers = this.getAuthHeaders();
    return this.http.get<Project>(`${this.apiUrl}/get/${id}`, { headers });
  }

  getProjectHistory(id: number): Observable<ProjectHistory[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<ProjectHistory[]>(`${this.apiUrl}/get/${id}/history`, { headers });
  }

  createProject(projectData: any): Observable<string> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/create`, projectData, { headers, responseType: 'text' });
  }

  updateProject(projectData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/update`, projectData, { headers });
  }

  deleteProject(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/delete`, { headers, params });
  }

  uploadImages(projectId: number, files: File[]): Observable<any> {
    const formData = new FormData();
    formData.append('Id', projectId.toString());
    files.forEach(file => formData.append('Files', file, file.name));
    const headers = this.getAuthHeaders().delete('Content-Type');
    return this.http.post(`${this.apiUrl}/images/upload`, formData, { headers });
  }

  deleteImage(projectId: number, fileNames: string[]): Observable<any> {
    const payload = { id: projectId, files: fileNames };
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/images/delete`, payload, { headers });
  }

  // ✅ NEW: Function to upload project documents
  uploadDocuments(projectId: number, files: File[]): Observable<any> {
    const formData = new FormData();
    formData.append('id', projectId.toString());
    files.forEach(file => formData.append('files', file, file.name));
    const headers = this.getAuthHeaders().delete('Content-Type');
    return this.http.post(`${this.apiUrl}/documents/upload`, formData, { headers });
  }

  // ✅ NEW: Function to delete a project document
  deleteDocument(projectId: number, fileNames: string[]): Observable<any> {
    const payload = { id: projectId, files: fileNames };
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/documents/delete`, payload, { headers });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) return new HttpHeaders();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
