import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Table, Card, Button, Input, Column } from '../../components';
import { 
  Plus, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Target,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import './Budget.css';

interface Budget {
  id: string;
  category: string;
  plannedAmount: number;
  actualSpent: number;
  remainingAmount: number;
  spendingRatio: number;
}

const ProgressBar: React.FC<{ ratio: number }> = ({ ratio }) => {
  const isOver = ratio > 100;
  const isWarning = ratio > 85 && ratio <= 100;

  return (
    <div className="ag-progress-container">
      <div className="ag-progress-labels">
        <span className="ag-progress-ratio">{ratio}%</span>
      </div>
      <div className="ag-progress-track">
        <div 
          className={clsx('ag-progress-bar', isOver ? 'is-danger' : isWarning ? 'is-warning' : 'is-primary')}
          style={{ width: `${Math.min(ratio, 100)}%` }}
        />
      </div>
    </div>
  );
};

const BudgetPage: React.FC = () => {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ['budgets', month],
    queryFn: () => api.get<Budget[]>(`/budgets?month=${month}`),
  });

  const { data: summary } = useQuery<{ plannedTotal: number; actualTotal: number }>({
    queryKey: ['budgetSummary', month],
    queryFn: () => api.get<{ plannedTotal: number; actualTotal: number }>(`/budgets/summary?month=${month}`),
  });

  const columns: Column<Budget>[] = [
    { key: 'category', header: 'Categoría' },
    { 
      key: 'plannedAmount', 
      header: 'Presupuesto',
      render: (b) => `${b.plannedAmount.toLocaleString()} €`
    },
    { 
      key: 'actualSpent', 
      header: 'Gastado',
      render: (b) => <span className={clsx(b.spendingRatio > 100 && 'ag-text-danger')}>{b.actualSpent.toLocaleString()} €</span>
    },
    { 
      key: 'ratio', 
      header: 'Progreso',
      width: '200px',
      render: (b) => <ProgressBar ratio={b.spendingRatio} />
    }
  ];

  return (
    <div className="ag-budget-page">
      <header className="ag-page-header">
        <div className="ag-page-header__title-group">
          <h1 className="ag-page-title">Presupuestos</h1>
          <p className="ag-page-subtitle">Planifica tus gastos y mantén el control de tus finanzas.</p>
        </div>
        <div className="ag-page-header__actions">
          <Button variant="secondary" leftIcon={<Zap size={18} />}>Sugerencias AI</Button>
          <Button variant="primary" leftIcon={<Plus size={18} />}>Nuevo Límite</Button>
        </div>
      </header>

      <div className="ag-budget-controls">
        <Card className="ag-month-picker">
          <Button variant="ghost" size="sm" onClick={() => {/* Prev month logic */}}><ChevronLeft size={20} /></Button>
          <span className="ag-current-month">{new Date(month + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
          <Button variant="ghost" size="sm" onClick={() => {/* Next month logic */}}><ChevronRight size={20} /></Button>
        </Card>
      </div>

      <div className="ag-budget-summary">
        <Card className="ag-summary-tile">
          <div className="ag-summary-tile__icon"><Target size={24} /></div>
          <div>
            <p className="ag-summary-tile__label">Total Presupuestado</p>
            <h3 className="ag-summary-tile__value">{summary?.plannedTotal?.toLocaleString() || '0'} €</h3>
          </div>
        </Card>
        <Card className="ag-summary-tile">
          <div className="ag-summary-tile__icon is-danger"><AlertTriangle size={24} /></div>
          <div>
            <p className="ag-summary-tile__label">Gastado hasta ahora</p>
            <h3 className="ag-summary-tile__value">{summary?.actualTotal?.toLocaleString() || '0'} €</h3>
          </div>
        </Card>
      </div>

      <Table 
        columns={columns} 
        data={budgets} 
        isLoading={isLoading}
      />
    </div>
  );
};

export default BudgetPage;
