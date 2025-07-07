export interface FacultyCreatePayload {
  name: string;
  description: string;
  deanId: number | null; // <-- اسمح بالقيمة null هنا
  deanName: string;
}

// قد تحتاج لتعديل واجهة Faculty الرئيسية أيضًا إذا كانت تحتوي على deanId
export interface Faculty {
  id: number;
  name: string;
  description: string;
  deanId: number; // هنا يمكن أن يبقى number فقط لأنه دائمًا سيكون له قيمة عند العرض
  dean: {
    id: number;
    name: string;
  };
}
