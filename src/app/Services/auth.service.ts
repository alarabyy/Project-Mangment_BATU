import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs'; // Import 'tap'
import { environment } from '../environments/environment';

// واجهة لبيانات التسجيل
export interface UserRegistration {
  // ... (from previous step)
  firstName: string;
  middleName: string;
  lastName: string;
  gender: number;
  role: number;
  email: string;
  password: string;
}

// واجهة لبيانات تسجيل الدخول
export interface UserCredentials {
  email: string;
  password: string;
}

// واجهة لاستجابة تسجيل الدخول التي تحتوي على التوكن
export interface AuthResponse {
  token: string;
  // you might have other properties like 'expiresIn', 'user', etc.
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token'; // Key for localStorage

  constructor(private http: HttpClient) { }

  register(userData: UserRegistration): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  /**
   * Logs in a user and stores the token upon success.
   * @param credentials The user's email and password.
   * @returns An Observable of the server's response.
   */
  login(credentials: UserCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      // Use the 'tap' operator to perform a side effect (saving the token)
      tap(response => {
        if (response && response.token) {
          localStorage.setItem(this.TOKEN_KEY, response.token);
        }
      })
    );
  }

  /**
   * Logs out the user by removing the token.
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Gets the authentication token from localStorage.
   * @returns The token string or null if not found.
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Checks if the user is currently authenticated.
   * @returns True if a token exists, false otherwise.
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
