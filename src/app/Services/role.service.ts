// src/app/Services/role.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Role, RoleDetails } from '../models/role';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private apiUrl = `${environment.apiUrl}/api/roles`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    return this.authService.getAuthHeaders();
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getRoleById(id: number): Observable<RoleDetails> {
    return this.http.get<RoleDetails>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  createRole(roleData: { name: string; permissions: string[] }): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, roleData, { headers: this.getAuthHeaders() });
  }

  updateRole(roleData: { id: number; name: string; permissions: string[] }): Observable<any> {
    return this.http.put(`${this.apiUrl}/edit`, roleData, { headers: this.getAuthHeaders() });
  }

  deleteRole(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
