// src/app/Services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, throwError, catchError } from 'rxjs';
import {jwtDecode} from 'jwt-decode'; // ⚠️ مهم: الاستيراد الصحيح
import { environment } from '../environments/environment';
import { NotificationService } from './notification-proxy.service';

// --- Interfaces ---
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

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: number;
  roleId: number;
  email: string;
  password: string;
  graduationDate?: string;
}
export interface LoginResponse { token: string; }
export interface PasswordResetRequest { token: string; newPassword: string; }
export interface ChangePasswordRequest { currentPassword: string; newPassword: string; }

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authApiUrl = `${environment.apiUrl}/api/auth`;
  private userApiUrl = `${environment.apiUrl}/api/user`;
  private authTokenKey = 'authToken';

  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this._isAuthenticated.asObservable();

  // Cache decoded token here (we will attach permissions into this object when needed)
  private decodedToken: any | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.checkInitialAuthState();
  }

  // ---------- Permission helpers ----------
  // Returns true if token has the permission
  public hasPermission(permission: string): boolean {
    const decoded = this.getDecodedToken();
    if (!decoded) return false;

    const perms = this.getPermissionsFromDecoded(decoded);
    if (!perms || perms.length === 0) return false;

    if (perms.includes('Permissions.*')) return true;
    return perms.includes(permission);
  }

  // Pulls possible permission arrays/strings from decoded token and normalizes to string[]
  private getPermissionsFromDecoded(decoded: any): string[] {
    if (!decoded) return [];

    const candidates = [
      decoded.permission,
      decoded.permissions,
      decoded.Permissions,
      decoded.Perms,
      decoded.claims?.permissions,
      decoded['permissions'],
      decoded['permission']
    ];

    for (const c of candidates) {
      if (!c) continue;
      if (Array.isArray(c)) return c.map((p: any) => String(p));
      if (typeof c === 'string') {
        // maybe comma separated
        return c.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  }

  // Allow other services/guards to attach permissions to the cached decoded token
  public attachPermissions(permissions: string[]): void {
    if (!this.decodedToken) this.decodedToken = {};
    this.decodedToken.permission = permissions;
    // also persist if you want (optional) — we keep it in-memory only
    // localStorage.setItem('authTokenPermissions', JSON.stringify(permissions));
  }

  // ---------- Role fallback (backwards compatibility) ----------
  public getUserRole(): string | null {
    const decoded = this.getDecodedToken();
    if (!decoded) return null;

    const roleClaim = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || decoded.roles || decoded.Roles;
    if (!roleClaim) return null;

    const roleValue = Array.isArray(roleClaim) ? roleClaim[0] : roleClaim;
    const normalized = String(roleValue).toLowerCase();

    switch (normalized) {
      case 'admin':
      case 'superadmin':
      case '2':
        return 'admin';
      case 'doctor':
      case '1':
        return 'doctor';
      case 'student':
      case '0':
        return 'student';
      default:
        return normalized; // return raw if unknown (useful)
    }
  }

  // ---------- API calls ----------
  public register(userData: RegisterRequest): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.authApiUrl}/register`, userData, { headers }).pipe(
      tap(() => this.notificationService.showSuccess('User registered successfully!')),
      catchError(this.handleError)
    );
  }

  public login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authApiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response?.token) {
          localStorage.setItem(this.authTokenKey, response.token);
          try {
            this.decodedToken = jwtDecode(response.token);
          } catch (err) {
            console.error('Failed to decode token on login', err);
            this.decodedToken = null;
          }
          this._isAuthenticated.next(true);
          this.notificationService.showSuccess('Login successful!');
          this.router.navigate(['/Home']);
        }
      }),
      catchError(this.handleError)
    );
  }

  public logout(): void {
    localStorage.removeItem(this.authTokenKey);
    this.decodedToken = null;
    this._isAuthenticated.next(false);
    this.notificationService.showInfo('You have been logged out.');
    this.router.navigate(['/Login']);
  }

  public getUserProfileFromApi(): Observable<UserProfile> {
    const userId = this.getUserId();
    if (!userId) {
      this.logout();
      return throwError(() => new Error("User ID not found in token."));
    }
    const profileUrl = `${this.userApiUrl}/profile/${userId}`;
    const headers = this.getAuthHeaders();
    return this.http.get<UserProfile>(profileUrl, { headers }).pipe(catchError(this.handleError));
  }

  // ---------- Token management ----------
  private checkInitialAuthState(): void {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      try {
        this.decodedToken = jwtDecode(token);
        this._isAuthenticated.next(true);
      } catch (error) {
        console.error("Failed to decode token", error);
        this.logout();
      }
    } else if (token) {
      this.logout();
    }
  }

  public isLoggedIn(): boolean {
    return this._isAuthenticated.value;
  }

  public getToken(): string | null {
    return localStorage.getItem(this.authTokenKey);
  }

  public getDecodedToken(): any | null {
    if (this.decodedToken) return this.decodedToken;

    const token = this.getToken();
    if (!token) return null;

    try {
      this.decodedToken = jwtDecode(token);
      return this.decodedToken;
    } catch {
      this.logout();
      return null;
    }
  }

  public getUserId(): string | null {
    const token = this.getDecodedToken();
    return token?.nameid || token?.sub || null;
  }

  public getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: { exp?: number } = jwtDecode(token);
      if (typeof decoded.exp !== 'number') {
        return true;
      }
      const isExpired = (decoded.exp * 1000) < Date.now();
      if (isExpired) {
        this.notificationService.showWarning('Your session has expired. Please log in again.');
      }
      return isExpired;
    } catch {
      return true;
    }
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    const errorMessage = error.error?.message || error.message || 'An unexpected error occurred.';
    return throwError(() => new Error(errorMessage));
  }

  public changePassword(request: ChangePasswordRequest): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.authApiUrl}/change-password`, request, { headers });
  }

  public forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.authApiUrl}/forgot-password?email=${encodeURIComponent(email)}`, null);
  }

  public resetPassword(request: PasswordResetRequest): Observable<any> {
    return this.http.post(`${this.authApiUrl}/reset-password`, request);
  }
}
