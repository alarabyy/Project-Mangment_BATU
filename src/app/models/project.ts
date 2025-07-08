export interface Category {
  id: number;
  name: string;
}

export interface Department {
  id: number;
  name: string;
}

export interface ProjectImage {
  id: number;
  url: string;
  projectId: number;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  grade: number | null;
  technologies: string;
  toolsUsed: string;
  problemStatement: string;
  images: ProjectImage[];
  submissionDate: string | null;
  startDate: string;
  leaderId: number;
  category: Category;
  department: Department;
  students: any[];
  supervisers: any[];
}
