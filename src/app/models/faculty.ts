export interface Faculty {
  id: number;
  name: string;
  description: string;
  deanId: number;
  dean: { // This structure is implied by faculty.dean.name in HTML
    id: number; // Assuming dean also has an ID
    name: string;
  };
}

export interface FacultyCreatePayload {
  name: string;
  description: string;
  deanId: number;
  deanName: string; // Including deanName for creation
}
