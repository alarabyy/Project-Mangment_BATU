export interface Blog {
  id: number;
  title: string;
  headerImage: string;
  publishedAt: string;
}

export interface BlogDetails extends Blog {
  content: string;
  images: string[];
}
