// واجهة لتمثيل كائن الصورة
export interface ProjectImage {
  id: number;
  url: string;
  projectId: number;
}

/**
 * يمثل كائن المشروع كما هو معرف في ה-API.
 */
export interface Project {
  id: number;
  title: string;
  description: string;
  grade: number | null;
  leaderId: string;
  categoryId: number;
  departmentId: number;
  problemStatement?: string;
  technologies?: string;
  toolsUsed?: string;

  // [تمت الإضافة] مصفوفة لتخزين صور المشروع
  images?: ProjectImage[];
}
