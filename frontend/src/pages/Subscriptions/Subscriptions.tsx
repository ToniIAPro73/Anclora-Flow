import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Table, Card, Button, Input, Column } from '../../components';
import { 
  Plus, 
  Search, 
  Repeat, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight,
  Pause,
  Play,
  CheckCircle2
} from 'lucide-react';
import { clsx } from 'clsx';
import './Subscriptions.css';

interface Subscription {
  id: string;
  name: string;
  clientName: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly' | 'quarterly';
  status: 'active' | 'paused' | 'cancelled';
  nextBillingDate: string;
}

const Subscriptions: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: subscriptions = [], isLoading } = useQuery<Subscription[]>({
    queryKey: ['subscriptions', search],
    queryFn: () => api.get<Subscription[]>('/subscriptions' + (search ? `?search=${search}` : '')),
  });

  const { data: summary } = useQuery<{ mrr: number; activeCount: number; next30DaysRevenue: number }>({
    queryKey: ['subscriptionSummary'],
    queryFn: () => api.getSubscriptionSummary(),
  });

  const columns: Column<Subscription>[] = [
    { 
      key: 'name', 
      header: 'Suscripción',
      render: (sub) => (
        <div className="ag-sub-cell">
          <span className="ag-sub-name">{sub.name}</span>
          <span className="ag-sub-client">{sub.clientName}</span>
        </div>
      )
    },
    { 
      key: 'billingCycle', 
      header: 'Ciclo',
      render: (sub) => (
        <span className="ag-sub-cycle">
          {sub.billingCycle === 'monthly' ? 'Mensual' : sub.billingCycle === 'yearly' ? 'Anual' : 'Trimestral'}
        </span>
      )
    },
    { 
      key: 'amount', 
      header: 'Importe',
      render: (sub) => <span className="ag-sub-amount">{sub.amount.toLocaleString()} €</span>
    },
    { 
      key: 'status', 
      header: 'Estado',
      render: (sub) => (
        <span className={clsx('ag-status-pill', `is-${sub.status}`)}>
          {sub.status === 'active' ? 'Activa' : sub.status === 'paused' ? 'Pausada' : 'Cancelada'}
        </span>
      )
    },
    { 
      key: 'nextBilling', 
      header: 'Próximo Cobro',
      render: (sub) => new Date(sub.nextBillingDate).toLocaleDateString()
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (sub) => (
        <div className="ag-table-actions">
          {sub.status === 'active' ? <Button variant="ghost" size="sm"><Pause size={16} /></Button> : <Button variant="ghost" size="sm"><Play size={16} /></Button>}
        </div>
      )
    }
  ];

  return (
    <div className="ag-subscriptions-page">
      <header className="ag-page-header">
        <div className="ag-page-header__title-group">
          <h1 className="ag-page-title">Suscripciones</h1>
          <p className="ag-page-subtitle">Gestiona tus ingresos recurrentes y previsiones de flujo de caja.</p>
        </div>
        <div className="ag-page-header__actions">
          <Button variant="primary" leftIcon={<Plus size={18} />}>Nueva Suscripción</Button>
        </div>
      </header>

      <div className="ag-sub-stats">
        <Card className="ag-stat-card ag-stat-card--mini">
          <div className="ag-mini-stat__content">
            <div className="ag-mini-stat__icon is-primary"><TrendingUp size={20} /></div>
            <div>
              <p className="ag-mini-stat__label">MRR (Ingreso Mensual)</p>
              <h3 className="ag-mini-stat__value">{summary?.mrr?.toLocaleString() || '0'} €</h3>
            </div>
          </div>
        </Card>
        <Card className="ag-stat-card ag-stat-card--mini">
           <div className="ag-mini-stat__content">
            <div className="ag-mini-stat__icon is-success"><CheckCircle2 size={20} /></div>
            <div>
              <p className="ag-mini-stat__label">Suscripciones Activas</p>
              <h3 className="ag-mini-stat__value">{summary?.activeCount || '0'}</h3>
            </div>
          </div>
        </Card>
        <Card className="ag-stat-card ag-stat-card--mini">
           <div className="ag-mini-stat__content">
            <div className="ag-mini-stat__icon is-warn"><Repeat size={20} /></div>
            <div>
              <p className="ag-mini-stat__label">Próximos 30 días</p>
              <h3 className="ag-mini-stat__value">{summary?.next30DaysRevenue?.toLocaleString() || '0'} €</h3>
            </div>
          </div>
        </Card>
      </div>

      <Card className="ag-sub-filters">
        <div className="ag-filters-bar">
          <Input 
            placeholder="Buscar por suscripción o cliente..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={18} />}
            className="ag-search-input"
          />
        </div>
      </Card>

      <Table 
        columns={columns} 
        data={subscriptions} 
        isLoading={isLoading}
      />
    </div>
  );
};

export default Subscriptions;
