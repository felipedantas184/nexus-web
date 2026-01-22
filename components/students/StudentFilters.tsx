'use client';

import React, { useState } from 'react';
import { 
  FaSearch, 
  FaGraduationCap, 
  FaSchool, 
  FaStar,
  FaCalendar,
  FaUserCheck,
  FaTimes
} from 'react-icons/fa';

interface StudentFiltersProps {
  onFilterChange: (filters: any) => void;
}

export default function StudentFilters({ onFilterChange }: StudentFiltersProps) {
  const [filters, setFilters] = useState({
    search: '',
    grade: 'all',
    school: 'all',
    minPoints: '',
    maxPoints: '',
    status: 'all',
    dateRange: {
      start: '',
      end: ''
    }
  });

  const grades = ['all', '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano', '1º EM', '2º EM', '3º EM'];
  const schools = ['all', 'Colégio Estadual XYZ', 'Escola Municipal ABC', 'Colégio Particular 123', 'Outra'];
  const statusOptions = [
    { value: 'all', label: 'Todos', color: 'gray' },
    { value: 'active', label: 'Ativos', color: 'green' },
    { value: 'inactive', label: 'Inativos', color: 'red' },
    { value: 'pending', label: 'Pendentes', color: 'yellow' }
  ];

  const handleFilterChange = (field: string, value: any) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      grade: 'all',
      school: 'all',
      minPoints: '',
      maxPoints: '',
      status: 'all',
      dateRange: {
        start: '',
        end: ''
      }
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-800">Filtros Avançados</h4>
        <button
          type="button"
          onClick={handleClearFilters}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <FaTimes className="w-3 h-3" />
          Limpar filtros
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Busca por Nome/Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaSearch className="inline mr-2" />
            Buscar Aluno
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Nome, email ou CPF"
          />
        </div>

        {/* Filtro por Série */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaGraduationCap className="inline mr-2" />
            Série/Ano
          </label>
          <select
            value={filters.grade}
            onChange={(e) => handleFilterChange('grade', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {grades.map(grade => (
              <option key={grade} value={grade}>
                {grade === 'all' ? 'Todas as séries' : grade}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Escola */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaSchool className="inline mr-2" />
            Escola
          </label>
          <select
            value={filters.school}
            onChange={(e) => handleFilterChange('school', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {schools.map(school => (
              <option key={school} value={school}>
                {school === 'all' ? 'Todas as escolas' : school}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaUserCheck className="inline mr-2" />
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pontuação Mínima */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaStar className="inline mr-2" />
            Pontuação Mínima
          </label>
          <input
            type="number"
            value={filters.minPoints}
            onChange={(e) => handleFilterChange('minPoints', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ex: 1000"
            min="0"
          />
        </div>

        {/* Pontuação Máxima */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaStar className="inline mr-2" />
            Pontuação Máxima
          </label>
          <input
            type="number"
            value={filters.maxPoints}
            onChange={(e) => handleFilterChange('maxPoints', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ex: 5000"
            min="0"
          />
        </div>

        {/* Data de Início */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaCalendar className="inline mr-2" />
            Data Início
          </label>
          <input
            type="date"
            value={filters.dateRange.start}
            onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Data de Fim */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaCalendar className="inline mr-2" />
            Data Fim
          </label>
          <input
            type="date"
            value={filters.dateRange.end}
            onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}