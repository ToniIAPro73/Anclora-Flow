import React from 'react';
import { clsx } from 'clsx';
import './Card.css';

export interface CardProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  subtitle,
  headerActions,
  footer,
  onClick
}) => {
  const isClickable = !!onClick;

  return (
    <div 
      className={clsx(
        'ag-card', 
        isClickable && 'ag-card--clickable',
        className
      )}
      onClick={onClick}
    >
      {(title || subtitle || headerActions) && (
        <div className="ag-card__header">
          <div className="ag-card__title-group">
            {title && <h3 className="ag-card__title">{title}</h3>}
            {subtitle && <p className="ag-card__subtitle">{subtitle}</p>}
          </div>
          {headerActions && <div className="ag-card__actions">{headerActions}</div>}
        </div>
      )}
      <div className="ag-card__body">{children}</div>
      {footer && <div className="ag-card__footer">{footer}</div>}
    </div>
  );
};

export default Card;
