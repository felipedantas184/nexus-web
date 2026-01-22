// lib/services/ProfessionalService.ts
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  DocumentData,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import { Professional, ProfessionalProfile } from '@/types/auth';

export class ProfessionalService {
  private static readonly COLLECTION = 'professionals';

  /**
   * Busca todos os profissionais ativos
   */
  static async getAllProfessionals(): Promise<Professional[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        where('role', 'in', ['psychologist', 'psychiatrist', 'monitor', 'coordinator']),
        where('isActive', '==', true),
        orderBy('name')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          name: data.name,
          role: data.role,
          isActive: data.isActive,
          profileComplete: data.profileComplete,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          lastLoginAt: data.lastLoginAt?.toDate(),
          profile: {
            specialization: data.profile?.specialization,
            licenseNumber: data.profile?.licenseNumber,
            institution: data.profile?.institution,
            department: data.profile?.department,
            assignedStudents: data.profile?.assignedStudents || [],
            canCreatePrograms: data.profile?.canCreatePrograms || false,
            canManageStudents: data.profile?.canManageStudents || false,
            canApproveRegistrations: data.profile?.canApproveRegistrations || false,
            verified: data.profile?.verified || false,
            verificationDate: data.profile?.verificationDate?.toDate()
          }
        } as Professional;
      });
    } catch (error: any) {
      console.error('Erro ao buscar profissionais:', error);
      throw new Error('Não foi possível carregar os profissionais');
    }
  }

  /**
   * Busca profissionais por tipo/especialidade
   */
  static async getProfessionalsByType(
    roles: Array<'psychologist' | 'psychiatrist' | 'monitor' | 'coordinator'>,
    options?: {
      institution?: string;
      specialization?: string;
    }
  ): Promise<Professional[]> {
    try {
      let q = query(
        collection(firestore, this.COLLECTION),
        where('role', 'in', roles),
        where('isActive', '==', true)
      );

      if (options?.institution) {
        q = query(q, where('profile.institution', '==', options.institution));
      }

      if (options?.specialization) {
        q = query(q, where('profile.specialization', '==', options.specialization));
      }

      q = query(q, orderBy('name'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          name: data.name,
          role: data.role,
          isActive: data.isActive,
          profileComplete: data.profileComplete,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          lastLoginAt: data.lastLoginAt?.toDate(),
          profile: {
            specialization: data.profile?.specialization,
            licenseNumber: data.profile?.licenseNumber,
            institution: data.profile?.institution,
            department: data.profile?.department,
            assignedStudents: data.profile?.assignedStudents || [],
            canCreatePrograms: data.profile?.canCreatePrograms || false,
            canManageStudents: data.profile?.canManageStudents || false,
            canApproveRegistrations: data.profile?.canApproveRegistrations || false,
            verified: data.profile?.verified || false,
            verificationDate: data.profile?.verificationDate?.toDate()
          }
        } as Professional;
      });
    } catch (error: any) {
      console.error('Erro ao buscar profissionais por tipo:', error);
      throw new Error('Não foi possível carregar os profissionais');
    }
  }

  /**
   * Busca um profissional específico por ID
   */
  static async getProfessionalById(id: string): Promise<Professional | null> {
    try {
      const docRef = doc(firestore, this.COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      
      // Verificar se é um profissional
      if (!['psychologist', 'psychiatrist', 'monitor', 'coordinator'].includes(data.role)) {
        throw new Error('Usuário não é um profissional');
      }

      return {
        id: docSnap.id,
        email: data.email,
        name: data.name,
        role: data.role,
        isActive: data.isActive,
        profileComplete: data.profileComplete,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        lastLoginAt: data.lastLoginAt?.toDate(),
        profile: {
          specialization: data.profile?.specialization,
          licenseNumber: data.profile?.licenseNumber,
          institution: data.profile?.institution,
          department: data.profile?.department,
          assignedStudents: data.profile?.assignedStudents || [],
          canCreatePrograms: data.profile?.canCreatePrograms || false,
          canManageStudents: data.profile?.canManageStudents || false,
          canApproveRegistrations: data.profile?.canApproveRegistrations || false,
          verified: data.profile?.verified || false,
          verificationDate: data.profile?.verificationDate?.toDate()
        }
      } as Professional;
    } catch (error: any) {
      console.error('Erro ao buscar profissional:', error);
      throw error;
    }
  }

  /**
   * Atualiza a lista de alunos atribuídos a um profissional
   */
  static async updateAssignedStudents(
    professionalId: string,
    studentIds: string[],
    operation: 'add' | 'remove'
  ): Promise<void> {
    try {
      const professionalRef = doc(firestore, this.COLLECTION, professionalId);
      
      if (operation === 'add') {
        await updateDoc(professionalRef, {
          'profile.assignedStudents': arrayUnion(...studentIds),
          updatedAt: new Date()
        });
      } else {
        await updateDoc(professionalRef, {
          'profile.assignedStudents': arrayRemove(...studentIds),
          updatedAt: new Date()
        });
      }
    } catch (error: any) {
      console.error('Erro ao atualizar alunos atribuídos:', error);
      throw new Error(`Não foi possível ${operation === 'add' ? 'adicionar' : 'remover'} os alunos`);
    }
  }

  /**
   * Verifica se um profissional pode receber mais alunos
   */
  static async canAcceptMoreStudents(
    professionalId: string,
    maxStudents?: number
  ): Promise<boolean> {
    try {
      const professional = await this.getProfessionalById(professionalId);
      if (!professional) return false;

      const currentCount = professional.profile.assignedStudents?.length || 0;
      
      // Limite padrão baseado no role
      const defaultLimits: Record<string, number> = {
        psychologist: 50,
        psychiatrist: 100,
        monitor: 200,
        coordinator: 1000 // Coordenadores podem ter muitos alunos
      };

      const limit = maxStudents || defaultLimits[professional.role] || 50;
      return currentCount < limit;
    } catch (error) {
      console.error('Erro ao verificar capacidade:', error);
      return false;
    }
  }

  /**
   * Obtém estatísticas dos profissionais
   */
  static async getProfessionalStats(): Promise<{
    total: number;
    byRole: Record<string, number>;
    averageStudentsPerProfessional: number;
    totalAssignedStudents: number;
  }> {
    try {
      const professionals = await this.getAllProfessionals();
      
      const byRole: Record<string, number> = {};
      let totalAssignedStudents = 0;
      
      professionals.forEach(prof => {
        byRole[prof.role] = (byRole[prof.role] || 0) + 1;
        totalAssignedStudents += prof.profile.assignedStudents?.length || 0;
      });

      return {
        total: professionals.length,
        byRole,
        averageStudentsPerProfessional: professionals.length > 0 
          ? Math.round(totalAssignedStudents / professionals.length) 
          : 0,
        totalAssignedStudents
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        total: 0,
        byRole: {},
        averageStudentsPerProfessional: 0,
        totalAssignedStudents: 0
      };
    }
  }
}