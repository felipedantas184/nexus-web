'use client';

import React, { useState, useEffect } from 'react';
import {
  FaTimes,
  FaArrowRight,
  FaArrowLeft,
  FaCheck,
  FaClipboardCheck,
  FaHeartbeat
} from 'react-icons/fa';
import { useGAD7Assessment } from '@/hooks/useGAD7Assessment';

interface GAD7ModalProps {
  onComplete?: () => void;
}

export default function GAD7Modal({ onComplete }: GAD7ModalProps) {
  const {
    needsAssessment,
    saveAssessment,
    markForLater,
    questions,
    setNeedsAssessment
  } = useGAD7Assessment();

  const [currentStep, setCurrentStep] = useState(0); // 0 = intro, 1-7 = perguntas, 8 = obrigado
  const [responses, setResponses] = useState<Record<number, 0 | 1 | 2 | 3>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Reset ao abrir
  useEffect(() => {
    if (needsAssessment) {
      setCurrentStep(0);
      setResponses({});
      setIsAnimating(false);
    }
  }, [needsAssessment]);

  const handleResponse = (questionId: number, value: 0 | 1 | 2 | 3) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Avança automaticamente após responder (exceto última pergunta)
    if (currentStep < questions.length) {
      setTimeout(() => {
        handleNext();
      }, 300);
    }
  };

  const handleNext = () => {
    if (currentStep <= questions.length) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleComplete = async () => {
    if (Object.keys(responses).length !== questions.length) {
      alert('Por favor, responda todas as perguntas antes de continuar.');
      return;
    }

    setSubmitting(true);
    try {
      await saveAssessment(responses);
      setCurrentStep(questions.length + 1); // Tela de obrigado
      setTimeout(() => {
        setNeedsAssessment(false);
        onComplete?.();
      }, 2000);
    } catch (error) {
      console.error('Erro:', error);
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (confirm('Você pode preencher mais tarde. Deseja realmente pular?')) {
      markForLater();
      setNeedsAssessment(false);
    }
  };

  const handleClose = () => {
    markForLater();
    setNeedsAssessment(false);
  };

  if (!needsAssessment) return null;

  // Componente de Progresso
  const ProgressDots = () => {
    const totalSteps = questions.length + 1; // +1 para tela inicial
    return (
      <div className="flex justify-center gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentStep
                ? 'bg-blue-600 w-6'
                : index < currentStep
                  ? 'bg-blue-400'
                  : 'bg-gray-300'
              }`}
          />
        ))}
      </div>
    );
  };

  // Renderizar conteúdo baseado no step
  const renderContent = () => {
    // Tela de Introdução (Step 0)
    if (currentStep === 0) {
      return (
        <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-15 h-15 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-6">
              <FaHeartbeat className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-l font-bold text-gray-900">
              Avaliação Semanal de Bem-Estar
            </h3>
            <p className="text-gray-600 mb-6">
              Vamos entender como você tem se sentido na última semana.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <div>
                <div className="font-medium text-blue-900">Menos de 2 minutos</div>
                <div className="text-sm text-blue-700">Para completar</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <span className="text-purple-600 font-bold">👁️</span>
              </div>
              <div>
                <div className="font-medium text-purple-900">Totalmente confidencial</div>
                <div className="text-sm text-purple-700">Somente sua equipe terá acesso</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Telas de Perguntas (Steps 1-7)
    if (currentStep >= 1 && currentStep <= questions.length) {
      const question = questions[currentStep - 1];
      const hasAnswer = responses[question.id] !== undefined;

      return (
        <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
          <div className="text-justify mb-4">
            <p className="text-gray-500 text">
              Nas últimas 2 semanas, com que frequência você ficou incomodado(a) por: 
              <strong className='font-semibold text-gray-900 '> {question.question}?</strong>
            </p>
          </div>

          <div className="mb-8">
            <div className="space-y-3">
              {question.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleResponse(question.id, option.value as 0 | 1 | 2 | 3)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${responses[question.id] === option.value
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                    </div>
                    {responses[question.id] === option.value && (
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                        <FaCheck className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navegação entre perguntas */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
            >
              <FaArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </button>

            <div className="text-sm text-gray-500">
              {hasAnswer ? '✓ Respondida' : 'Selecione uma opção'}
            </div>

            <button
              onClick={handleNext}
              disabled={!hasAnswer || currentStep === questions.length}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${!hasAnswer || currentStep === questions.length
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                }`}
            >
              <span className="hidden sm:inline">Próxima</span>
              <FaArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    // Tela Final (Step 8)
    if (currentStep === questions.length + 1) {
      return (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl mb-6">
            <FaCheck className="w-12 h-12 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Avaliação Concluída!
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Obrigado por compartilhar como você se sente.
            Suas respostas ajudarão no seu acompanhamento.
          </p>
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
            <p className="text-emerald-700 font-medium">
              Retornando ao dashboard em instantes...
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay com blur */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Container que força o modal ficar no topo */}
      <div className="relative min-h-screen flex items-start justify-center p-4">
        {/* Modal Principal */}
        <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md mt-4">
          {/* Header fixo */}
          <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                  <FaClipboardCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {currentStep === 0 ? 'Avaliação Semanal' :
                      currentStep <= questions.length ? `GAD-7 (${currentStep}/${questions.length})` :
                        'Concluído'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {currentStep === 0 ? 'Questionário de bem-estar' :
                      currentStep <= questions.length ? 'Monitoramento de ansiedade' :
                        'Obrigado pela participação'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Progresso visual */}
            <div className="mt-4">
              <ProgressDots />
            </div>
          </div>

          {/* Conteúdo com scroll suave */}
          <div className="p-4 max-h-[70vh] overflow-y-auto">
            {renderContent()}
          </div>

          {/* Footer com ações principais */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
            {currentStep === 0 && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <span>Começar Avaliação</span>
                  <FaArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleSkip}
                  className="w-full py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Fazer mais tarde
                </button>
              </div>
            )}

            {currentStep > 0 && currentStep <= questions.length && (
              <div className="flex justify-between items-center">
                <button
                  onClick={handleSkip}
                  className="px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Pular
                </button>

                {currentStep === questions.length && (
                  <button
                    onClick={handleComplete}
                    disabled={submitting || Object.keys(responses).length !== questions.length}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${Object.keys(responses).length === questions.length && !submitting
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enviando...
                      </span>
                    ) : (
                      'Finalizar Avaliação'
                    )}
                  </button>
                )}
              </div>
            )}

            {currentStep === questions.length + 1 && (
              <div className="text-center">
                <div className="animate-pulse">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                </div>
                <p className="text-sm text-gray-500">
                  Redirecionando...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}