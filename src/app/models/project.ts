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
  teamLeaderId: number;

  // FIX: Make category and department optional to match backend reality.
  // This will make the ?. operator valid and remove the warnings.
  category: Category | null;
  department: Department | null;

  students: any[];
  supervisers: any[];
}
