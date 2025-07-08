export interface Category {
  id: number;
  name: string;
}

export interface Department {
  id: number;
  name: string;
}

// ProjectImage interface is no longer needed on the frontend
// as the backend returns an array of strings.

export interface Project {
  id: number;
  title: string;
  description: string;
  grade: number | null;
  technologies: string;
  toolsUsed: string;
  problemStatement: string;
  images: string[]; // FIXED: This is now an array of strings (filenames)
  submissionDate: string | null;
  startDate: string;
  leaderId: number;
  category: Category;
  department: Department;
  students: any[];
  supervisers: any[];
}
