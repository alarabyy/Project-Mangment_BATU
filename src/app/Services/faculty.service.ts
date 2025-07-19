import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // 1. تأكد من استيراد HttpParams
import { Observable } from 'rxjs';
import { Faculty, FacultyCreatePayload } from '../models/faculty'; // تأكد من وجود وتحديد هذه الـ Interfaces في ملف faculty.ts
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FacultyService {
  private baseUrl = `${environment.apiUrl}/faculty`;

  constructor(private http: HttpClient) { }

  /**
   * @method getFaculties
   * @description يجلب جميع الكليات من الـ API.
   * @returns Observable يرسل مصفوفة من كائنات Faculty.
   */
  getFaculties(): Observable<Faculty[]> {
    return this.http.get<Faculty[]>(`${this.baseUrl}/get/all`);
  }

  /**
   * @method getFacultyById
   * @description يجلب كلية واحدة بواسطة ID الخاص بها.
   * @param id - معرف الكلية.
   * @returns Observable يرسل كائن Faculty.
   */
  getFacultyById(id: number): Observable<Faculty> {
    return this.http.get<Faculty>(`${this.baseUrl}/get/${id}`);
  }

  /**
   * @method createFaculty
   * @description ينشئ كلية جديدة.
   * @param facultyData - بيانات الكلية المراد إنشاؤها.
   * @returns Observable يرسل الكلية التي تم إنشاؤها.
   */
  createFaculty(facultyData: FacultyCreatePayload): Observable<Faculty> {
    return this.http.post<Faculty>(`${this.baseUrl}/create`, facultyData);
  }

  /**
   * @method updateFaculty
   * @description يحدث بيانات كلية موجودة.
   * @param facultyData - بيانات الكلية المحدثة (يجب أن تحتوي على ID).
   * @returns Observable يرسل استجابة الـ API.
   */
  updateFaculty(facultyData: Faculty): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/update`, facultyData);
  }

  /**
   * @method deleteFaculty
   * @description يرسل طلب حذف كلية باستخدام ID الخاص بها بالطريقة الصحيحة (كـ Query Parameter).
   * @param id - معرف الكلية المراد حذفها.
   * @returns Observable يرسل إشارة اكتمال الحذف (void).
   */
  deleteFaculty(id: number): Observable<void> {
    // إنشاء HttpParams لإرسال الـ ID كرابط استعلام (query parameter)
    const params = new HttpParams().set('id', id.toString());

    // إرسال الطلب مع الرابط الصحيح والمعلمات
    // الرابط النهائي الذي سيتم إرساله سيكون: .../api/faculty/delete?id=10
    return this.http.delete<void>(`${this.baseUrl}/delete`, { params });
  }
}
