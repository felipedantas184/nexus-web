'use client';

import React, { useState } from 'react';
import { CreateScheduleDTO } from '@/types/schedule';
import {
  FaSave,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaClock,
  FaStar,
  FaListUl
} from 'react-icons/fa';

interface ScheduleConfirmationProps {
  onCancel?: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  isEditing: boolean;
  formData: CreateScheduleDTO;
}

export default function ScheduleConfirmation({
  onCancel,
  onSubmit,
  isSubmitting,
  isEditing,
  formData
}: ScheduleConfirmationProps) {
  const [showValidation, setShowValidation] = useState(false);

  // Calcular estatísticas
  const totalActivities = formData.activities.length;
  const totalDuration = formData.activities.reduce((sum, act) =>
    sum + (act.metadata.estimatedDuration || 0), 0
  );
  const totalPoints = formData.activities.reduce((sum, act) =>
    sum + (act.scoring.pointsOnCompletion || 0), 0
  );
  const requiredActivities = formData.activities.filter(act => act.scoring.isRequired).length;

  // Validações
  const validations = {
    hasName: formData.name.trim().length > 0,
    hasActiveDays: formData.activeDays.length > 0,
    hasActivities: totalActivities > 0,
    hasStartDate: new Date(formData.startDate).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)
  };

  const isValid = Object.values(validations).every(v => v);

  const dayLabels: Record<number, string> = {
    0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua',
    4: 'Qui', 5: 'Sex', 6: 'Sáb'
  };

  const handleSubmit = async () => {
    if (!isValid) {
      setShowValidation(true);
      return;
    }

    await onSubmit();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isValid
                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                : 'bg-gradient-to-r from-amber-500 to-orange-600'
              }`}>
              <FaCheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Confirmação do Cronograma
              </h2>
              <p className="text-gray-600 text-sm">
                {isValid
                  ? 'Tudo pronto! Revise e salve seu cronograma'
                  : 'Complete as informações necessárias antes de salvar'}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${isValid
              ? 'bg-green-100 text-green-800'
              : 'bg-amber-100 text-amber-800'
            }`}>
            {isValid ? 'Pronto para salvar' : 'Aguardando informações'}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna 1: Resumo */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Resumo do Cronograma</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FaListUl className="w-5 h-5 text-indigo-500" />
                  <div>
                    <div className="font-medium text-gray-800">Atividades</div>
                    <div className="text-sm text-gray-500">
                      {requiredActivities} obrigatória{requiredActivities !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {totalActivities}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FaClock className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-medium text-gray-800">Tempo Total</div>
                    <div className="text-sm text-gray-500">
                      Distribuído em {formData.activeDays.length} dias
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {(totalDuration / 60).toFixed(1)}h
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FaStar className="w-5 h-5 text-amber-500" />
                  <div>
                    <div className="font-medium text-gray-800">Pontuação Total</div>
                    <div className="text-sm text-gray-500">
                      Média por atividade: {totalPoints > 0 ? Math.round(totalPoints / totalActivities) : 0}pts
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {totalPoints}pts
                </div>
              </div>
            </div>

            {/* Dias Ativos */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Dias Ativos</h4>
              <div className="flex flex-wrap gap-2">
                {formData.activeDays.map(dayId => (
                  <div
                    key={dayId}
                    className="px-3 py-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-lg font-medium"
                  >
                    {dayLabels[dayId]}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna 2: Validações e Ações */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Validações</h3>

            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-lg ${validations.hasName
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-amber-50 border border-amber-200'
                }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${validations.hasName
                    ? 'bg-green-100 text-green-600'
                    : 'bg-amber-100 text-amber-600'
                  }`}>
                  {validations.hasName ? '✓' : '!'}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">Nome do cronograma</div>
                  <div className="text-sm text-gray-500">
                    {validations.hasName
                      ? `"${formData.name}"`
                      : 'Um nome é obrigatório'}
                  </div>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-lg ${validations.hasActiveDays
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-amber-50 border border-amber-200'
                }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${validations.hasActiveDays
                    ? 'bg-green-100 text-green-600'
                    : 'bg-amber-100 text-amber-600'
                  }`}>
                  {validations.hasActiveDays ? '✓' : '!'}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">Dias da semana</div>
                  <div className="text-sm text-gray-500">
                    {validations.hasActiveDays
                      ? `${formData.activeDays.length} dia${formData.activeDays.length !== 1 ? 's' : ''} selecionado${formData.activeDays.length !== 1 ? 's' : ''}`
                      : 'Selecione pelo menos um dia'}
                  </div>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-lg ${validations.hasActivities
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-amber-50 border border-amber-200'
                }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${validations.hasActivities
                    ? 'bg-green-100 text-green-600'
                    : 'bg-amber-100 text-amber-600'
                  }`}>
                  {validations.hasActivities ? '✓' : '!'}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">Atividades adicionadas</div>
                  <div className="text-sm text-gray-500">
                    {validations.hasActivities
                      ? `${totalActivities} atividade${totalActivities !== 1 ? 's' : ''} configurada${totalActivities !== 1 ? 's' : ''}`
                      : 'Adicione pelo menos uma atividade'}
                  </div>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-lg ${validations.hasStartDate
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-amber-50 border border-amber-200'
                }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${validations.hasStartDate
                    ? 'bg-green-100 text-green-600'
                    : 'bg-amber-100 text-amber-600'
                  }`}>
                  {validations.hasStartDate ? '✓' : '!'}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">Data de início</div>
                  <div className="text-sm text-gray-500">
                    {validations.hasStartDate
                      ? formData.startDate.toLocaleDateString('pt-BR')
                      : 'Data deve ser hoje ou futura'}
                  </div>
                </div>
              </div>
            </div>

            {/* Mensagem de Validação */}
            {showValidation && !isValid && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <FaExclamationTriangle className="w-5 h-5 text-red-500" />
                  <div>
                    <div className="font-medium text-red-800">
                      Complete as informações necessárias
                    </div>
                    <div className="text-sm text-red-600">
                      Corrija os itens marcados com "!" antes de salvar
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 flex-1"
                  >
                    <FaTimes className="w-4 h-4" />
                    Cancelar
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isValid}
                  className={`px-8 py-3 font-medium rounded-xl transition-all shadow hover:shadow-lg flex items-center justify-center gap-2 flex-1 ${isValid
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    } ${!onCancel ? 'col-span-2' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <FaSave className="w-4 h-4" />
                      {isEditing ? 'Atualizar Cronograma' : 'Salvar Cronograma'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}