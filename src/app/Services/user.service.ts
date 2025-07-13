// src/app/core/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile } from './auth.service';
import { User } from '../models/user';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/list`);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete?id=${id}`);
  }

  updateUser(user: Partial<User>): Observable<any> {
    const body = {
      id: user.id,
      firstName: user.firstName,
      middleName: null,
      lastName: user.lastname,
      email: user.email,
      gender: null
    };
    return this.http.put(`${this.baseUrl}/update`, body);
  }

  getUserProfile(id: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/profile/${id}`);
  }
}
