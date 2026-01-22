import { firestore } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";

// lib/utils/debugUtils.ts
export class DebugUtils {
  static logActivityFlow(step: string, data: any) {
    console.log(`🔍 [ACTIVITY_FLOW] ${step}:`, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  static async validateProgressId(progressId: string) {
    try {
      const docRef = doc(firestore, 'activityProgress', progressId);
      const docSnap = await getDoc(docRef);
      
      return {
        exists: docSnap.exists(),
        data: docSnap.data(),
        id: progressId
      };
    } catch (error) {
      return { exists: false, error };
    }
  }
}