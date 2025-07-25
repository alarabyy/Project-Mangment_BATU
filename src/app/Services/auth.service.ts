import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, throwError, catchError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../environments/environment';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastname: string | null;
  middleName?: string;
  imageUrl: string | null;
  role: string | number;
  gender?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
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

  constructor(private http: HttpClient, private router: Router) {
    this.checkInitialAuthState();
  }

  public register(userData: any): Observable<any> {
    return this.http.post(`${this.authApiUrl}/register`, userData).pipe(
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
          this.redirectToDashboard();
        }
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  public forgotPassword(email: string): Observable<any> {
    console.log(`[AuthService] Sending forgot password request for email: ${email}`);
    return this.http.post(`${this.authApiUrl}/forgot-password?email=${encodeURIComponent(email)}`, null).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  public resetPassword(request: PasswordResetRequest): Observable<any> {
    console.log('[AuthService] Sending reset password request with token and new password.');
    return this.http.post(`${this.authApiUrl}/reset-password`, request).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  public changePassword(request: ChangePasswordRequest): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.authApiUrl}/change-password`, request, { headers }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  public logout(): void {
    localStorage.removeItem(this.authTokenKey);
    this._isAuthenticated.next(false);
    console.log('[AuthService] User logged out. isAuthenticated = false.');
    this.router.navigate(['/Login']);
  }

  public getUserProfileFromApi(): Observable<UserProfile> {
    const userId = this.getUserId();
    if (!userId) {
      const errorMsg = "[AuthService] Cannot fetch profile, User ID not found in token. Logging out.";
      console.error(errorMsg);
      this.logout();
      return throwError(() => new Error(errorMsg));
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
      const decoded = jwtDecode(token);
      return decoded;
    } catch (error) {
      console.error("[AuthService] Error decoding token:", error, "Logging out.");
      this.logout();
      return null;
    }
  }

  public getUserId(): string | null {
    const decoded = this.getDecodedToken();
    const userId = decoded ? (decoded.nameid || decoded.sub || decoded.id || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']) : null;
    return userId;
  }

  public getUserRole(): string | null {
    const decoded = this.getDecodedToken();
    if (!decoded) {
      return null;
    }

    const potentialRoleClaims = [
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
        'role',
        'Role',
        'roles',
    ];

    let roleValue: any = null;

    for (const claim of potentialRoleClaims) {
        if (decoded[claim] !== undefined && decoded[claim] !== null) {
            roleValue = decoded[claim];
            break;
        }
    }

    if (roleValue === undefined || roleValue === null) {
      return null;
    }

    if (Array.isArray(roleValue)) {
      roleValue = roleValue.length > 0 ? roleValue[0] : null;
    }

    if (roleValue === null) {
        return null;
    }

    const lowerCaseRole = (roleValue?.toString() || '').toLowerCase();

    if (!isNaN(Number(lowerCaseRole))) {
      const numericRole = Number(lowerCaseRole);
      switch (numericRole) {
        case 0: return 'student';
        case 1: return 'doctor';
        case 2: return 'admin';
        default:
          console.warn(`[AuthService] Unknown numeric role: ${numericRole}`);
          return null;
      }
    } else {
      if (lowerCaseRole === 'student') {
        return 'student';
      } else if (lowerCaseRole === 'doctor') {
        return 'doctor';
      } else if (lowerCaseRole === 'admin') {
        return 'admin';
      }
      console.warn(`[AuthService] Unknown string role: '${lowerCaseRole}'`);
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: { exp?: number } = jwtDecode(token);
      if (typeof decoded.exp !== 'number') {
        console.warn("[AuthService] Token does not contain a numeric 'exp' claim, or 'exp' is missing. Treating as expired.");
        return true;
      }
      const expirationTime = decoded.exp * 1000;
      const currentTime = Date.now();
      const expired = expirationTime < currentTime;
      if (expired) {
          console.warn(`[AuthService] Token expired. Expiration: ${new Date(expirationTime).toLocaleString()}, Current: ${new Date(currentTime).toLocaleString()}`);
      }
      return expired;
    } catch (error) {
      console.error("[AuthService] Error checking token expiration:", error, "Treating as expired.");
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
    const role = this.getUserRole();
    switch (role) {
      case 'admin':
      case 'doctor':
      case 'student':
        this.router.navigate(['/Home']);
        break;
      default:
        this.router.navigate(['/Home']);
        break;
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error(`[AuthService] Backend returned code ${error.status}, body was: `, error.error);
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `A client-side error occurred: ${error.error.message}`;
    } else {
      if (typeof error.error === 'string') {
        errorMessage = `Error: ${error.error}`;
      } else if (error.error && error.error.message) {
        errorMessage = `Error: ${error.error.message}`;
      } else {
        errorMessage = `Server returned code ${error.status}: ${error.statusText}`;
      }
    }
    alert(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
