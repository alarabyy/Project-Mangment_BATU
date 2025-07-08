import { Category } from './category';
import { Department } from './department';

export interface Project {
  id: number;
  title: string;
  description: string;
  grade: number | null;
  technologies: string;
  toolsUsed: string;
  problemStatement: string;
  images: string[];
  submissionDate: string | null;
  startDate: string;
  teamLeaderId: number; // The correct property name
  category: Category;
  department: Department;
  students: any[];
  supervisers: any[];
}
