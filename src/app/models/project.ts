// src/app/models/project.model.ts
export interface Project {
  id: number; // سيكون موجوداً دائماً عند الجلب، لكننا سنتعامل معه عند الإنشاء
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  clientName: string;
  status: string;
}
