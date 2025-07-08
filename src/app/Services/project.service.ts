import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project } from '../models/project';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/project`;

  constructor(private http: HttpClient) {}

  getProjects(): Observable<Project[]> { return this.http.get<Project[]>(`${this.apiUrl}/get/all`); }
  getProjectById(id: number): Observable<Project> { return this.http.get<Project>(`${this.apiUrl}/get/${id}`); }
  createProject(projectData: any): Observable<Project> { return this.http.post<Project>(`${this.apiUrl}/create`, projectData); }
  updateProject(projectData: any): Observable<any> { return this.http.put(`${this.apiUrl}/update`, projectData); }
  deleteProject(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/delete/${id}`); }

  uploadImage(projectId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('projectId', projectId.toString());
    formData.append('File', file, file.name);
    return this.http.post(`${this.apiUrl}/images/upload`, formData);
  }

  deleteImage(projectId: number, imageUrls: string[]): Observable<any> {
    const payload = { id: projectId, files: imageUrls };
    return this.http.post(`${this.apiUrl}/images/delete`, payload);
  }
}
