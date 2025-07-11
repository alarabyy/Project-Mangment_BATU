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
  imageUrl: string | null;
  role: string | string[];
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
      return throwError(() => new Error(errorMsg));
    }
    const profileUrl = `${this.userApiUrl}/profile/${userId}`;
    // UPDATED: تمرير الهيدرز يدوياً هنا أيضاً لأننا لا نستخدم Interceptor
    return this.http.get<UserProfile>(profileUrl, { headers: this.getAuthHeaders() });
  }

  private checkInitialAuthState(): void {
    const token = this.getToken();
    this._isAuthenticated.next(!!token && !this.isTokenExpired(token));
  }

  public isLoggedIn(): boolean {
    return this._isAuthenticated.value;
  }

  public getToken(): string | null {
    // هذه هي الدالة التي سيتم استدعاؤها للحصول على الـ token
    return localStorage.getItem(this.authTokenKey);
  }

  private getDecodedToken(): any | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error("Error decoding token:", error); // إضافة سجل للخطأ
      return null;
    }
  }

  public getUserId(): string | null {
    const decoded = this.getDecodedToken();
    return decoded ? (decoded.id || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.nameid || decoded.sub) : null;
  }

  public getUserRole(): string | null {
    const decoded = this.getDecodedToken();
    if (!decoded) return null;
    const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role;
    return Array.isArray(role) ? role[0]?.toLowerCase() : role?.toLowerCase() || null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: { exp: number } = jwtDecode(token);
      if (typeof decoded.exp !== 'number') {
        console.warn("Token does not contain a numeric 'exp' claim.");
        return true;
      }
      return decoded.exp < (Date.now() / 1000);
    } catch (error) {
      console.error("Error checking token expiration:", error); // إضافة سجل للخطأ
      return true;
    }
  }

  // هذه الدالة موجودة بالفعل وسيتم استخدامها لبناء HttpHeaders
  public getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
  }
}
