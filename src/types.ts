export type ChapterStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REVISION_NEEDED';

export interface Chapter {
  id: string;
  name: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  category: string;
}

export interface UserChapterData {
  chapterId: string;
  status: ChapterStatus;
  lastStudied?: string;
  notes?: string;
}

export interface StudySession {
  id: string;
  date: string; // ISO string
  durationMinutes: number;
  subject?: string;
}

export interface MockTest {
  id: string;
  name: string;
  date: string;
  score: number;
  totalMarks: number;
  physicsScore: number;
  chemistryScore: number;
  mathsScore: number;
  accuracy: number; // percentage
  timeTakenMinutes: number;
}

export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskCategory = 'Study' | 'Personal' | 'Work';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string; // ISO string
  category: TaskCategory;
  priority: TaskPriority;
  createdAt: string; // ISO string
}

export interface UserData {
  chapters: Record<string, UserChapterData>;
  studySessions: StudySession[];
  mockTests: MockTest[];
  tasks: Task[];
  settings: {
    userName: string;
    targetYear: number;
    dailyGoalMinutes: number;
  };
}
