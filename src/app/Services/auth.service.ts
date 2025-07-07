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
  lastName: string;
  imageUrl: string;
  role: string | string[]; // تم تحديث الواجهة لتقبل مصفوفة
}

export interface LoginResponse {
  token: string;
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
    const userId = this.getUserId();
    if (!userId) {
      const errorMsg = "[AuthService] Cannot fetch profile, User ID not found in token.";
      console.error(errorMsg);
      return throwError(() => new Error(errorMsg));
    }

    const profileUrl = `${this.userApiUrl}/profile/${userId}`;
    console.log(`[AuthService] Fetching profile from: ${profileUrl}`);
    return this.http.get<UserProfile>(profileUrl, { headers: this.getAuthHeaders() });
  }

  public logout(): void {
    localStorage.removeItem(this.authTokenKey);
    this._isAuthenticated.next(false);
    this.router.navigate(['/login']);
  }

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
      console.error("Could not decode token", error);
      return null;
    }
  }

  public getUserId(): string | null {
    const decodedToken = this.getDecodedToken();
    if (!decodedToken) return null;

    const userId =
      decodedToken.id ||
      decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
      decodedToken.nameid ||
      decodedToken.sub;

    if (!userId) {
      console.warn("[AuthService] User ID claim (id, nameidentifier, sub) not found in token.", decodedToken);
    }
    return String(userId) || null;
  }

  public getUserRole(): string | null {
    const decodedToken = this.getDecodedToken();
    if (!decodedToken) return null;

    const role = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decodedToken.role;

    if (!role) {
      console.warn("[AuthService] Role claim (role) not found in token.", decodedToken);
    }

    return Array.isArray(role) ? role[0]?.toLowerCase() : role?.toLowerCase() || null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: { exp: number } = jwtDecode(token);
      if (typeof decoded.exp === 'undefined') {
        return true;
      }
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
