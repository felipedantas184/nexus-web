export type GAD7Question = {
  id: number;
  question: string;
  options: Array<{
    value: 0 | 1 | 2 | 3;
    label: string;
  }>;
};

export type GAD7Response = {
  [questionId: number]: 0 | 1 | 2 | 3;
};

export interface GAD7Assessment {
  id: string;
  studentId: string;
  weekNumber: number; // Número da semana no sistema
  responses: GAD7Response;
  totalScore: number; // 0-21
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface GAD7Status {
  studentId: string;
  lastCompletedWeek?: number; // Última semana que completou
  needsAssessment: boolean; // Precisa preencher esta semana?
  lastReminder?: Date; // Última vez que foi lembrado
}