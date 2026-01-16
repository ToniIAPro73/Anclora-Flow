import React from 'react';
import { clsx } from 'clsx';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}) => {
  return (
    <button
      className={clsx(
        'ag-button',
        `ag-button--${variant}`,
        `ag-button--${size}`,
        isLoading && 'is-loading',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="ag-button__spinner" aria-hidden="true">
          {/* Simple CSS spinner managed in CSS */}
        </span>
      )}
      {!isLoading && leftIcon && <span className="ag-button__icon ag-button__icon--left">{leftIcon}</span>}
      <span className="ag-button__text">{children}</span>
      {!isLoading && rightIcon && <span className="ag-button__icon ag-button__icon--right">{rightIcon}</span>}
    </button>
  );
};

export default Button;
