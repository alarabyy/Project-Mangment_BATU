// Interfaces for the nested objects within the API response
export interface FacultyApiResponse {
  id: number;
  name: string;
}

export interface HeadApiResponse {
  id: number;
  name: string;
}

// This interface describes the structure of the data as RECEIVED from the API (GET endpoints)
// It contains nested objects for faculty and head.
export interface DepartmentApiResponse {
  id: number;
  name: string;
  description: string;
  faculty: FacultyApiResponse; // Nested object
  head: HeadApiResponse;       // Nested object
}

// This interface describes the structure of the data as USED INTERNALLY in components
// and typically as SENT to the API for UPDATE (PUT endpoint). It flattens the faculty and head IDs.
export interface Department {
  id: number;
  name: string;
  description: string;
  facultyId: number | null; // Flattened ID, made nullable for potential scenarios
  headId: number | null;    // Flattened ID, made nullable for potential scenarios
}

// This interface describes the structure of the data as SENT to the API for CREATE (POST endpoint)
// It uses flattened IDs.
export interface DepartmentCreatePayload {
  name: string;
  description: string;
  facultyId: number | null;
  headId: number | null;
}
