export interface User {
  id: number;
  email: string;
  firstName: string;
  lastname: string | null;
  imageUrl: string;
  role: number;
  // Properties added for analytics
  createdAt?: Date; // Essential for "new users" analysis
  status?: 'Active' | 'Inactive' | 'Pending'; // Mock property for filtering
  country?: string; // Mock property for geo-analysis (kept for potential future use)
}
