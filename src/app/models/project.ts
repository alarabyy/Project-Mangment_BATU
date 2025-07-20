// src/app/models/project.ts
// تم إعادة تعريف الواجهات الفرعية لأنها مطلوبة لتحليل البيانات
export interface Category {
  id: number;
  name: string;
}

export interface Department {
  id: number;
  name: string;
}

export interface Student {
  id: number;
  name: string;
}

export interface Supervisor {
  id: number;
  name: string;
}

export interface Member {
  name: string;
  academicId: number; // أو أي حقل تعريف آخر للعضو
  // ... أي خصائص أخرى للعضو
}

// الواجهة الشاملة Project لدعم جميع ميزات التحليل والتقرير
// تم حذف teamLeaderId وتوحيد supervisors
export interface Project {
  id: number;
  title: string;
  description: string;
  grade: number | null; // يمكن أن تكون null
  technologies: string; // سلسلة نصية مفصولة بفواصل
  toolsUsed: string;    // سلسلة نصية مفصولة بفواصل
  problemStatement: string;
  images?: string[]; // مصفوفة أسماء ملفات الصور (اختيارية إذا لم ترجع دائمًا)
  submissionDate: string | null; // تاريخ التسليم (ISO date string أو null)
  startDate: string | null;      // تاريخ البدء (ISO date string أو null)
  category: Category | null; // يمكن أن تكون null إذا لم تكن مرتبطة بفئة
  department: Department | null; // يمكن أن تكون null إذا لم تكن مرتبطة بقسم
  students?: Student[] | null; // مصفوفة الطلاب (اختيارية ويمكن أن تكون null)
  supervisors?: Supervisor[] | null; // مصفوفة المشرفين (اختيارية ويمكن أن تكون null) - تم تغيير 'e' إلى 'o'
  members?: Member[] | null; // مصفوفة أعضاء المشروع (اختيارية ويمكن أن تكون null)
}
