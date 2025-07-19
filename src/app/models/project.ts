// src/app/models/project.ts
import { Category } from './category';
import { Department } from './department';

export interface Student {
  id: number;
  name: string;
}

export interface Supervisor {
  id: number;
  name: string;
}

export interface Member {
  name: string;
  academicId: number;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  grade: number | null; // Can be null
  technologies: string;
  toolsUsed: string;
  problemStatement: string;
  images: string[]; // Will be empty if backend doesn't send
  submissionDate: string | null; // ISO date string or null
  startDate: string | null;      // ISO date string or null
  teamLeaderId: number | null; // Allow null
  category: Category | null;
  department: Department | null;
  students: Student[] | null; // Allow null
  supervisers: Supervisor[] | null; // Allow null
  members?: Member[] | null; // Allow null
}
