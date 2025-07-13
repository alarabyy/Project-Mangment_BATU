// src/app/models/user.ts
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastname: string | null;
  imageUrl: string;
  role: number;
  status?: string;
  createdAt?: string;
}
