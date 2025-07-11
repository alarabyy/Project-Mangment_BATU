export interface Blog {
  id: number;
  title: string;
  headerImage: string;
  publishedAt: string;
}

export interface BlogDetails extends Blog {
  content: string;
  images: string[] | string; // يبقى كما هو
}

// UPDATED: تعريف واجهة موسعة للاستخدام في المكونات
export interface BlogDetailsDisplay extends Blog {
  content: string;
  images: string[]; // هنا نضمن أنها مصفوفة دائمًا للعرض في القالب
}
