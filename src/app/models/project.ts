import { Category } from './category'; // Assuming Category interface exists
import { Department } from './department'; // Assuming Department interface exists

// Full Project interface - used for project details and creation/update
export interface Project {
  id: number;
  title: string;
  description: string;
  grade: number | null; // Can be null
  technologies: string;
  toolsUsed: string;
  problemStatement: string;
  images: string[]; // Array of image filenames
  submissionDate: string | null; // Can be null
  startDate: string;
  teamLeaderId: number;
  category: Category | null; // Can be null if not associated
  department: Department | null; // Can be null if not associated
  students: any[]; // Array of student objects/IDs
  supervisers: any[]; // Array of superviser objects/IDs
}

// ProjectMinimal interface - often used for lists where only basic data is needed
// This matches the data structure of the JSON you provided for the get/all endpoint.
export interface ProjectMinimal {
  id: number;
  title: string;
  description: string;
  technologies: string;
  toolsUsed: string;
  problemStatement: string;
}
