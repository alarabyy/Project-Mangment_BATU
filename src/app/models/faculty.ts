// src/app/models/faculty.ts
export interface FacultyCreatePayload {
  name: string;
  description: string;
  deanId: number | null;
  deanName: string;
}

export interface Faculty {
  id: number;
  name: string;
  description: string;
  deanId: number;
  dean: {
    id: number;
    name: string;
  };
}
