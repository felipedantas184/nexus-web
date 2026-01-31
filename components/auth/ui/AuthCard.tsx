'use client';

import React from 'react';
import { motion } from 'framer-motion';

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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      {/* Glass effect background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-3xl -z-10" />

      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full overflow-hidden border border-white/30">
        {/* Header with optional gradient */}
        {(icon || title || subtitle) && (
          <div className="p-6 md:p-8 text-center border-b border-gray-100/30 bg-gradient-to-r from-indigo-50 to-purple-50">
            {icon && (
              <div className="mb-4 flex justify-center">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, {
                    className: "text-white w-6 h-6"
                  })}
                </div>
              </div>
            )}
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

        {/* Form Content */}
        <div className="p-5 md:p-7 lg:p-8">
          <div className="space-y-5">
            {children}
          </div>
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 md:px-7 lg:px-8 py-5 bg-gray-50/50 border-t border-gray-100/50">
            <div className="text-center">
              {footer}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}