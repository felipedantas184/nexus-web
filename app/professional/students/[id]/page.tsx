'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Student, Professional } from '@/types/auth';
import { useAuth } from '@/context/AuthContext';
import { StudentService } from '@/lib/services/StudentService';
import { ScheduleInstanceService } from '@/lib/services/ScheduleInstanceService';
import {
  FaArrowLeft,
  FaUser,
  FaGraduationCap,
  FaSchool,
  FaStar,
  FaFire,
  FaCalendar,
  FaPhone,
  FaEnvelope,
  FaEdit,
  FaChartLine,
  FaCalendarAlt,
  FaUsers,
  FaFileMedical,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaTrophy,
  FaBook,
  FaHeart,
  FaBrain,
  FaCommentDots
} from 'react-icons/fa';

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSchedule, setActiveSchedule] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'progress' | 'schedules' | 'medical' | 'notes'>('overview');

  useEffect(() => {
    loadStudentData();
  }, [studentId, user]);

  const loadStudentData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Carregar dados do aluno
      const studentData = await StudentService.getStudentById(studentId, user.id);

      // Verificar permissões
      if (user.role !== 'coordinator' &&
        !studentData.profile.assignedProfessionals?.includes(user.id)) {
        throw new Error('Você não tem permissão para acessar este aluno');
      }

      setStudent(studentData);

      // Carregar cronograma ativo
      const schedules = await ScheduleInstanceService.getStudentActiveInstances(studentId);
      if (schedules.length > 0) {
        setActiveSchedule(schedules[0]);
      }

      // Calcular estatísticas
      const calculatedStats = calculateStats(studentData);
      setStats(calculatedStats);

    } catch (err: any) {
      console.error('Erro ao carregar aluno:', err);
      setError(err.message || 'Erro ao carregar dados do aluno');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (studentData: Student) => {
    // Mock de estatísticas - implementar com dados reais
    return {
      completionRate: 85,
      averageScore: 92,
      totalActivities: 47,
      completedActivities: 40,
      weeklyEngagement: 12.5, // horas
      consistencyScore: 88,
      emotionalTrend: [3, 4, 5, 4, 5, 4, 5], // Últimos 7 dias
      strengths: ['Foco', 'Persistência', 'Criatividade'],
      challenges: ['Ansiedade pré-atividade', 'Distração noturna'],
      recommendations: ['Pausas regulares', 'Reforço positivo']
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Carregando perfil do aluno...</span>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <FaExclamationTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {error || 'Aluno não encontrado'}
            </h3>
            <p className="text-gray-600 mb-4">
              {error?.includes('permissão')
                ? 'Você não tem permissão para acessar este perfil de aluno.'
                : 'O aluno solicitado não foi encontrado ou não existe.'
              }
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/professional/students"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <FaArrowLeft className="inline mr-2" />
                Voltar para Lista
              </Link>
              <button
                onClick={loadStudentData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isCoordinator = user?.role === 'coordinator';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/professional/students"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <FaArrowLeft />
                Voltar para Lista
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {student.name}
                </h1>
                <p className="text-gray-600">
                  Perfil completo do aluno • {student.profile.grade} • {student.profile.school}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isCoordinator && (
                <Link
                  href={`/professional/students/${studentId}/edit`}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <FaEdit />
                  Editar
                </Link>
              )}
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <FaCommentDots />
                Enviar Mensagem
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda - Informações do Aluno */}
          <div className="lg:col-span-1 space-y-6">
            {/* Card de Perfil */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                  <FaUser className="w-12 h-12 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">
                  {student.name}
                </h2>
                <div className="flex items-center gap-2 text-gray-500">
                  <span>Nível {student.profile.level || 1}</span>
                  <span>•</span>
                  <span>ID: {studentId.slice(0, 8)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FaEnvelope className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-medium">{student.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FaGraduationCap className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Série/Ano</div>
                    <div className="font-medium">{student.profile.grade}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FaSchool className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Escola</div>
                    <div className="font-medium">{student.profile.school}</div>
                  </div>
                </div>

                {student.profile.phone && (
                  <div className="flex items-center gap-3">
                    <FaPhone className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Telefone</div>
                      <div className="font-medium">{student.profile.phone}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <FaCalendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Data de Nascimento</div>
                    <div className="font-medium">
                      {new Date(student.profile.birthday).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FaUsers className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Profissionais Atribuídos</div>
                    <div className="font-medium">
                      {student.profile.assignedProfessionals?.length || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card de Estatísticas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaChartLine className="text-indigo-500" />
                Estatísticas
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaStar className="w-4 h-4 text-amber-500" />
                    <span className="text-gray-700">Pontuação Total</span>
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    {student.profile.totalPoints || 0}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaFire className="w-4 h-4 text-red-500" />
                    <span className="text-gray-700">Streak Atual</span>
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    {student.profile.streak || 0} dias
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaTrophy className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-700">Conquistas</span>
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    {student.profile.achievements?.length || 0}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">Taxa de Conclusão</span>
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    {stats?.completionRate || 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Card de Status */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Status da Conta</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                    }`}>
                    {student.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Perfil Completo</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.profileComplete
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {student.profileComplete ? 'Completo' : 'Incompleto'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Último Login</span>
                  <span className="text-sm text-gray-600">
                    {student.lastLoginAt
                      ? new Date(student.lastLoginAt).toLocaleDateString('pt-BR')
                      : 'Nunca'
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Membro Desde</span>
                  <span className="text-sm text-gray-600">
                    {new Date(student.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Conteúdo Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs de Navegação */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex border-b border-gray-200">
                {[
                  { id: 'overview', label: 'Visão Geral', icon: FaChartLine },
                  { id: 'progress', label: 'Progresso', icon: FaChartLine },
                  { id: 'schedules', label: 'Cronogramas', icon: FaCalendarAlt },
                  { id: 'medical', label: 'Informações Médicas', icon: FaFileMedical },
                  { id: 'notes', label: 'Anotações', icon: FaBook }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as any)}
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${selectedTab === tab.id
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Conteúdo das Tabs */}
              <div className="p-6">
                {selectedTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Cronograma Ativo */}
                    {activeSchedule && (
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              <FaCalendarAlt className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">Cronograma Ativo</h4>
                              <p className="text-sm text-gray-600">
                                {activeSchedule.scheduleName} • Semana {activeSchedule.currentWeekNumber}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {activeSchedule.completedActivities || 0}/{activeSchedule.totalActivities || 0} atividades
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-gray-600">Progresso: </span>
                            <span className="font-semibold">{activeSchedule.progress || 0}%</span>
                          </div>
                          <Link
                            href={`/professional/schedules/${activeSchedule.scheduleId}`}
                            className="text-sm text-indigo-600 hover:text-indigo-800"
                          >
                            Ver detalhes →
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Insights e Recomendações */}
                    {stats && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <FaBrain className="text-green-500" />
                            Pontos Fortes
                          </h4>
                          <ul className="space-y-2">
                            {stats.strengths.map((strength: string, index: number) => (
                              <li key={index} className="flex items-center gap-2">
                                <FaCheckCircle className="w-3.5 h-3.5 text-green-500" />
                                <span className="text-sm text-gray-700">{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <FaExclamationTriangle className="text-amber-500" />
                            Desafios
                          </h4>
                          <ul className="space-y-2">
                            {stats.challenges.map((challenge: string, index: number) => (
                              <li key={index} className="flex items-center gap-2">
                                <FaExclamationTriangle className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-sm text-gray-700">{challenge}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <FaHeart className="text-red-500" />
                            Recomendações
                          </h4>
                          <div className="space-y-3">
                            {stats.recommendations.map((recommendation: string, index: number) => (
                              <div key={index} className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-bold text-red-600">{index + 1}</span>
                                </div>
                                <p className="text-sm text-gray-700">{recommendation}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Atividade Recente */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <h4 className="font-semibold text-gray-800 mb-4">Atividade Recente</h4>
                      <div className="space-y-3">
                        {[1, 2, 3].map((_, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <FaBook className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-800">Atividade de Matemática</div>
                                <div className="text-sm text-gray-500">Concluída há 2 horas • 95%</div>
                              </div>
                            </div>
                            <div className="text-sm text-green-600">+25 pontos</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedTab === 'progress' && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <FaChartLine className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Gráficos de Progresso</h3>
                    <p className="text-gray-600">
                      Em desenvolvimento - gráficos detalhados de progresso estarão disponíveis em breve.
                    </p>
                  </div>
                )}

                {selectedTab === 'schedules' && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <FaCalendarAlt className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Histórico de Cronogramas</h3>
                    <p className="text-gray-600">
                      Visualização completa do histórico de cronogramas em desenvolvimento.
                    </p>
                  </div>
                )}

                {selectedTab === 'medical' && student.profile.medicalInfo && (
                  <div className="space-y-6">
                    {student.profile.medicalInfo.diagnoses && student.profile.medicalInfo.diagnoses.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                        <h4 className="font-semibold text-gray-800 mb-3">Diagnósticos</h4>
                        <div className="flex flex-wrap gap-2">
                          {student.profile.medicalInfo.diagnoses.map((diagnosis: string, index: number) => (
                            <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                              {diagnosis}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {student.profile.medicalInfo.medications && student.profile.medicalInfo.medications.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                        <h4 className="font-semibold text-gray-800 mb-3">Medicações</h4>
                        <div className="space-y-2">
                          {student.profile.medicalInfo.medications.map((medication: string, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <FaFileMedical className="w-4 h-4 text-yellow-600" />
                              <span className="text-gray-700">{medication}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {student.profile.medicalInfo.allergies && student.profile.medicalInfo.allergies.length > 0 && (
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                        <h4 className="font-semibold text-gray-800 mb-3">Alergias</h4>
                        <div className="flex flex-wrap gap-2">
                          {student.profile.medicalInfo.allergies.map((allergy: string, index: number) => (
                            <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {student.profile.medicalInfo.observations && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                        <h4 className="font-semibold text-gray-800 mb-3">Observações Médicas</h4>
                        <p className="text-gray-700 whitespace-pre-line">
                          {student.profile.medicalInfo.observations}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedTab === 'notes' && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <FaBook className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Anotações do Profissional</h3>
                    <p className="text-gray-600">
                      Sistema de anotações e observações em desenvolvimento.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <FaCalendarAlt className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Atribuir Cronograma</span>
                  </div>
                </button>

                <button className="p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-colors">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FaChartLine className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Relatório de Progresso</span>
                  </div>
                </button>

                <button className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaCommentDots className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Enviar Feedback</span>
                  </div>
                </button>

                <button className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-colors">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FaFileMedical className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Registro de Sessão</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}