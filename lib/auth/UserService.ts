// lib/auth/UserService.ts - REFATORADO
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import { encryptData } from '@/lib/utils/encryption';
import { Student, Professional } from '@/types/auth';

export class UserService {
  // Determinar tipo de usuário - VERSÃO ROBUSTA
  static async getUserType(userId: string): Promise<'student' | 'professional'> {
    try {
      // Tentar buscar como professional
      const professionalDoc = await getDoc(doc(firestore, 'professionals', userId));
      if (professionalDoc.exists()) {
        const data = professionalDoc.data();
        if (data?.isActive !== false) {
          return 'professional';
        }
      }

      // Tentar buscar como student
      const studentDoc = await getDoc(doc(firestore, 'students', userId));
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        if (data?.isActive !== false) {
          return 'student';
        }
      }

      throw new Error('User profile not found or inactive');
    } catch (error) {
      console.error('Error getting user type:', error);
      throw error;
    }
  }

  // Buscar usuário completo - VERSÃO ROBUSTA
  static async getUser(userId: string, type: 'student' | 'professional') {
    try {
      const collectionName = type === 'professional' ? 'professionals' : 'students';
      const docRef = doc(firestore, collectionName, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error(`${type} not found`);
      }
      
      const data = docSnap.data();
      
      // Converter timestamps para Date
      const convertTimestamps = (obj: any): any => {
        if (obj && typeof obj === 'object') {
          if (obj.toDate && typeof obj.toDate === 'function') {
            return obj.toDate();
          }
          if (obj.seconds !== undefined && obj.nanoseconds !== undefined) {
            return new Date(obj.seconds * 1000 + obj.nanoseconds / 1000000);
          }
          return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, convertTimestamps(value)])
          );
        }
        return obj;
      };
      
      const processedData = convertTimestamps(data);
      
      return {
        id: docSnap.id,
        ...processedData
      };
      
    } catch (error) {
      console.error(`Error getting ${type}:`, error);
      throw error;
    }
  }

  // Buscar usuário independente do tipo
  static async getUserById(userId: string): Promise<Student | Professional | null> {
    try {
      // Tentar como professional primeiro
      try {
        const professional = await this.getUser(userId, 'professional');
        return professional as Professional;
      } catch {
        // Não é professional, tentar como student
        try {
          const student = await this.getUser(userId, 'student');
          return student as Student;
        } catch {
          return null;
        }
      }
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // Verificar se email já existe
  static async checkEmailExists(email: string): Promise<boolean> {
    try {
      // Verificar em professionals
      const professionalsQuery = query(
        collection(firestore, 'professionals'),
        where('email', '==', email)
      );
      const professionalsSnapshot = await getDocs(professionalsQuery);
      if (!professionalsSnapshot.empty) return true;

      // Verificar em students
      const studentsQuery = query(
        collection(firestore, 'students'),
        where('email', '==', email)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      return !studentsSnapshot.empty;
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw error;
    }
  }

  // Verificar se CPF já existe
  static async checkCPFExists(cpf: string): Promise<boolean> {
    try {
      // Como o CPF está criptografado, usar busca aproximada
      // Em produção, usar hash indexado
      const studentsQuery = query(collection(firestore, 'students'));
      const snapshot = await getDocs(studentsQuery);
      
      // Verificação simplificada - em produção usar hash
      for (const doc of snapshot.docs) {
        const studentData = doc.data();
        if (studentData.profile?.cpf) {
          // Aqui seria necessário descriptografar para comparar
          // Por enquanto, retornar false
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking CPF existence:', error);
      return false;
    }
  }

  // Verificar se CRM/CRP já existe
  static async checkLicenseExists(licenseNumber: string): Promise<boolean> {
    try {
      const encryptedLicense = encryptData(licenseNumber);
      const professionalsQuery = query(
        collection(firestore, 'professionals'),
        where('profile.licenseNumber', '==', encryptedLicense)
      );
      const snapshot = await getDocs(professionalsQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking license existence:', error);
      throw error;
    }
  }

  // Atualizar último login
  static async updateLastLogin(userId: string): Promise<void> {
    try {
      const userType = await this.getUserType(userId);
      const collectionName = userType === 'professional' ? 'professionals' : 'students';
      
      await updateDoc(doc(firestore, collectionName, userId), {
        lastLoginAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      // Não falhar a operação principal
    }
  }
}