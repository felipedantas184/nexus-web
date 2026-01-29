'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWeeklyReset } from '@/hooks/useWeeklyReset';
import { 
  FaSync, 
  FaCalendarCheck, 
  FaExclamationTriangle, 
  FaCheck, 
  FaClock,
  FaUsers,
  FaDatabase,
  FaHistory,
  FaRocket
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function WeeklyResetPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [confirmReset, setConfirmReset] = useState(false);
  
  const { 
    loading, 
    error, 
    result, 
    executeFullWeeklyReset, // NOVO MÉTODO
    canExecute 
  } = useWeeklyReset();

  // Redirecionar se não for coordenador
  if (user && user.role !== 'coordinator') {
    router.push('/professional/dashboard');
    return null;
  }

  const handleExecuteReset = async () => {
    if (!confirmReset) {
      alert('Por favor, confirme que deseja executar o reset semanal');
      return;
    }
    
    const confirmed = window.confirm(
      'ATENÇÃO: Esta ação irá:\n' +
      '1. Gerar snapshots de todas as semanas que terminaram\n' +
      '2. Incrementar a semana de todos os cronogramas ativos\n' +
      '3. Gerar novas atividades para a próxima semana\n' +
      '4. Zerar o progresso atual\n\n' +
      'Esta ação NÃO PODE ser desfeita. Continuar?'
    );
    
    if (!confirmed) return;
    
    try {
      await executeFullWeeklyReset();
      setConfirmReset(false); // Resetar confirmação
    } catch (err) {
      // Erro já é tratado pelo hook
    }
  };

  // Formatar resultado para exibição
  const formatResult = (result: any) => {
    if (!result) return null;
    
    return {
      total: result.totalInstances,
      processed: result.processed,
      successful: result.successful,
      failed: result.failed,
      snapshots: result.snapshotsGenerated,
      completionRate: result.totalInstances > 0 
        ? Math.round((result.successful / result.totalInstances) * 100) 
        : 0
    };
  };

  const formattedResult = result ? formatResult(result) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Reset Semanal - Coordenador
          </h1>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Execute o reset semanal manualmente. Esta ação é equivalente ao que a Cloud Function faria 
            automaticamente às <span className="font-semibold text-indigo-600">00:01 de toda segunda-feira</span>.
          </p>
        </div>

        {/* Cards de Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                <FaUsers className="text-indigo-600 text-2xl" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {formattedResult?.total || 0}
                </div>
                <div className="text-sm text-gray-500">Instâncias Totais</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                <FaCheck className="text-emerald-600 text-2xl" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {formattedResult?.successful || 0}
                </div>
                <div className="text-sm text-gray-500">Resetados com Sucesso</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                <FaExclamationTriangle className="text-red-600 text-2xl" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {formattedResult?.failed || 0}
                </div>
                <div className="text-sm text-gray-500">Falhas</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <FaDatabase className="text-blue-600 text-2xl" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {formattedResult?.snapshots || 0}
                </div>
                <div className="text-sm text-gray-500">Snapshots Gerados</div>
              </div>
            </div>
          </div>
        </div>

        {/* Painel Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          
          {/* Coluna Esquerda: Controle */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FaRocket className="text-white text-xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Executar Reset Semanal</h2>
                  <p className="text-gray-600">Processo completo em uma única ação</p>
                </div>
              </div>

              {/* Lista de Ações */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Gerar Snapshots</div>
                    <div className="text-sm text-gray-600">Salva o progresso da semana que terminou</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">2</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Incrementar Semanas</div>
                    <div className="text-sm text-gray-600">Avança para a próxima semana em todos os cronogramas</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">3</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Gerar Novas Atividades</div>
                    <div className="text-sm text-gray-600">Cria atividades para a nova semana</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">4</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Zerar Progresso</div>
                    <div className="text-sm text-gray-600">Prepara para a nova semana (mantém streak)</div>
                  </div>
                </div>
              </div>

              {/* Confirmação */}
              <div className="mb-8">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="confirmReset"
                    checked={confirmReset}
                    onChange={(e) => setConfirmReset(e.target.checked)}
                    className="mt-1 w-5 h-5 text-indigo-600 rounded"
                  />
                  <label htmlFor="confirmReset" className="text-gray-700">
                    <span className="font-medium">Confirmo que entendi as consequências</span>
                    <p className="text-sm text-gray-600 mt-1">
                      Esta ação modificará dados de todos os alunos ativos. 
                      Recomendado executar apenas às segundas-feiras pela manhã.
                    </p>
                  </label>
                </div>
              </div>

              {/* Botão de Ação */}
              <button
                onClick={handleExecuteReset}
                disabled={loading || !confirmReset}
                className={`
                  w-full py-4 px-6 rounded-xl text-lg font-semibold
                  flex items-center justify-center gap-3
                  transition-all duration-300
                  ${loading || !confirmReset
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                  }
                `}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <FaSync />
                    EXECUTAR RESET SEMANAL COMPLETO
                  </>
                )}
              </button>

              {/* Status */}
              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <FaExclamationTriangle />
                    <span className="font-semibold">Erro</span>
                  </div>
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {formattedResult && !loading && !error && (
                <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 text-emerald-700 mb-4">
                    <FaCalendarCheck className="text-xl" />
                    <span className="text-xl font-bold">Reset Concluído com Sucesso!</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-2xl font-bold text-emerald-700">
                        {formattedResult.successful}/{formattedResult.total}
                      </div>
                      <div className="text-sm text-emerald-600">Instâncias Processadas</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-2xl font-bold text-emerald-700">
                        {formattedResult.completionRate}%
                      </div>
                      <div className="text-sm text-emerald-600">Taxa de Sucesso</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-emerald-200">
                    <div className="text-sm text-emerald-700">
                      ⏱️ Próximo reset automático: <span className="font-semibold">Próxima segunda-feira 00:01</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita: Informações */}
          <div className="space-y-6">
            {/* Card: Quando Executar */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaClock className="text-indigo-600" />
                Quando Executar
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                  <span className="text-gray-700">
                    <span className="font-semibold">Ideal:</span> Segundas-feiras 00:01
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                  <span className="text-gray-700">
                    <span className="font-semibold">Alternativo:</span> Segundas pela manhã
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                  <span className="text-gray-700">
                    <span className="font-semibold">Teste:</span> Qualquer momento (com cuidado)
                  </span>
                </li>
              </ul>
            </div>

            {/* Card: O que Acontece */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaHistory className="text-indigo-600" />
                O que Acontece
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="font-medium text-gray-900">Para Alunos:</div>
                  <ul className="text-sm text-gray-600 ml-4 list-disc">
                    <li>Progresso da semana anterior salvo</li>
                    <li>Nova semana iniciada</li>
                    <li>Novas atividades disponíveis</li>
                    <li>Streak mantido</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Para Profissionais:</div>
                  <ul className="text-sm text-gray-600 ml-4 list-disc">
                    <li>Dados históricos preservados</li>
                    <li>Relatórios atualizados</li>
                    <li>Alertas para quedas de performance</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Card: Links Úteis */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Links Úteis
              </h3>
              <div className="space-y-3">
                <a 
                  href="/debug/weekly-reset" 
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
                >
                  <FaSync className="text-sm" />
                  Página de Debug (Testes Individuais)
                </a>
                <a 
                  href="/professional/analytics" 
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
                >
                  <FaDatabase className="text-sm" />
                  Ver Snapshots Gerados
                </a>
                <a 
                  href="/professional/students" 
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
                >
                  <FaUsers className="text-sm" />
                  Gerenciar Alunos
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé Informativo */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-indigo-900 mb-3">
            Próximos Passos - Sprint 2
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="font-medium text-gray-900 mb-2">Cloud Function</div>
              <div className="text-sm text-gray-600">
                Automatizar o processo para rodar toda segunda 00:01
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="font-medium text-gray-900 mb-2">UI para Alunos</div>
              <div className="text-sm text-gray-600">
                Alunos verem histórico de semanas anteriores
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="font-medium text-gray-900 mb-2">Relatórios Avançados</div>
              <div className="text-sm text-gray-600">
                Comparativo entre semanas e tendências
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}