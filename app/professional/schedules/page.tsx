// app/professional/schedules/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSchedules } from '@/hooks/useSchedules';
import { 
  FaPlus, 
  FaCalendarAlt, 
  FaEdit, 
  FaTrash, 
  FaUsers,
  FaChartLine,
  FaArchive,
  FaFilter,
  FaSearch
} from 'react-icons/fa';

export default function SchedulesPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const { schedules, loading, error, archiveSchedule, refresh } = useSchedules({
    activeOnly: filter === 'active',
    limit: 50
  });

  const filteredSchedules = schedules.filter(schedule => {
    // Filtro por status
    if (filter === 'active' && !schedule.isActive) return false;
    if (filter === 'archived' && schedule.isActive) return false;
    
    // Filtro por categoria
    if (categoryFilter !== 'all' && schedule.category !== categoryFilter) return false;
    
    // Filtro por busca
    if (search && !schedule.name.toLowerCase().includes(search.toLowerCase()) &&
        !schedule.description?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const handleArchive = async (scheduleId: string, scheduleName: string) => {
    if (window.confirm(`Tem certeza que deseja arquivar o cronograma "${scheduleName}"?`)) {
      try {
        await archiveSchedule(scheduleId);
        alert('Cronograma arquivado com sucesso!');
      } catch (err: any) {
        alert(`Erro ao arquivar: ${err.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando cronogramas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-red-700 mb-4">Erro ao carregar cronogramas: {error}</p>
          <button
            onClick={refresh}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meus Cronogramas</h1>
              <p className="text-gray-600">
                Gerencie os cronogramas terapêuticos e educacionais
              </p>
            </div>
            
            <Link
              href="/professional/schedules/new"
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700"
            >
              <FaPlus />
              Novo Cronograma
            </Link>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaCalendarAlt className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-xl font-bold">{schedules.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FaCalendarAlt className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ativos</p>
                  <p className="text-xl font-bold">
                    {schedules.filter(s => s.isActive).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FaUsers className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Categorias</p>
                  <p className="text-xl font-bold">
                    {[...new Set(schedules.map(s => s.category))].length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FaChartLine className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Atividades</p>
                  <p className="text-xl font-bold">
                    {schedules.reduce((sum, s) => sum + (s.metadata.totalActivities || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaSearch className="inline mr-2" />
                Buscar
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Buscar por nome ou descrição..."
              />
            </div>

            {/* Filtro de Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaFilter className="inline mr-2" />
                Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="archived">Arquivados</option>
              </select>
            </div>

            {/* Filtro de Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Todas</option>
                <option value="therapeutic">Terapêutico</option>
                <option value="educational">Educacional</option>
                <option value="mixed">Misto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Cronogramas */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {filteredSchedules.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FaCalendarAlt className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Nenhum cronograma encontrado
              </h3>
              <p className="text-gray-500 mb-6">
                {search || filter !== 'all' || categoryFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro cronograma'}
              </p>
              <Link
                href="/professional/schedules/new"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
              >
                <FaPlus />
                Criar Primeiro Cronograma
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSchedules.map((schedule) => (
                <div key={schedule.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {schedule.name}
                        </h3>
                        
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          schedule.category === 'therapeutic' ? 'bg-blue-100 text-blue-800' :
                          schedule.category === 'educational' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {schedule.category === 'therapeutic' ? 'Terapêutico' :
                           schedule.category === 'educational' ? 'Educacional' : 'Misto'}
                        </span>
                        
                        {!schedule.isActive && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                            Arquivado
                          </span>
                        )}
                      </div>
                      
                      {schedule.description && (
                        <p className="text-gray-600 mb-3">{schedule.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <FaCalendarAlt className="w-3.5 h-3.5" />
                          <span>Criado em {new Date(schedule.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-gray-400" />
                          <span>{schedule.metadata.totalActivities || 0} atividades</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-gray-400" />
                          <span>{schedule.metadata.estimatedWeeklyHours}h/semana</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-gray-400" />
                          <span>{schedule.activeDays.length} dias ativos</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Link
                        href={`/professional/schedules/${schedule.id}`}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Ver detalhes"
                      >
                        <FaEdit />
                      </Link>
                      
                      <Link
                        href={`/professional/schedules/${schedule.id}/assign`}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                        title="Atribuir a alunos"
                      >
                        <FaUsers />
                      </Link>
                      
                      {schedule.isActive && (
                        <button
                          onClick={() => handleArchive(schedule.id, schedule.name)}
                          className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded"
                          title="Arquivar"
                        >
                          <FaArchive />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paginação (simplificada) */}
        {filteredSchedules.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Mostrando {filteredSchedules.length} de {schedules.length} cronogramas
            </div>
            
            <div className="flex gap-2">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled
              >
                Anterior
              </button>
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}