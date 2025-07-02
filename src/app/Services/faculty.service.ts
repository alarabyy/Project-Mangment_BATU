import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Faculty, FacultyCreatePayload } from '../models/faculty'; // استيراد FacultyCreatePayload
import { environment } from '../environments/environment';

/**
 * @service FacultyService
 * @description Centralized service for all faculty-related API operations.
 */
@Injectable({
  providedIn: 'root'
})
export class FacultyService {
  private baseUrl = `${environment.apiUrl}/faculty`;

  constructor(private http: HttpClient) { }

  /**
   * @method getFaculties
   * @description Fetches all faculties from the API.
   * @returns An Observable array of Faculty objects.
   */
  getFaculties(): Observable<Faculty[]> {
    return this.http.get<Faculty[]>(`${this.baseUrl}/get/all`);
  }

  /**
   * @method getFacultyById
   * @description Fetches a single faculty by its ID from the API.
   * @param id The ID of the faculty to fetch.
   * @returns An Observable of a Faculty object.
   */
  getFacultyById(id: number): Observable<Faculty> {
    return this.http.get<Faculty>(`${this.baseUrl}/get/${id}`);
  }

  /**
   * @method createFaculty
   * @description Sends a request to create a new faculty.
   * @param facultyData The data for the new faculty.
   * @returns An Observable of the created Faculty object.
   */
  createFaculty(facultyData: FacultyCreatePayload): Observable<Faculty> {
    return this.http.post<Faculty>(`${this.baseUrl}/create`, facultyData);
  }

  /**
   * @method updateFaculty
   * @description Sends a request to update an existing faculty.
   * @param facultyData The updated data for the faculty.
   * @returns An Observable of the API response (e.g., success message or updated object).
   */
  updateFaculty(facultyData: Faculty): Observable<any> {
    // Assuming the API expects the full Faculty object in the body for PUT
    return this.http.put<any>(`${this.baseUrl}/update`, facultyData);
  }

  /**
   * @method deleteFaculty
   * @description Sends a request to delete a faculty by its ID.
   * @param id The ID of the faculty to delete.
   * @returns An Observable of void.
   */
  deleteFaculty(id: number): Observable<void> {
    // Assuming the API expects the ID as a path parameter for DELETE
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }
}
