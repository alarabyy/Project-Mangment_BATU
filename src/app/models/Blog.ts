export interface Blog {
  id: number;
  title: string;
  headerImage: string;
  publishedAt: string;
}

export interface BlogDetails extends Blog {
  content: string;
  images: string[] | string; // يمكن أن تأتي من الـ Backend كسلسلة أو مصفوفة
}

// واجهة موسعة للاستخدام في المكونات (مثل detail و edit)
// تضمن أن images ستكون دائمًا مصفوفة للعرض والتحكم في الـ UI
export interface BlogDetailsDisplay extends Blog {
  content: string;
  images: string[];
}

// واجهة موسعة خاصة بمكون التعديل (هي نفسها BlogDetailsDisplay هنا)
export type BlogDetailsForEdit = BlogDetailsDisplay;
