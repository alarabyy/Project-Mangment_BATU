// src/app/Services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

export interface UserRegistration {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: number;
  role: number;
  email: string;
  password: string;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // *** التعديل الرئيسي هنا: استخدام عنوان الـ API المنشور ***
  private baseUrl = 'https://batuprojects.runasp.net/api/Auth';

  constructor(private http: HttpClient, private router: Router) { }

  register(userData: UserRegistration): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, userData);
  }

  login(credentials: UserCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem('authToken', response.token);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.router.navigate(['/Login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decodedToken: any = jwtDecode(token);
      const roleClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
      return decodedToken[roleClaim] || decodedToken.role || null;
    } catch (error) {
      console.error("Could not decode token", error);
      return null;
    }
  }
}
