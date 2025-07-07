// This interface defines the structure of a User object
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastname: string | null; // Can be null
  imageUrl: string;
  role: number;
}
