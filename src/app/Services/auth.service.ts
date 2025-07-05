// src/app/Services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

// الواجهة التي يتوقعها الـ API عند إنشاء حساب
export interface UserRegistration {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: number;
  role: number;
  email: string;
  password: string;
}

// الواجهة التي يتوقعها الـ API عند تسجيل الدخول
export interface UserCredentials {
  email: string;
  password: string;
}

// الواجهة التي يرجعها الـ API عند تسجيل الدخول
export interface LoginResponse {
  token: string;
}

// الواجهة التي يرجعها الـ API لصفحة البروفايل
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: number; // الدور يأتي كرقم من API البروفايل
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authUrl = 'https://batuprojects.runasp.net/api/Auth';
  private userUrl = 'https://batuprojects.runasp.net/api/User';

  constructor(private http: HttpClient, private router: Router) { }

  register(userData: UserRegistration): Observable<any> {
    return this.http.post(`${this.authUrl}/register`, userData);
  }

  login(credentials: UserCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, credentials)
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
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private getDecodedToken(): any {
    const token = this.getToken();
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch (error) { return null; }
  }

  // يقرأ الدور كنص من التوكن (لصالح الـ Guard والـ Navbar)
  getRole(): string | null {
    const decodedToken = this.getDecodedToken();
    if (!decodedToken) return null;

    let role = decodedToken.role;
    if (Array.isArray(role)) { role = role[0]; }

    if (role && role.toLowerCase() === 'professor') {
      return 'doctor'; // ترجمة 'Professor' إلى 'doctor'
    }

    return role ? role.toLowerCase() : null;
  }

  // يقرأ ID المستخدم من التوكن
  getUserId(): string | null {
    const decodedToken = this.getDecodedToken();
    return decodedToken ? decodedToken.nameid : null;
  }

  // يطلب البروفايل من الـ API
  getUserProfileFromApi(): Observable<UserProfile> {
    const userId = this.getUserId();
    if (!userId) return of({} as UserProfile);

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.getToken()}` });
    return this.http.get<UserProfile>(`${this.userUrl}/profile/${userId}`, { headers });
  }
}
