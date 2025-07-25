// src/app/models/user.ts

export interface User {
  id: number;
  firstName: string;
  middleName?: string;
  lastname: string | null;
  email: string;
  gender?: number;
  role?: string | string[] | number;
  imageUrl?: string | null;
  status?: string;
  createdAt?: string;
}
