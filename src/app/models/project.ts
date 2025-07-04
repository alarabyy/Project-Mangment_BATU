export interface Project {
  id: number; // The API will return an ID after creation/retrieval
  title: string;
  description: string;
  grade: number;
  technologies: string;
  toolsUsed: string;
  problemStatement: string;
  leaderId: number;
  categoryId: number;
  departmentId: number;
}
