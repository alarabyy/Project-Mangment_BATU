// File: src/app/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, of } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastname: string | null;
  imageUrl: string;
  role: number;
}

export interface LoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authApiUrl = 'https://batuprojects.runasp.net/api/auth';
  private userApiUrl = 'https://batuprojects.runasp.net/api/user';
  private authTokenKey = 'authToken';

  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this._isAuthenticated.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkInitialAuthState();
  }

  private checkInitialAuthState(): void {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      this._isAuthenticated.next(true);
    } else {
      this._isAuthenticated.next(false);
    }
  }

  // --- API Methods ---
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

  public getUserProfileFromApi(): Observable<UserProfile> {
    // ================= 🔽 تم تعديل هذه الدالة لتكون أكثر مرونة 🔽 =================
    const userId = this.getUserIdFromToken();

    if (!userId) {
      const errorMessage = "[AuthService] Cannot fetch profile, User ID claim not found in token.";
      console.error(errorMessage);
      return new Observable(observer => observer.error(errorMessage));
    }

    const profileUrl = `${this.userApiUrl}/profile/${userId}`;
    console.log(`[AuthService] Fetching profile from: ${profileUrl}`);

    return this.http.get<UserProfile>(profileUrl, { headers: this.getAuthHeaders() });
  }
  // ====================================================================

  public logout(): void {
    localStorage.removeItem(this.authTokenKey);
    this._isAuthenticated.next(false);
    this.router.navigate(['/login']);
  }

  // --- Helper Methods ---
  public isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
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
      return null;
    }
  }

  // ================= 🔽 دالة جديدة تبحث عن كل الأسماء المحتملة 🔽 =================
  private getUserIdFromToken(): string | null {
    const decodedToken = this.getDecodedToken();
    if (!decodedToken) return null;

    // ابحث عن الـ ID بأشهر الأسماء المحتملة بالترتيب
    const userId =
      decodedToken.id || // الاسم المباشر
      decodedToken.sub || // الاسم القياسي في JWT
      decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || // الاسم القياسي في .NET
      decodedToken.nameid; // اسم آخر شائع

    return userId || null;
  }
  // ======================================================================

  public getUserRole(): string | null {
    const decodedToken = this.getDecodedToken();
    if (!decodedToken) return null;

    const role = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decodedToken['role'];
    return role ? role.toLowerCase() : null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: { exp: number } = jwtDecode(token);
      return decoded.exp < (Date.now() / 1000);
    } catch (err) {
      return true;
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (token) {
      return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }
    return new HttpHeaders();
  }
}
