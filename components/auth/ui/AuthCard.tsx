'use client';

import React from 'react';

interface AuthCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  icon?: React.ReactNode;
}

export default function AuthCard({ 
  children, 
  title, 
  subtitle, 
  footer,
  icon 
}: AuthCardProps) {
  return (
    <div 
      className="bg-white rounded-2xl shadow-2xl w-full max-w-md md:max-w-lg overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-700"
    >
      {(icon || title || subtitle) && (
        <div className="p-6 md:p-8 text-center border-b border-gray-100">
          {icon && <div className="mb-4 flex justify-center">{icon}</div>}
          {title && (
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-gray-600 text-sm md:text-base">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className="p-6 md:p-8">
        {children}
      </div>
      
      {footer && (
        <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100 text-center">
          {footer}
        </div>
      )}
    </div>
  );
}