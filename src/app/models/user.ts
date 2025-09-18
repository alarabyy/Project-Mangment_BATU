// src/app/models/user.model.ts

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastname: string | null;
  imageUrl: string;
  gender: number;
  graduationDate: string;
  role: number;
}
