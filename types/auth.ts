// types/auth.ts
export type UserRole = 'student' | 'psychologist' | 'psychiatrist' | 'monitor' | 'coordinator';

export interface BaseUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLoginAt?: Date;
  profileComplete: boolean;
}

export interface StudentProfile {
  cpf: string; // Criptografado
  birthday: Date;
  phone?: string;
  school: string;
  grade: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  medicalInfo?: {
    diagnoses: string[];
    medications: string[];
    observations: string;
    allergies: string[];
  };
  address?: {
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
  };
  assignedProfessionals: string[];
  assignedPrograms: string[];
  streak: number;
  totalPoints: number;
  level: number;
  achievements: string[];
}

export interface ProfessionalProfile {
  specialization?: string;
  licenseNumber?: string; // Criptografado
  institution?: string;
  department?: string;
  assignedStudents: string[];
  canCreatePrograms: boolean;
  canManageStudents: boolean;
  canApproveRegistrations: boolean;
  verified: boolean;
  verificationDate?: Date;
}

// User types
export interface Student extends BaseUser {
  role: 'student';
  profile: StudentProfile;
}

export interface Professional extends BaseUser {
  role: 'psychologist' | 'psychiatrist' | 'monitor' | 'coordinator';
  profile: ProfessionalProfile;
}

export type User = Student | Professional;

// Auth context types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<RegisterResult>;
  logout: () => Promise<void>;
}

// Form types
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  type: 'student' | 'professional';
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  
  // Student specific
  cpf?: string;
  birthday?: string;
  phone?: string;
  school?: string;
  grade?: string;
  
  // Professional specific
  role?: 'psychologist' | 'psychiatrist' | 'monitor' | 'coordinator';
  specialization?: string;
  licenseNumber?: string;
  institution?: string;
}

export interface LoginResult {
  success: boolean;
  userId: string;
  userType: 'student' | 'professional';
  requiresMFA?: boolean;
}

export interface RegisterResult {
  success: boolean;
  userId: string;
  requiresVerification?: boolean;
}

// Validation types
export interface ValidationResult {
  valid: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

// Error types
export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AuthError';
  }
}