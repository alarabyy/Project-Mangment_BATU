// src/app/core/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile } from './auth.service';
import { User } from '../models/user';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

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
      lastName: user.lastname, // **تم التعديل: استخدام user.lastname**
      email: user.email,
      gender: user.gender !== undefined ? user.gender : null
    };
    return this.http.put(`${this.baseUrl}/update`, body, { headers });
  }

  getUserProfile(id: number): Observable<UserProfile> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<UserProfile>(`${this.baseUrl}/profile/${id}`, { headers });
  }
}
