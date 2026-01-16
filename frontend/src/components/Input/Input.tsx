import React from 'react';
import { clsx } from 'clsx';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  className,
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  id,
  type = 'text',
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={clsx('ag-input-container', className)}>
      {label && (
        <label htmlFor={inputId} className="ag-input-label">
          {label}
        </label>
      )}
      <div className={clsx('ag-input-wrapper', error && 'is-error')}>
        {leftIcon && <span className="ag-input-icon ag-input-icon--left">{leftIcon}</span>}
        <input
          id={inputId}
          className={clsx('ag-input-field', leftIcon && 'has-left-icon', rightIcon && 'has-right-icon')}
          type={type}
          {...props}
        />
        {rightIcon && <span className="ag-input-icon ag-input-icon--right">{rightIcon}</span>}
      </div>
      {(error || helperText) && (
        <p className={clsx('ag-input-hint', error ? 'is-error' : 'is-helper')}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
