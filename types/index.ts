export interface User {
  id: number;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Evaluation {
  id: number;
  evaluatorId: number;
  evaluatedId: number;
  academicYear: string;
  createdAt: Date;
}

export interface Questionnaire {
  id: number;
  questionText: string;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Schedule {
  id: number;
  academicYear: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

export interface Result {
  id: number;
  userId: number;
  academicYear: string;
  averageRating: number;
  summary: string | null;
  createdAt: Date;
}