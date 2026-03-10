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

export interface UserData {
  chapters: Record<string, UserChapterData>;
  studySessions: StudySession[];
  mockTests: MockTest[];
  settings: {
    userName: string;
    targetYear: number;
    dailyGoalMinutes: number;
  };
}
