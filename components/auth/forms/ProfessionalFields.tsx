'use client';

import React, { useState, useEffect } from 'react';
import InputField from '../ui/InputField';
import { 
  FaUserTie, 
  FaIdCard, 
  FaBriefcaseMedical, 
  FaBuilding,
  FaUserMd,
  FaStethoscope,
  FaHeadset,
  FaGlobeAfrica
} from 'react-icons/fa';
import { formatters } from '@/lib/utils/formatters';

interface ProfessionalFieldsProps {
  register: any;
  errors: any;
  loading: boolean;
  watch?: any; // Adicionar watch para pegar valores
  setValue?: any; // Adicionar setValue para atualizar programaticamente
}

export default function ProfessionalFields({ 
  register, 
  errors, 
  loading, 
  watch, 
  setValue 
}: ProfessionalFieldsProps) {
  // Observar o valor atual do role
  const watchedRole = watch?.('role') || 'psychologist';
  const [selectedRole, setSelectedRole] = useState<string>(watchedRole);

  // Sincronizar com o valor do formulário
  useEffect(() => {
    if (setValue && watchedRole !== selectedRole) {
      setValue('role', selectedRole);
      setValue('licenseNumber', ''); // Resetar número de registro ao mudar role
    }
  }, [selectedRole, setValue, watchedRole]);

  const roles = [
    {
      value: 'psychologist',
      icon: FaUserMd,
      title: 'Psicólogo',
      description: 'Acompanhamento psicológico',
      requiresLicense: true,
      licenseLabel: 'CRP',
      licensePlaceholder: 'CRP-XX XXXXX ou XX/XXXXX'
    },
    {
      value: 'psychiatrist',
      icon: FaStethoscope,
      title: 'Psiquiatra',
      description: 'Acompanhamento psiquiátrico',
      requiresLicense: true,
      licenseLabel: 'CRM',
      licensePlaceholder: 'CRM-XX XXXXX'
    },
    {
      value: 'monitor',
      icon: FaHeadset,
      title: 'Monitor',
      description: 'Acompanhamento educacional',
      requiresLicense: false,
      licenseLabel: 'Registro Opcional',
      licensePlaceholder: 'Registro profissional (se houver)'
    },
    {
      value: 'coordinator',
      icon: FaGlobeAfrica,
      title: 'Coordenador',
      description: 'Gestão e coordenação',
      requiresLicense: false,
      licenseLabel: 'Registro Opcional',
      licensePlaceholder: 'Registro profissional (se houver)'
    }
  ];

  const currentRole = roles.find(r => r.value === selectedRole) || roles[0];

  const handleRoleClick = (roleValue: string) => {
    setSelectedRole(roleValue);
  };

  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatters.licenseNumber(e.target.value, selectedRole);
    e.target.value = formatted;
    
    // Atualizar valor no formulário se setValue estiver disponível
    if (setValue) {
      setValue('licenseNumber', formatted, { shouldValidate: true });
    }
  };

  return (
    <>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <FaUserTie className="w-3.5 h-3.5" />
          Função profissional *
        </label>
        <div className="grid grid-cols-2 gap-4">
          {roles.map((role) => (
            <div
              key={role.value}
              className={`
                border-2 rounded-xl p-4 cursor-pointer transition-all duration-200
                ${selectedRole === role.value 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-300 bg-white hover:border-indigo-300'
                }
                hover:-translate-y-1
              `}
              onClick={() => handleRoleClick(role.value)}
            >
              <div className="flex items-center gap-3">
                <div className={selectedRole === role.value ? 'text-indigo-600' : 'text-gray-500'}>
                  <role.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className={`font-semibold text-sm ${selectedRole === role.value ? 'text-indigo-600' : 'text-gray-800'}`}>
                    {role.title}
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    {role.description}
                  </div>
                </div>
                {selectedRole === role.value && (
                  <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Campo hidden para react-hook-form */}
        <input type="hidden" {...register('role')} />
      </div>

      {/* Número de Registro - Condicional */}
      <InputField
        label={currentRole.licenseLabel}
        type="text"
        icon={<FaIdCard className="w-3.5 h-3.5" />}
        placeholder={currentRole.licensePlaceholder}
        error={errors.licenseNumber?.message}
        {...register('licenseNumber', {
          onChange: handleLicenseChange,
          required: currentRole.requiresLicense ? 'Registro profissional é obrigatório' : false
        })}
        disabled={loading}
        required={currentRole.requiresLicense}
      />

      {/* Mensagem informativa para roles que não requerem registro */}
      {!currentRole.requiresLicense && selectedRole !== 'psychologist' && selectedRole !== 'psychiatrist' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 {selectedRole === 'coordinator' 
              ? 'Coordenadores não precisam de número de registro obrigatoriamente. Se você tiver, pode informar.' 
              : 'Monitores podem informar número de registro, mas não é obrigatório.'}
          </p>
        </div>
      )}

      <InputField
        label="Especialização (opcional)"
        type="text"
        icon={<FaBriefcaseMedical className="w-3.5 h-3.5" />}
        placeholder="Ex: Psicologia Infantil, Educação Especial..."
        error={errors.specialization?.message}
        {...register('specialization')}
        disabled={loading}
      />

      <InputField
        label="Instituição (opcional)"
        type="text"
        icon={<FaBuilding className="w-3.5 h-3.5" />}
        placeholder="Ex: Hospital das Clínicas, Escola Estadual..."
        error={errors.institution?.message}
        {...register('institution')}
        disabled={loading}
      />
    </>
  );
}