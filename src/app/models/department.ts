export interface Department {
  id: number;
  name: string;
  description: string;
  facultyId: number;
  headId: number;
}

export interface DepartmentCreatePayload {
  name: string;
  description: string;
  facultyId: number | null;
  headId: number | null;
}
