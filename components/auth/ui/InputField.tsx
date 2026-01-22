// components/auth/ui/InputField.tsx
'use client';

import React, { forwardRef } from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(({
  label,
  error,
  hint,
  icon,
  suffix,
  className,
  ...props
}, ref) => {
  return (
    <div className={`mb-6 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        {icon}
        {label}
      </label>
      
      <div className={`
        relative border rounded-lg transition-all duration-200
        ${error 
          ? 'border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-200' 
          : 'border-gray-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200'
        }
      `}>
        <input
          ref={ref}
          className="w-full px-4 py-3 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none"
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-red-600 text-sm flex items-center gap-2">
          <span>⚠️</span>
          {error}
        </div>
      )}
      
      {hint && !error && (
        <p className="mt-2 text-gray-500 text-xs">
          {hint}
        </p>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';

export default InputField;