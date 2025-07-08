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

  createProject(projectData: any): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/create`, projectData);
  }

  updateProject(projectData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, projectData);
  }

  deleteProject(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.delete(`${this.apiUrl}/delete`, { params });
  }

  // Frontend sends 'Files' with an 's' as per backend ProjectFilesUploadRequest
  uploadImage(projectId: number, file: File): Observable<any> {
    const formData = new FormData();
    // Backend expects 'Id', not 'projectId' in the form data for this request
    formData.append('Id', projectId.toString());
    formData.append('Files', file, file.name); // 'Files' with an 's'
    return this.http.post(`${this.apiUrl}/images/upload`, formData);
  }

  // Frontend sends 'Files' with an 's' as per backend ProjectFilesDeleteRequest
  deleteImage(projectId: number, fileNames: string[]): Observable<any> {
    // Backend expects a POST request with this structure
    const payload = { id: projectId, files: fileNames };
    return this.http.post(`${this.apiUrl}/images/delete`, payload);
  }
}
