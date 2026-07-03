export interface User {
  id: string;
  email: string;
  displayName?: string | null;
  avatar?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  category: string;
  duration: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  duration: number;
  order: number;
}

export interface PracticeSession {
  id: string;
  userId: string;
  courseId: string;
  startTime: string;
  endTime: string;
  duration: number;
  score: number;
  feedback: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}
