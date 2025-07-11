export interface Blog {
  id: number;
  title: string;
  headerImage: string;
  publishedAt: string;
}

export interface BlogDetails extends Blog {
  content: string;
  // يمكن أن تأتي كـ string[] (إذا كانت مصفوفة) أو string (إذا كانت مفصولة بفواصل)
  images: string[] | string;
}
