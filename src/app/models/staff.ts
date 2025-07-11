// src/app/models/staff.ts

export interface Staff {
  id: number;
  name: string;
  position: string;
  about: string;
  image?: string | null;
}

export interface StaffCreatePayload {
  name: string;
  position: string;
  about: string;
  image: File | null;
}

export interface StaffUpdatePayload {
  id: number;
  name: string;
  position: string;
  about: string;
  image?: File;
  removeImage?: boolean;
}
