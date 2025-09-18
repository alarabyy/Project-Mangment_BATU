// src/app/Services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, throwError, catchError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../environments/environment';
import { NotificationService } from './notification-proxy.service';

// --- Interfaces for Type Safety ---

// ✅ --- FIX: This interface is now corrected to match the API response exactly ---
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastname: string | null;
  middleName?: string;
  imageUrl: string;
  gender: number;
  graduationDate: string;
  role: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: number;
  role: number;
  email: string;
  password: string;
  graduationDate?: string;
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
  private authApiUrl = `${environment.apiUrl}/api/auth`;
  private userApiUrl = `${environment.apiUrl}/api/user`;
  private authTokenKey = 'authToken';

  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this._isAuthenticated.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.checkInitialAuthState();
  }

  // ✅ --- FIX: This is the corrected, simplified, and robust getUserRole function ---
  public getUserRole(): string | null {
    const decoded = this.getDecodedToken();
    if (!decoded) {
      return null;
    }

    // This is the most common claim name for roles from a .NET backend.
    // It also has a fallback to a simple 'role' claim.
    const roleClaim = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role;

    if (roleClaim === undefined || roleClaim === null) {
      console.warn('[AuthService] Role claim not found in token.');
      return null;
    }

    // Handle both single role string/number and array of roles
    const roleValue = Array.isArray(roleClaim) ? roleClaim[0] : roleClaim;
    const normalizedRole = roleValue.toString().toLowerCase();

    // This simple switch handles all cases: "Admin", "admin", 2, "2", etc.
    // and returns the consistent lowercase string that RoleGuard expects.
    switch (normalizedRole) {
      case 'admin':
      case '2':
        return 'admin';
      case 'doctor':
      case '1':
        return 'doctor';
      case 'student':
      case '0':
        return 'student';
      default:
        console.warn(`[AuthService] Unknown role detected in token: '${roleValue}'`);
        return null;
    }
  }

  public register(userData: RegisterRequest): Observable<any> {
    return this.http.post(`${this.authApiUrl}/register`, userData).pipe(
      tap(() => {
        this.notificationService.showSuccess('Registration successful! Please log in.');
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  public login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authApiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem(this.authTokenKey, response.token);
          this._isAuthenticated.next(true);
          console.log('[AuthService] Login successful, token stored, isAuthenticated = true.');
          this.notificationService.showSuccess('Login successful! Welcome back.');
          this.redirectToDashboard();
        }
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  public forgotPassword(email: string): Observable<any> {
    console.log(`[AuthService] Sending forgot password request for email: ${email}`);
    return this.http.post(`${this.authApiUrl}/forgot-password?email=${encodeURIComponent(email)}`, null).pipe(
      tap(() => {
        this.notificationService.showInfo('Password reset link sent to your email.');
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  public resetPassword(request: PasswordResetRequest): Observable<any> {
    console.log('[AuthService] Sending reset password request with token and new password.');
    return this.http.post(`${this.authApiUrl}/reset-password`, request).pipe(
      tap(() => {
        this.notificationService.showSuccess('Your password has been reset successfully!');
        this.router.navigate(['/Login']);
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  public changePassword(request: ChangePasswordRequest): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.authApiUrl}/change-password`, request, { headers }).pipe(
      tap(() => {
        this.notificationService.showSuccess('Password changed successfully!');
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  public logout(): void {
    localStorage.removeItem(this.authTokenKey);
    this._isAuthenticated.next(false);
    console.log('[AuthService] User logged out. isAuthenticated = false.');
    this.notificationService.showInfo('You have been logged out.');
    this.router.navigate(['/Login']);
  }

  public getUserProfileFromApi(): Observable<UserProfile> {
    const userId = this.getUserId();
    if (!userId) {
      this.logout();
      return throwError(() => new Error("User ID not found in token. Logging out."));
    }
    const profileUrl = `${this.userApiUrl}/profile/${userId}`;
    const headers = this.getAuthHeaders();
    console.log(`[AuthService] Fetching user profile for ID: ${userId}`);
    return this.http.get<UserProfile>(profileUrl, { headers }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  private checkInitialAuthState(): void {
    const token = this.getToken();
    const isAuthenticated = !!token && !this.isTokenExpired(token);
    this._isAuthenticated.next(isAuthenticated);
    console.log(`[AuthService] Initial auth state checked: isAuthenticated = ${isAuthenticated}`);
  }

  public isLoggedIn(): boolean {
    const token = this.getToken();
    const valid = !!token && !this.isTokenExpired(token);
    if (this._isAuthenticated.value !== valid) {
      this._isAuthenticated.next(valid);
    }
    return valid;
  }

  public getToken(): string | null {
    return localStorage.getItem(this.authTokenKey);
  }

  public getDecodedToken(): any | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error("[AuthService] Error decoding token:", error, "Logging out.");
      this.notificationService.showError('Authentication failed. Please log in again.');
      this.logout();
      return null;
    }
  }

  public getUserId(): string | null {
    const decoded = this.getDecodedToken();
    return decoded ? (decoded.nameid || decoded.sub || decoded.id || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']) : null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: { exp?: number } = jwtDecode(token);
      if (typeof decoded.exp !== 'number') {
        console.warn("[AuthService] Token does not contain a numeric 'exp' claim, treating as expired.");
        return true;
      }
      const isExpired = (decoded.exp * 1000) < Date.now();
      if (isExpired) {
          console.warn(`[AuthService] Token expired.`);
          this.notificationService.showWarning('Your session has expired. Please log in again.');
          this.logout();
      }
      return isExpired;
    } catch (error) {
      console.error("[AuthService] Error checking token expiration:", error, "Treating as expired.");
      this.notificationService.showError('Session validation failed. Please log in.');
      this.logout();
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

  private redirectToDashboard(): void {
    this.router.navigate(['/Home']);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error(`[AuthService] Backend returned code ${error.status}, body was: `, error.error);
    const errorMessage = error.error?.message || error.error || 'An unknown error occurred!';
    return throwError(() => new Error(errorMessage));
  }
}
