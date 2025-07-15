// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../environments/environment';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  imageUrl: string | null;
  role: string | number;
  gender?: number;
}

export interface LoginResponse {
  token: string;
}

export interface PasswordResetRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authApiUrl = `${environment.apiUrl}/auth`;
  private userApiUrl = `${environment.apiUrl}/user`;
  private authTokenKey = 'authToken';

  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this._isAuthenticated.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.checkInitialAuthState();
  }

  public register(userData: any): Observable<any> {
    return this.http.post(`${this.authApiUrl}/register`, userData);
  }

  public login(credentials: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authApiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem(this.authTokenKey, response.token);
          this._isAuthenticated.next(true);
        }
      })
    );
  }

  public forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.authApiUrl}/forgot-password?email=${encodeURIComponent(email)}`, null);
  }

  public resetPassword(request: PasswordResetRequest): Observable<any> {
    return this.http.post(`${this.authApiUrl}/reset-password`, request);
  }

  public changePassword(request: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${this.authApiUrl}/change-password`, request);
  }

  public logout(): void {
    localStorage.removeItem(this.authTokenKey);
    this._isAuthenticated.next(false);
    this.router.navigate(['/Login']);
  }

  public getUserProfileFromApi(): Observable<UserProfile> {
    const userId = this.getUserId();
    if (!userId) {
      const errorMsg = "[AuthService] Cannot fetch profile, User ID not found in token.";
      console.error(errorMsg);
      this.logout();
      return throwError(() => new Error(errorMsg));
    }
    const profileUrl = `${this.userApiUrl}/profile/${userId}`;
    return this.http.get<UserProfile>(profileUrl);
  }

  private checkInitialAuthState(): void {
    const token = this.getToken();
    this._isAuthenticated.next(!!token && !this.isTokenExpired(token));
  }

  public isLoggedIn(): boolean {
    return this._isAuthenticated.value;
  }

  public getToken(): string | null {
    return localStorage.getItem(this.authTokenKey);
  }

  private getDecodedToken(): any | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error("Error decoding token:", error);
      // If token is invalid, clear it and logout
      this.logout();
      return null;
    }
  }

  public getUserId(): string | null {
    const decoded = this.getDecodedToken();
    return decoded ? (decoded.sub || decoded.nameid || decoded.id || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']) : null;
  }

  // === هذا الكود صحيح ويتعامل مع القيم الرقمية 0, 1, 2 بشكل سليم ===
  public getUserRole(): string | null {
    const decoded = this.getDecodedToken();
    if (!decoded) return null;

    let roleValue = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role;

    if (roleValue === undefined || roleValue === null) {
      return null;
    }

    if (Array.isArray(roleValue)) {
      roleValue = roleValue[0]; // خذ العنصر الأول إذا كان مصفوفة
    }

    const numericRole = Number(roleValue);

    if (!isNaN(numericRole)) {
      // التعامل مع الأدوار الرقمية بناءً على الـ Enum في الـ Backend
      switch (numericRole) {
        case 0: // Student في الـ Backend Enum هو 0
          return 'student';
        case 1: // Doctor في الـ Backend Enum هو 1
          return 'doctor';
        case 2: // Admin في الـ Backend Enum هو 2
          return 'admin';
        default:
          return null; // لأي رقم دور غير معروف
      }
    } else {
      // التعامل مع الأدوار النصية (كـ Fallback إذا كان الـ Backend يرسل نصًا)
      const lowerCaseRole = (roleValue?.toString() || '').toLowerCase();

      if (lowerCaseRole === 'student') {
        return 'student';
      } else if (lowerCaseRole === 'doctor') {
        return 'doctor';
      } else if (lowerCaseRole === 'admin') {
        return 'admin';
      }
      return null; // إذا لم يطابق أي من الأدوار الثلاثة المعروفة، أعد null
    }
  }
  // === نهاية الكود الصحيح ===

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: { exp?: number } = jwtDecode(token);
      if (typeof decoded.exp !== 'number') {
        console.warn("Token does not contain a numeric 'exp' claim, or 'exp' is missing. Treating as expired.");
        return true;
      }
      return decoded.exp < (Date.now() / 1000);
    } catch (error) {
      console.error("Error checking token expiration:", error);
      return true;
    }
  }

  public getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (token) {
      return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    } else {
      return new HttpHeaders();
    }
  }

  // تعديل في دالة redirectToDashboard() لاستخدام getUserRole()
  private redirectToDashboard(): void {
    const role = this.getUserRole();
    switch (role) {
      case 'admin':
        this.router.navigate(['/Home']);
        break;
      case 'doctor':
        this.router.navigate(['/Home']);
        break;
      case 'student':
        this.router.navigate(['/Home']);
        break;
      default:
        this.router.navigate(['/Home']);
        break;
    }
  }
}
