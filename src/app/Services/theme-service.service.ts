import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // هذا هو المسار الصحيح 100%
  private baseUrl = 'https://batuprojects.runasp.net/api/user';

  constructor(private http: HttpClient) {}

  // تم تبسيط الدالة لإرجاع البيانات مباشرة بدون أي إضافات
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/list`);
  }
}
