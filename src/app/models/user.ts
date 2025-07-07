/**
 * يمثل كائن المستخدم كما هو معرف في ה-API.
 * تم تحديث كل الخصائص لتطابق تمامًا استجابة الـ API الفعلية.
 */
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastname: string | null; // لاحظ: lastname بحرف n صغير
  imageUrl: string;
  role: number;

  // الخصائص التالية غير موجودة في استجابة /list
  // تم جعلها اختيارية لمنع أخطاء، لكن صفحة التحليلات قد لا تعمل بالكامل.
  status?: string;
  createdAt?: string;
}
