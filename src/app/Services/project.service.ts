import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Project } from '../models/project'; // Import the full Project interface
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/project`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Retrieves all projects.
   * IMPORTANT: Based on the JSON you provided, this endpoint (/get/all) currently
   * returns a 'minimal' set of project data (id, title, description, technologies, toolsUsed, problemStatement).
   * It does NOT include grade, category, department, images, etc.
   * The ProjectListComponent's HTML will be adapted to only display the available minimal data.
   */
  getProjects(): Observable<Project[]> { // Type is Project[] because ProjectMinimal is a subset of Project
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
    const headers = this.getAuthHeaders().delete('Content-Type');
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
