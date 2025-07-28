// src/app/Services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { AuthService, UserProfile } from './auth.service';

import { User } from '../models/user'; // Ensure this path is correct if User is used elsewhere

export interface Dean { // This interface is used in all-chats for user search results
  id: number;
  name: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = `${environment.apiUrl}/api/user`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getUsers(): Observable<User[]> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<User[]>(`${this.baseUrl}/list`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  updateUser(formData: FormData): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    const headersForMultipart = new HttpHeaders({
      'Authorization': headers.get('Authorization') || ''
    });

    return this.http.put(`${this.baseUrl}/update`, formData, { headers: headersForMultipart }).pipe(
      catchError(this.handleError)
    );
  }

  deleteUser(id: number): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    return this.http.delete(`${this.baseUrl}/delete?id=${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  getUserProfile(id: number): Observable<UserProfile> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<UserProfile>(`${this.baseUrl}/profile/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  searchUsers(searchTerm: string): Observable<Dean[]> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<Dean[]>(`${this.baseUrl}/search/${encodeURIComponent(searchTerm)}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error(`[UserService] Backend returned code ${error.status}, body was: `, error.error);
    let errorMessage = 'An unknown error occurred while interacting with user service!';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `A client-side network error occurred: ${error.error.message}`;
    } else {
      if (typeof error.error === 'string') {
        errorMessage = `Error: ${error.error}`;
      } else if (error.error && error.error.message) {
        errorMessage = `Error: ${error.error.message}`;
      } else {
        errorMessage = `Server returned code ${error.status}: ${error.statusText || 'Unknown Error'}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}
