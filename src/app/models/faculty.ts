// src/app/models/faculty.ts

// واجهة لبيانات الكلية عند الإنشاء (Add Faculty)
export interface FacultyCreatePayload {
  name: string;
  description: string;
  deanId: number | null; // هذا صحيح بالفعل
  deanName: string;
}

// واجهة لبيانات الكلية عند الاستعراض أو التعديل (Edit Faculty)
export interface Faculty {
  id: number;
  name: string;
  description: string;
  deanId: number | null; // <=== هذا هو التعديل الأساسي هنا
  dean: {
    id: number;
    name: string;
  };
}
