// src/app/models/project.model.ts

export interface Leader { id: number; name: string; }
export interface Category { id: number; name: string; }
export interface Department { id: number; name: string; }
export interface Member { id: number; name: string; academicDegree: number; academicId: number; }
export interface Supervisor { id: number; name: string; }
export interface Evaluator { id: number; name: string; academicDegree: number; score: number; }

export interface ProjectHistory {
  id: number;
  fieldName: string;
  oldValue: string;
  newValue: string;
  editedByUser: { id: number; name: string; };
  editedAt: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  score: number | null;
  technologies: string;
  toolsUsed: string;
  problemStatement: string;
  patentNumber: number | null;
  patentDate: string | null;
  images: string[] | null;
  documents: string[] | null;
  submissionDate: string | null;
  startDate: string | null;
  leader: Leader;
  category: Category;
  department: Department[]; // This is an array
  members: Member[];
  supervisers: Supervisor[]; // Spelling from API
  evaluators: Evaluator[];
}
