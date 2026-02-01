// types/assessments.ts
export type GAD7Question = {
  id: number;
  question: string;
  options: Array<{
    value: 0 | 1 | 2 | 3;
    label: string;
  }>;
};

export type GAD7Response = 0 | 1 | 2 | 3;

export interface GAD7Assessment {
  id: string;
  studentId: string;
  studentName?: string; // Para fácil consulta por profissionais
  weekNumber: number;
  assessmentDate: Date;
  
  // Respostas (0-3 para cada pergunta)
  responses: {
    [questionId: number]: GAD7Response;
  };
  
  // Pontuação total (0-21) - SOMENTE PROFISSIONAIS VEEM
  totalScore: number;
  
  // Interpretação - SOMENTE PROFISSIONAIS VEEM
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';
  
  // Metadados
  completedAt: Date;
  tookSeconds?: number;
  emotionalState?: {
    before: number; // 1-5
    after: number; // 1-5
  };
  
  // Rastreamento
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface GAD7Summary {
  studentId: string;
  lastAssessment?: GAD7Assessment;
  averageScore?: number;
  trend: 'improving' | 'stable' | 'worsening';
  assessmentsCount: number;
  lastAssessedWeek?: number;
  needsAssessment: boolean;
  lastAssessmentDate?: Date;
}

// Para gráficos e relatórios
export interface GAD7TrendData {
  weekNumber: number;
  date: Date;
  score: number;
  severity: GAD7Assessment['severity'];
}

export interface StudentGAD7Report {
  studentId: string;
  studentName: string;
  assessments: GAD7Assessment[];
  trendData: GAD7TrendData[];
  summary: {
    averageScore: number;
    totalAssessments: number;
    firstAssessmentDate: Date;
    lastAssessmentDate: Date;
    currentSeverity: GAD7Assessment['severity'];
    trend: GAD7Summary['trend'];
  };
}

// Para página profissional
export interface ProfessionalGAD7View {
  studentId: string;
  studentName: string;
  lastScore?: number;
  lastSeverity?: GAD7Assessment['severity'];
  trend: GAD7Summary['trend'];
  needsAttention: boolean;
  lastAssessmentDate?: Date;
  assessmentCount: number;
}