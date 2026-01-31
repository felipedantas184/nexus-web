'use client';

import React, { forwardRef, useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  type?: 'text' | 'password' | 'email' | 'tel' | 'select' | 'date' | 'number';
  options?: { value: string; label: string }[];
  success?: boolean;
  touched?: boolean;
}

const InputField = forwardRef<any, InputFieldProps>(({
  label,
  error,
  hint,
  icon,
  suffix,
  type = 'text',
  options = [],
  className,
  success = false,
  touched = false,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={`mb-5 ${className}`}>
      <label className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
        {icon && <span className="text-gray-500">{icon}</span>}
        <span>{label}</span>
      </label>

      <div 
        className={`
          relative rounded-xl transition-all duration-200
          border-2
          ${error
            ? 'border-red-400 bg-red-50/50'
            : success && touched
              ? 'border-emerald-400 bg-emerald-50/30'
              : isFocused
                ? 'border-indigo-500 bg-white shadow-sm shadow-indigo-100'
                : 'border-gray-300 bg-gray-50/50 hover:border-gray-400'
          }
          ${isMobile ? 'py-2' : 'py-3'}
        `}
      >
        {type === 'select' ? (
          <select
            ref={ref}
            className={`
              w-full px-4 bg-transparent text-gray-900 focus:outline-none appearance-none
              ${isMobile ? 'text-base py-2' : 'text-sm'}
            `}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          >
            <option value="">Selecione...</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full px-4 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none
              ${isMobile ? 'text-base py-2' : 'text-sm'}
            `}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
        )}

        {/* Password toggle */}
        {type === 'password' && (
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-2 -mr-2"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <FaEyeSlash className="w-4 h-4" />
            ) : (
              <FaEye className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Success/Error icons */}
        {(error || (success && touched)) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {error ? (
              <FaExclamationCircle className="w-4 h-4 text-red-500" />
            ) : (
              <FaCheckCircle className="w-4 h-4 text-emerald-500" />
            )}
          </div>
        )}

        {suffix && !error && !(success && touched) && type !== 'password' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-red-600 text-sm flex items-center gap-2 bg-red-50/50 rounded-lg px-3 py-2"
        >
          <FaExclamationCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Hint message */}
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