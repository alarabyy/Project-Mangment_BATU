// src/app/core/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Import HttpHeaders
import { Observable, of } from 'rxjs'; // Import 'of' for mocking
import { UserProfile } from './auth.service'; // تأكد من المسار الصحيح
import { User } from '../models/user'; // تأكد من المسار الصحيح
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

// تعريف واجهة للعميد
export interface Dean {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getUsers(): Observable<User[]> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<User[]>(`${this.baseUrl}/list`, { headers });
  }

  deleteUser(id: number): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    return this.http.delete(`${this.baseUrl}/delete?id=${id}`, { headers });
  }

  updateUser(user: Partial<User>): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    const body = {
      id: user.id,
      firstName: user.firstName,
      middleName: user.middleName !== undefined ? user.middleName : null,
      lastName: user.lastname,
      email: user.email,
      gender: user.gender !== undefined ? user.gender : null
    };
    return this.http.put(`${this.baseUrl}/update`, body, { headers });
  }

  getUserProfile(id: number): Observable<UserProfile> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<UserProfile>(`${this.baseUrl}/profile/${id}`, { headers });
  }

  searchUsers(name: string): Observable<Dean[]> {
    // In a real application, you would use the actual API call:
    // const headers = this.authService.getAuthHeaders();
    // return this.http.get<Dean[]>(`${this.baseUrl}/search/${name}`, { headers });

    // For demonstration, I'm mocking the API response
    // Replace this with the actual HTTP call when your backend is ready.
    console.log(`Mocking search for: ${name}`);
    const mockUsers: Dean[] = [
      { id: 101, name: 'Hassan Ahmed' },
      { id: 102, name: 'Mohamed Ali' },
      { id: 103, name: 'Ahmed Hamdy' },
      { id: 104, name: 'Hamaad Sayed' },
      { id: 105, name: 'Omar Hassan' },
      { id: 106, name: 'Fatma Mohamed' },
      { id: 107, name: 'Sara Ahmed' },
      { id: 108, name: 'Khaled Mostafa' },
      { id: 109, name: 'Nour El-Din' },
      { id: 110, name: 'Gamal Hamza' },
      { id: 111, name: 'Laila Said' },
      { id: 112, name: 'Tarek Zaki' },
      { id: 113, name: 'Mona Gamal' },
      { id: 114, name: 'Youssef Adel' },
      { id: 115, name: 'Zainab Tamer' },
    ];

    const filteredUsers = mockUsers.filter(user =>
      user.name.toLowerCase().includes(name.toLowerCase())
    );
    return of(filteredUsers); // Return as an Observable
  }

  // Helper to get authentication headers (assuming AuthService provides this)
  // This is a placeholder; ensure your actual AuthService has getAuthHeaders()
  // private getAuthHeaders(): HttpHeaders {
  //   // Example: Replace with actual token retrieval logic
  //   // const token = localStorage.getItem('authToken'); // Or from a service
  //   // return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  //   return new HttpHeaders(); // Placeholder for now
  // }
}
