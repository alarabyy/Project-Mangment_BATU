// File: src/app/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, of } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

// الواجهة الآن تطابق تمامًا ما يرسله الـ API
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
  // ================= 🔽 المسار الصحيح هنا 🔽 =================
  private userApiUrl = 'https://batuprojects.runasp.net/api/user';
  // ==========================================================
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

  // --- API Communication Methods ---
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

  // ================= 🔽 تم تعديل هذه الدالة بشكل كامل 🔽 =================
  public getUserProfileFromApi(): Observable<UserProfile> {
    const userId = this.getUserId();
    if (!userId) {
      console.error("[AuthService] getUserProfileFromApi: Cannot fetch profile, User ID not found in token.");
      return new Observable(observer => {
        observer.error('User ID not found in token.');
        observer.complete();
      });
    }

    // بناء المسار الديناميكي الصحيح باستخدام ID المستخدم
    const profileUrl = `${this.userApiUrl}/profile/${userId}`;
    console.log(`[AuthService] Fetching profile from: ${profileUrl}`); // للتشخيص

    return this.http.get<UserProfile>(profileUrl);
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

  public getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const decodedToken: any = jwtDecode(token);
      return decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decodedToken.sub || null;
    } catch (error) {
      return null;
    }
  }

  public getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const decodedToken: any = jwtDecode(token);
      const role = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decodedToken['role'];
      return role ? role.toLowerCase() : null;
    } catch (error) {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: { exp: number } = jwtDecode(token);
      return decoded.exp < (Date.now() / 1000);
    } catch (err) {
      return true;
    }
  }
}
