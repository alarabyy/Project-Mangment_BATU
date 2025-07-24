export interface Mail {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  sentAt: string; // <-- Add this line
  isRead: boolean;
  replier: {
    id: number;
    name: string;
  } | null; // replier can be null
  createdAt?: string; // Add this if you intend to use 'createdAt' for display, otherwise 'sentAt' is enough.
}
