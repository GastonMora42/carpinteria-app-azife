// ===================================

// src/components/ui/select.tsx
import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, children, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

