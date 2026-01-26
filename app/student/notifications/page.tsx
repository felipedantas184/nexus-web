'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NotificationService } from '@/lib/services/NotificationService';
import { 
  FaBell, 
  FaBellSlash, 
  FaMobileAlt,
  FaDesktop,
  FaClock,
  FaCalendarDay,
  FaCog,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle
} from 'react-icons/fa';

export default function NotificationsSettingsPage() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<any>(null);
  const [fcmStatus, setFcmStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [prefs, status] = await Promise.all([
        NotificationService.getUserPreferences(user!.id),
        NotificationService.checkFCMAvailability()
      ]);
      
      setPreferences(prefs);
      setFcmStatus(status);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (path: string, value: any) => {
    if (!preferences || saving) return;
    
    setSaving(true);
    try {
      // Aqui você implementaria a atualização no Firestore
      console.log('Atualizar preferência:', path, value);
      
      // Simulação - em produção, salvar no Firestore
      const newPrefs = { ...preferences };
      const keys = path.split('.');
      let current = newPrefs;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      setPreferences(newPrefs);
      
      // TODO: Salvar no Firestore
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
    } finally {
      setSaving(false);
    }
  };

  const requestFCMToken = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const token = await NotificationService.requestFCMToken(user.id);
      if (token) {
        alert('✅ Token FCM registrado com sucesso!');
        await loadData();
      } else {
        alert('❌ Não foi possível registrar token FCM');
      }
    } catch (error) {
      console.error('Erro ao registrar token:', error);
      alert('Erro ao registrar token FCM');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configurações de Notificações</h1>
          <p className="mt-2 text-gray-600">
            Configure como e quando receber lembretes das suas atividades
          </p>
        </div>

        {/* Status FCM */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaMobileAlt className="text-indigo-600" />
            Status do Firebase Cloud Messaging
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${fcmStatus?.available ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">FCM Disponível</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {fcmStatus?.available ? 
                      'Seu navegador suporta notificações push' : 
                      'Notificações push não suportadas'}
                  </p>
                </div>
                {fcmStatus?.available ? 
                  <FaCheckCircle className="w-6 h-6 text-green-600" /> : 
                  <FaTimesCircle className="w-6 h-6 text-yellow-600" />
                }
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${fcmStatus?.tokenExists ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Token Registrado</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {fcmStatus?.tokenExists ? 
                      'Seu dispositivo está registrado para push' : 
                      'Dispositivo não registrado'}
                  </p>
                </div>
                {fcmStatus?.tokenExists ? 
                  <FaCheckCircle className="w-6 h-6 text-green-600" /> : 
                  <button
                    onClick={requestFCMToken}
                    disabled={saving || !fcmStatus?.available}
                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Registrando...' : 'Registrar'}
                  </button>
                }
              </div>
            </div>
          </div>
          
          {!fcmStatus?.available && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <FaInfoCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Notificações Locais
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Como o FCM não está disponível, você receberá notificações locais quando a aplicação estiver aberta.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preferências Gerais */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FaCog className="text-gray-600" />
            Preferências Gerais
          </h2>
          
          <div className="space-y-6">
            {/* Ativar/Desativar */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Ativar Notificações</p>
                <p className="text-sm text-gray-600 mt-1">
                  Receber lembretes de atividades
                </p>
              </div>
              <button
                onClick={() => updatePreference('enabled', !preferences?.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${preferences?.enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${preferences?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            
            {/* Canais */}
            <div>
              <p className="font-medium text-gray-900 mb-3">Canais de Notificação</p>
              <div className="space-y-3">
                {[
                  { key: 'push', label: 'Push (FCM)', description: 'Notificações no dispositivo' },
                  { key: 'in_app', label: 'Na Aplicação', description: 'Alertas dentro do site' },
                  { key: 'email', label: 'E-mail', description: 'Mensagens por e-mail' },
                ].map(channel => (
                  <div key={channel.key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{channel.label}</p>
                      <p className="text-sm text-gray-600">{channel.description}</p>
                    </div>
                    <button
                      onClick={() => updatePreference(`channels.${channel.key}`, !preferences?.channels?.[channel.key])}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${preferences?.channels?.[channel.key] ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      disabled={channel.key === 'push' && !fcmStatus?.available}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${preferences?.channels?.[channel.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Horário */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <FaClock className="text-gray-500" />
                Horário Permitido
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Início
                  </label>
                  <select 
                    value={preferences?.allowedHours?.start || "08:00"}
                    onChange={(e) => updatePreference('allowedHours.start', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const hour = i + 6; // Das 6h às 17h
                      return `${hour.toString().padStart(2, '0')}:00`;
                    }).map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fim
                  </label>
                  <select 
                    value={preferences?.allowedHours?.end || "21:00"}
                    onChange={(e) => updatePreference('allowedHours.end', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const hour = i + 12; // Das 12h às 23h
                      return `${hour.toString().padStart(2, '0')}:00`;
                    }).map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Notificações só serão enviadas dentro deste horário
              </p>
            </div>
            
            {/* Dias da Semana */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <FaCalendarDay className="text-gray-500" />
                Dias da Semana
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                  <button
                    key={day}
                    onClick={() => {
                      const days = [...(preferences?.allowedDays || [])];
                      const dayIndex = days.indexOf(index);
                      
                      if (dayIndex > -1) {
                        days.splice(dayIndex, 1);
                      } else {
                        days.push(index);
                        days.sort();
                      }
                      
                      updatePreference('allowedDays', days);
                    }}
                    className={`py-2 rounded-lg text-sm font-medium ${preferences?.allowedDays?.includes(index) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Notificações só serão enviadas nos dias selecionados
              </p>
            </div>
          </div>
        </div>

        {/* Tipos de Notificação */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Tipos de Notificação
          </h2>
          
          <div className="space-y-4">
            {[
              { key: 'activity_reminder', label: 'Lembretes de Atividades', description: 'Notificações diárias das suas atividades' },
              { key: 'therapeutic_reminder', label: 'Lembretes Terapêuticos', description: 'Mensagens de apoio e acompanhamento' },
              { key: 'educational_reminder', label: 'Lembretes Educacionais', description: 'Dicas e conteúdos educativos' },
              { key: 'achievement', label: 'Conquistas', description: 'Quando você alcança uma meta ou conquista' },
              { key: 'schedule_update', label: 'Atualizações de Agenda', description: 'Mudanças na sua programação' },
              { key: 'message', label: 'Mensagens', description: 'Comunicação da equipe terapêutica' },
            ].map(type => (
              <div key={type.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{type.label}</p>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
                <button
                  onClick={() => updatePreference(`types.${type.key}`, !preferences?.types?.[type.key])}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${preferences?.types?.[type.key] ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${preferences?.types?.[type.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Configurações Terapêuticas */}
        {preferences?.therapeuticSettings && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Configurações Terapêuticas
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Evitar Notificações à Noite</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Não enviar notificações após as 20h
                  </p>
                </div>
                <button
                  onClick={() => updatePreference('therapeuticSettings.avoidEveningNotifications', !preferences?.therapeuticSettings?.avoidEveningNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${preferences?.therapeuticSettings?.avoidEveningNotifications ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${preferences?.therapeuticSettings?.avoidEveningNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Reduzir Frequência no Fim de Semana</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Menos notificações aos sábados e domingos
                  </p>
                </div>
                <button
                  onClick={() => updatePreference('therapeuticSettings.weekendReducedFrequency', !preferences?.therapeuticSettings?.weekendReducedFrequency)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${preferences?.therapeuticSettings?.weekendReducedFrequency ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${preferences?.therapeuticSettings?.weekendReducedFrequency ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Limite Diário de Notificações</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Máximo de notificações por dia
                  </p>
                </div>
                <select 
                  value={preferences?.therapeuticSettings?.maxDailyNotifications || 4}
                  onChange={(e) => updatePreference('therapeuticSettings.maxDailyNotifications', parseInt(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-1"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}