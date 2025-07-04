import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Project } from '../models/project';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  // Use the API URL from the environment file for better maintainability
  private apiUrl = `${environment.apiUrl}/project`;

  constructor(private http: HttpClient) { }

  /**
   * Fetches all projects from the API.
   * @returns An Observable array of Projects.
   */
  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/get/all`);
  }

  /**
   * Fetches a single project by its ID.
   * @param id The ID of the project to retrieve.
   * @returns An Observable of a single Project.
   */
  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/get/${id}`);
  }

  /**
   * Creates a new project.
   * @param projectData The project data to be created, without the 'id'.
   * @returns An Observable of the newly created Project (with its new ID).
   */
  createProject(projectData: Omit<Project, 'id'>): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/create`, projectData);
  }

  /**
   * Updates an existing project.
   * @param project The full project object, including its 'id'.
   * @returns An Observable of the server's response.
   */
  updateProject(project: Project): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, project);
  }

  /**
   * Deletes a project by its ID.
   * @param id The ID of the project to delete.
   * @returns An Observable of the server's response.
   */
  deleteProject(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.delete(`${this.apiUrl}/delete`, { params });
  }
}
