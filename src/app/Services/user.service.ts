// src/app/Services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { AuthService, UserProfile } from './auth.service';

import { User } from '../models/user'; // User model

export interface Dean {
  id: number;
  name: string;
  email?: string; // أضفتها هنا بناءً على الـ API response لـ /user/list
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = `${environment.apiUrl}/api/user`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  // استخدام GET /api/user/list
  getUsers(): Observable<User[]> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<User[]>(`${this.baseUrl}/list`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  updateUser(user: Partial<User>): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    const body = {
      id: user.id,
      firstName: user.firstName,
      middleName: user.middleName !== undefined ? user.middleName : null,
      lastName: user.lastname,
      email: user.email,
      gender: user.gender !== undefined ? user.gender : null
    };
    return this.http.put(`${this.baseUrl}/update`, body, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  deleteUser(id: number): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    return this.http.delete(`${this.baseUrl}/delete?id=${id}`, { headers }).pipe( // افترض أن الـ API يتوقع id في query string
      catchError(this.handleError)
    );
  }

  getUserProfile(id: number): Observable<UserProfile> { // هذه الدالة يمكن أن تستخدمها الـ AuthService أيضاً
    const headers = this.authService.getAuthHeaders();
    return this.http.get<UserProfile>(`${this.baseUrl}/profile/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // استخدام GET /api/user/search/{name}
  searchUsers(searchTerm: string): Observable<Dean[]> {
    const headers = this.authService.getAuthHeaders();
    // بناءً على وثائق API: /api/user/search/{name}
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
      } else if (error.error && (error.error.message || error.error.errors)) {
        if (error.error.errors) {
          const validationErrors = Object.values(error.error.errors).flat();
          errorMessage = `Validation Error: ${validationErrors.join(', ')}`;
        } else {
          errorMessage = `Error: ${error.error.message}`;
        }
      } else {
        errorMessage = `Server returned code ${error.status}: ${error.statusText}`;
      }
    }
    alert(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
