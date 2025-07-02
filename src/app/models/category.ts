export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface CategoryCreatePayload {
  name: string;
  description: string;
}
