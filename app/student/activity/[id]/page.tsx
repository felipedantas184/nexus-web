// app/student/activity/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ActivityExecutor from '@/components/activities/ActivityExecutor';
import { ProgressService } from '@/lib/services/ProgressService';
import { ActivityProgress } from '@/types/schedule';
import { useAuth } from '@/context/AuthContext';
import { 
  FaArrowLeft, 
  FaHome,
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';
import Link from 'next/link';

export default function ActivityPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [activityProgress, setActivityProgress] = useState<ActivityProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;

    const loadActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Buscar progresso da atividade
        const progress = await ProgressService.getActivityProgress(
          id as string,
          user.id
        );
        
        setActivityProgress(progress);
        
        // Se atividade estiver pendente, iniciar automaticamente
        if (progress.status === 'pending') {
          try {
            await ProgressService.startActivity(id as string, user.id);
            setActivityProgress(prev => prev ? { ...prev, status: 'in_progress' } : null);
          } catch (startError) {
            console.warn('Não foi possível iniciar automaticamente:', startError);
          }
        }
        
      } catch (err: any) {
        console.error('Erro ao carregar atividade:', err);
        setError(err.message || 'Erro ao carregar atividade');
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, [id, user]);

  const handleActivityCompletion = (result: any) => {
    // Redirecionar de volta ao dashboard após 2 segundos
    setTimeout(() => {
      router.push('/student/dashboard');
    }, 2000);
  };

  const handleActivityStatusChange = () => {
    // Recarregar dados da atividade
    if (user && id) {
      ProgressService.getActivityProgress(id as string, user.id)
        .then(setActivityProgress)
        .catch(console.error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando atividade...</p>
        </div>
      </div>
    );
  }

  if (error || !activityProgress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <FaExclamationTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {error || 'Atividade não encontrada'}
          </h2>
          <p className="text-gray-600 mb-6">
            Esta atividade não existe ou você não tem permissão para acessá-la.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <FaArrowLeft />
              Voltar
            </button>
            <Link
              href="/student/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <FaHome />
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">
                  {activityProgress.activitySnapshot.title}
                </h1>
                <p className="text-sm text-gray-500">
                  {activityProgress.activitySnapshot.type === 'quick' ? 'Atividade Rápida' :
                   activityProgress.activitySnapshot.type === 'text' ? 'Texto' :
                   activityProgress.activitySnapshot.type === 'quiz' ? 'Quiz' :
                   activityProgress.activitySnapshot.type === 'video' ? 'Vídeo' :
                   activityProgress.activitySnapshot.type === 'checklist' ? 'Checklist' : 'Arquivo'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-sm rounded-full ${
                activityProgress.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                activityProgress.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                activityProgress.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {activityProgress.status === 'pending' ? 'Pendente' :
                 activityProgress.status === 'in_progress' ? 'Em Progresso' :
                 activityProgress.status === 'completed' ? 'Concluída' : 'Pulada'}
              </span>
              
              <Link
                href="/student/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FaHome className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <ActivityExecutor
          progress={activityProgress}
          onStatusChange={handleActivityStatusChange}
          onCompletion={handleActivityCompletion}
          readOnly={activityProgress.status === 'completed'}
        />
        
        {/* Navegação */}
        <div className="mt-8 pt-8 border-t">
          <div className="flex justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <FaArrowLeft />
              Voltar
            </button>
            
            <Link
              href="/student/dashboard"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Ir para Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}