// components/activities/QuizActivity.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ActivityProgress, QuizActivityConfig } from '@/types/schedule';
import { FaQuestionCircle, FaCheck, FaRedo } from 'react-icons/fa';
import { ProgressService } from '@/lib/services/ProgressService';

interface QuizActivityProps {
  activity: {
    config: QuizActivityConfig;
    instructions: string;
  };
  progress: ActivityProgress;
  readOnly: boolean;
  onComplete: (data?: any) => Promise<void>;
  onSkip: (reason?: string) => Promise<void>;
}

type Answer = string | string[];

export default function QuizActivity({
  activity,
  progress,
  readOnly,
  onComplete,
  onSkip
}: QuizActivityProps) {
  const config = activity.config as QuizActivityConfig;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [attempt, setAttempt] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    passed: boolean;
  } | null>(null);

  // Carregar tentativa anterior se existir
  useEffect(() => {
    if (progress.attempts && progress.attempts.length > 0) {
      const latestAttempt = progress.attempts[progress.attempts.length - 1];
      setAttempt(latestAttempt.attemptNumber + 1);
      setAnswers(latestAttempt.answers || {});
      
      if (progress.status === 'completed') {
        // Já completado - mostrar resultados
        setQuizResult({
          score: latestAttempt.score || 0,
          totalQuestions: config.questions.length,
          correctAnswers: Math.floor((latestAttempt.score || 0) * config.questions.length / 100),
          passed: (latestAttempt.score || 0) >= config.passingScore
        });
      }
    }
  }, [progress, config.questions.length, config.passingScore]);

  const handleAnswerChange = (questionId: string, value: Answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitQuiz = async () => {
    if (readOnly) return;
    
    setIsSubmitting(true);
    try {
      const result = await ProgressService.submitQuizAnswers(
        progress.id,
        progress.studentId,
        answers,
        attempt
      );
      
      setQuizResult(result);
      
      if (result.passed) {
        // onComplete será chamado pelo ProgressService
      }
    } catch (error) {
      console.error('Erro ao submeter quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    if (config.maxAttempts && attempt >= config.maxAttempts) {
      alert('Você atingiu o número máximo de tentativas');
      return;
    }
    
    setAttempt(prev => prev + 1);
    setAnswers({});
    setQuizResult(null);
    setCurrentQuestion(0);
  };

  const handleSkip = async () => {
    if (readOnly) return;
    
    const reason = prompt('Por que você está pulando este quiz? (opcional)');
    await onSkip(reason || undefined);
  };

  const isCompleted = progress.status === 'completed';
  const canRetry = !config.maxAttempts || attempt < config.maxAttempts;

  if (quizResult) {
    return (
      <div className="space-y-6">
        <div className={`p-6 rounded-xl ${
          quizResult.passed 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              quizResult.passed ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              <FaQuestionCircle className={`w-8 h-8 ${
                quizResult.passed ? 'text-green-600' : 'text-yellow-600'
              }`} />
            </div>
            
            <h3 className="text-xl font-bold mb-2">
              {quizResult.passed ? '🎉 Quiz Aprovado!' : '📝 Quiz Reprovado'}
            </h3>
            
            <div className="text-3xl font-bold mb-2">
              {quizResult.score}%
            </div>
            
            <p className="text-gray-600 mb-4">
              {quizResult.correctAnswers} de {quizResult.totalQuestions} questões corretas
            </p>
            
            <p className="text-sm mb-4">
              Pontuação mínima: {config.passingScore}%
            </p>
            
            {!quizResult.passed && canRetry && !isCompleted && (
              <button
                onClick={handleRetry}
                className="mt-4 bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2 mx-auto"
              >
                <FaRedo />
                Tentar Novamente ({attempt}/{config.maxAttempts || '∞'})
              </button>
            )}
          </div>
        </div>

        {/* Revisão das questões */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700">Revisão das Questões</h4>
          {config.questions.map((question, index) => (
            <div key={question.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-gray-800">
                  Questão {index + 1}: {question.question}
                </div>
                <div className={`text-sm px-2 py-1 rounded ${
                  JSON.stringify(answers[question.id]) === JSON.stringify(question.correctAnswer)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {JSON.stringify(answers[question.id]) === JSON.stringify(question.correctAnswer)
                    ? '✓ Correta'
                    : '✗ Incorreta'}
                </div>
              </div>
              
              <div className="mt-2 space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Sua resposta:</span>
                  <p className="font-medium">
                    {Array.isArray(answers[question.id]) 
                      ? (answers[question.id] as string[]).join(', ')
                      : answers[question.id] || 'Não respondida'}
                  </p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Resposta correta:</span>
                  <p className="font-medium text-green-700">
                    {Array.isArray(question.correctAnswer)
                      ? question.correctAnswer.join(', ')
                      : question.correctAnswer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <FaQuestionCircle className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-indigo-800 mb-1">Quiz</h3>
            <p className="text-indigo-700">
              {activity.instructions}
            </p>
            
            <div className="mt-3 space-y-1">
              <p className="text-sm text-indigo-600">
                • {config.questions.length} questões
              </p>
              <p className="text-sm text-indigo-600">
                • Pontuação mínima: {config.passingScore}%
              </p>
              {config.maxAttempts && (
                <p className="text-sm text-indigo-600">
                  • Tentativas: {attempt}/{config.maxAttempts}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navegação de questões */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {config.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                currentQuestion === index
                  ? 'bg-indigo-600 text-white'
                  : answers[config.questions[index].id]
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
        
        <div className="text-sm text-gray-500">
          Questão {currentQuestion + 1} de {config.questions.length}
        </div>
      </div>

      {/* Questão atual */}
      <div className="border rounded-xl p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {config.questions[currentQuestion].question}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Tipo: {
              config.questions[currentQuestion].type === 'multiple_choice' ? 'Múltipla Escolha' :
              config.questions[currentQuestion].type === 'true_false' ? 'Verdadeiro/Falso' :
              'Resposta Curta'
            } • {config.questions[currentQuestion].points} ponto{config.questions[currentQuestion].points !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-3">
          {config.questions[currentQuestion].type === 'multiple_choice' && 
           config.questions[currentQuestion].options?.map((option, index) => (
            <label key={index} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name={`question-${config.questions[currentQuestion].id}`}
                value={option}
                checked={answers[config.questions[currentQuestion].id] === option}
                onChange={(e) => handleAnswerChange(
                  config.questions[currentQuestion].id, 
                  e.target.value
                )}
                className="mr-3"
                disabled={readOnly || progress.status !== 'in_progress'}
              />
              <span>{option}</span>
            </label>
          ))}

          {config.questions[currentQuestion].type === 'true_false' && (
            <div className="grid grid-cols-2 gap-3">
              {['Verdadeiro', 'Falso'].map((option) => (
                <label key={option} className="flex items-center justify-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${config.questions[currentQuestion].id}`}
                    value={option}
                    checked={answers[config.questions[currentQuestion].id] === option}
                    onChange={(e) => handleAnswerChange(
                      config.questions[currentQuestion].id, 
                      e.target.value
                    )}
                    className="mr-2"
                    disabled={readOnly || progress.status !== 'in_progress'}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}

          {config.questions[currentQuestion].type === 'short_answer' && (
            <textarea
              value={answers[config.questions[currentQuestion].id] as string || ''}
              onChange={(e) => handleAnswerChange(
                config.questions[currentQuestion].id, 
                e.target.value
              )}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Digite sua resposta..."
              disabled={readOnly || progress.status !== 'in_progress'}
            />
          )}
        </div>
      </div>

      {/* Navegação e ações */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Anterior
        </button>
        
        <div className="flex gap-3">
          {currentQuestion < config.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(prev => Math.min(config.questions.length - 1, prev + 1))}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Próxima
            </button>
          ) : (
            <button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting || Object.keys(answers).length !== config.questions.length}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando...' : 'Finalizar Quiz'}
            </button>
          )}
        </div>
      </div>

      {/* Status das respostas */}
      <div className="text-sm text-gray-500">
        {Object.keys(answers).length} de {config.questions.length} questões respondidas
      </div>

      {!readOnly && progress.status === 'in_progress' && (
        <div className="pt-4 border-t">
          <button
            onClick={handleSkip}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Pular Quiz
          </button>
        </div>
      )}
    </div>
  );
}