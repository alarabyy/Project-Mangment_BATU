import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // 1. تأكد من استيراد HttpParams
import { Observable } from 'rxjs';
import { Faculty, FacultyCreatePayload } from '../models/faculty';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FacultyService {
  private baseUrl = `${environment.apiUrl}/faculty`;

  constructor(private http: HttpClient) { }

  getFaculties(): Observable<Faculty[]> {
    return this.http.get<Faculty[]>(`${this.baseUrl}/get/all`);
  }

  getFacultyById(id: number): Observable<Faculty> {
    return this.http.get<Faculty>(`${this.baseUrl}/get/${id}`);
  }

  createFaculty(facultyData: FacultyCreatePayload): Observable<Faculty> {
    return this.http.post<Faculty>(`${this.baseUrl}/create`, facultyData);
  }

  updateFaculty(facultyData: Faculty): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/update`, facultyData);
  }

  /**
   * @method deleteFaculty
   * @description يرسل طلب حذف كلية باستخدام ID الخاص بها بالطريقة الصحيحة.
   * @param id - معرف الكلية المراد حذفها.
   */
  deleteFaculty(id: number): Observable<void> {
    // ===== 🔽 هذا هو الإصلاح الصحيح والنهائي 🔽 =====

    // 2. إنشاء HttpParams لإرسال الـ ID كرابط استعلام (query parameter)
    const params = new HttpParams().set('id', id.toString());

    // 3. إرسال الطلب مع الرابط الصحيح والمعلمات
    // الرابط النهائي الذي سيتم إرساله سيكون: .../api/faculty/delete?id=10
    return this.http.delete<void>(`${this.baseUrl}/delete`, { params });

    // ===== 🔼 نهاية الإصلاح 🔼 =====
  }
}
