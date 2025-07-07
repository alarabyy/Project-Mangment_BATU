import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'https://batuprojects.runasp.net/api/user';

  constructor(private http: HttpClient) {}

  // هذه الدالة الآن صحيحة وتتوقع مصفوفة مستخدمين مباشرة
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/list`);
  }
}
