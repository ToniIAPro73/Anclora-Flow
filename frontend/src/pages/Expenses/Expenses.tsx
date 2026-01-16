import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Table, Card, Button, Input, Column } from '../../components';
import { 
  Plus, 
  Search, 
  Receipt, 
  Tag, 
  Calendar as CalendarIcon, 
  DollarSign, 
  Download,
  Filter
} from 'lucide-react';
import { clsx } from 'clsx';
import './Expenses.css';

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  expenseDate: string;
  isDeductible: boolean;
  vendor?: string;
}

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  return (
    <span className="ag-category-badge">
      <Tag size={12} />
      {category}
    </span>
  );
};

const Expenses: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['expenses', search],
    queryFn: () => api.get<Expense[]>('/expenses' + (search ? `?search=${search}` : '')),
  });

  const { data: stats } = useQuery({
    queryKey: ['expenseStats'],
    queryFn: () => api.getExpensesStatistics(),
  });

  const columns: Column<Expense>[] = [
    { 
      key: 'description', 
      header: 'Gasto / Proveedor',
      render: (exp) => (
        <div className="ag-expense-cell">
          <span className="ag-expense-desc">{exp.description}</span>
          <span className="ag-expense-vendor">{exp.vendor || 'Proveedor general'}</span>
        </div>
      )
    },
    { 
      key: 'category', 
      header: 'Categoría',
      render: (exp) => <CategoryBadge category={exp.category} />
    },
    { 
      key: 'expenseDate', 
      header: 'Fecha',
      render: (exp) => new Date(exp.expenseDate).toLocaleDateString()
    },
    { 
      key: 'amount', 
      header: 'Importe',
      render: (exp) => (
        <span className={clsx('ag-expense-amount', exp.isDeductible ? 'is-deductible' : '')}>
          {exp.amount.toLocaleString()} €
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (exp) => (
        <div className="ag-table-actions">
           {/* Actions */}
        </div>
      )
    }
  ];

  return (
    <div className="ag-expenses-page">
      <header className="ag-page-header">
        <div className="ag-page-header__title-group">
          <h1 className="ag-page-title">Gastos</h1>
          <p className="ag-page-subtitle">Controla tus gastos profesionales y optimiza tus deducciones.</p>
        </div>
        <div className="ag-page-header__actions">
          <Button variant="secondary" leftIcon={<Filter size={18} />}>Filtros</Button>
          <Button variant="primary" leftIcon={<Plus size={18} />}>Añadir Gasto</Button>
        </div>
      </header>

      <div className="ag-expenses-summary">
        <Card className="ag-mini-stat">
          <p className="ag-mini-stat__label">Total Gastos (Mes)</p>
          <h3 className="ag-mini-stat__value">2.845 €</h3>
        </Card>
        <Card className="ag-mini-stat">
          <p className="ag-mini-stat__label">Deducible Estimado</p>
          <h3 className="ag-mini-stat__value is-success">597 €</h3>
        </Card>
        <Card className="ag-mini-stat">
          <p className="ag-mini-stat__label">Categoría Principal</p>
          <h3 className="ag-mini-stat__value">Software / I+D</h3>
        </Card>
      </div>

      <Card className="ag-expenses-filters">
        <div className="ag-filters-bar">
          <Input 
            placeholder="Buscar por descripción o proveedor..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={18} />}
            className="ag-search-input"
          />
        </div>
      </Card>

      <Table 
        columns={columns} 
        data={expenses} 
        isLoading={isLoading}
        zebra
      />
    </div>
  );
};

export default Expenses;
