import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Department, DepartmentCreatePayload, DepartmentApiResponse } from '../models/department';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private apiUrl = `${environment.apiUrl}/department`;

  constructor(private http: HttpClient) { }

  /**
   * Transforms a DepartmentApiResponse (with nested faculty/head objects)
   * into a flattened Department object (with facultyId/headId).
   * @param apiResponse The response object from the API.
   * @returns A flattened Department object.
   */
  private mapDepartmentApiResponse(apiResponse: DepartmentApiResponse): Department {
     if (!apiResponse) {
         console.error('mapDepartmentApiResponse received null or undefined apiResponse');
         // Depending on requirements, you might want to throw an error here
         // throw new Error('Invalid API response received');
         // Returning null or an empty object indicates an issue with the response structure
         return null as any; // Or return a default/empty Department object
     }

    return {
      id: apiResponse.id,
      name: apiResponse.name,
      description: apiResponse.description,
      // Use optional chaining (?.) to safely access id, returns undefined if faculty/head is null/undefined
      facultyId: apiResponse.faculty?.id,
      headId: apiResponse.head?.id
    };
  }

  /**
   * Fetches all departments from the API.
   * @returns An Observable of an array of Department objects.
   */
  getAllDepartments(): Observable<Department[]> {
    // Fetch data as DepartmentApiResponse[], then map each item to Department
    return this.http.get<DepartmentApiResponse[]>(`${this.apiUrl}/get/all`).pipe(
      map(responses => responses.map(this.mapDepartmentApiResponse)),
      catchError(this.handleError) // Add basic error handling to service methods
    );
  }

  /**
   * Fetches a department by its ID.
   * @param id The ID of the department to fetch.
   * @returns An Observable of a single Department object.
   */
  getDepartmentById(id: number): Observable<Department> {
     // Fetch data as DepartmentApiResponse, then map it to Department
    return this.http.get<DepartmentApiResponse>(`${this.apiUrl}/get/${id}`).pipe(
      map(this.mapDepartmentApiResponse),
       catchError(this.handleError)
    );
  }

  /**
   * Sends a request to create a new department.
   * Does NOT map the success response body, making the component more flexible.
   * @param departmentData The data for the new department.
   * @returns An Observable of the raw response body from the backend.
   */
  createDepartment(departmentData: DepartmentCreatePayload): Observable<any> {
    // Send DepartmentCreatePayload. Expect backend to return a 2xx status on success.
    // We remove the map here to make the component more resilient to the exact success response body structure
    // returned by the *create* endpoint. The component's subscribe block checks for a non-null response.
    return this.http.post<any>(`${this.apiUrl}/create`, departmentData).pipe(
       catchError(this.handleError) // Add basic error handling
    );
  }

  /**
   * Sends a request to update an existing department.
   * @param departmentData The updated data for the department.
   * @returns An Observable of the response from the backend.
   */
  updateDepartment(departmentData: Department): Observable<any> {
    // Send Department (already flat IDs) to the backend for update.
    return this.http.put(`${this.apiUrl}/update`, departmentData).pipe(
       catchError(this.handleError)
    );
  }

  /**
   * Sends a request to delete a department by its ID.
   * @param id The ID of the department to delete.
   * @returns An Observable of the response from the backend.
   */
  deleteDepartment(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.delete(`${this.apiUrl}/delete`, { params }).pipe(
       catchError(this.handleError)
    );
  }

   /**
    * Basic service-level error handling. Logs the error and re-throws it.
    * @param error The HttpErrorResponse received from the API.
    * @returns An observable that throws the error.
    */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Service level error:', error);
    // Re-throw the error so the component's catchError can handle it for UI display
    return throwError(() => error);
  }
}
