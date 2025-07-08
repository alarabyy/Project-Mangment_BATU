import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project } from '../models/project';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/project`;

  constructor(private http: HttpClient) {}

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/get/all`);
  }

  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/get/${id}`);
  }

  // FIX: Changed the expected response type to 'text' to work with the current backend.
  createProject(projectData: any): Observable<string> {
    return this.http.post(`${this.apiUrl}/create`, projectData, { responseType: 'text' });
  }

  updateProject(projectData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, projectData);
  }

  deleteProject(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.delete(`${this.apiUrl}/delete`, { params });
  }

  uploadImages(projectId: number, files: File[]): Observable<any> {
    const formData = new FormData();
    formData.append('Id', projectId.toString());
    files.forEach(file => {
      formData.append('Files', file, file.name);
    });
    return this.http.post(`${this.apiUrl}/images/upload`, formData);
  }

  deleteImage(projectId: number, fileNames: string[]): Observable<any> {
    const payload = { id: projectId, files: fileNames };
    return this.http.post(`${this.apiUrl}/images/delete`, payload);
  }
}
