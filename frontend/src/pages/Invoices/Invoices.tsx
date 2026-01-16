import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Table, Card, Button, Input, Column } from '../../components';
import { 
  Plus, 
  Search, 
  FileText, 
  MoreHorizontal, 
  Download, 
  Eye, 
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { clsx } from 'clsx';
import './Invoices.css';

interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  verifactuStatus?: string;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    paid: { label: 'Pagada', icon: <CheckCircle size={12} />, className: 'is-paid' },
    sent: { label: 'Enviada', icon: <FileText size={12} />, className: 'is-sent' },
    overdue: { label: 'Vencida', icon: <AlertCircle size={12} />, className: 'is-overdue' },
    draft: { label: 'Borrador', icon: <Clock size={12} />, className: 'is-draft' },
  };

  const config = configs[status] || { label: status, icon: null, className: '' };

  return (
    <span className={clsx('ag-status-badge', config.className)}>
      {config.icon}
      {config.label}
    </span>
  );
};

const Invoices: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices', search],
    queryFn: () => api.get<Invoice[]>('/invoices' + (search ? `?search=${search}` : '')),
  });

  const columns: Column<Invoice>[] = [
    { 
      key: 'number', 
      header: 'Factura',
      render: (inv) => (
        <div className="ag-invoice-cell">
          <span className="ag-invoice-number">{inv.number}</span>
          <span className="ag-invoice-date">{new Date(inv.issueDate).toLocaleDateString()}</span>
        </div>
      )
    },
    { 
      key: 'clientName', 
      header: 'Cliente',
      render: (inv) => inv.clientName
    },
    { 
      key: 'total', 
      header: 'Total',
      render: (inv) => <span className="ag-invoice-total">{inv.total.toLocaleString()} €</span>
    },
    { 
      key: 'status', 
      header: 'Estado',
      render: (inv) => <StatusBadge status={inv.status} />
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      render: (inv) => (
        <div className="ag-table-actions">
          <Button variant="ghost" size="sm" className="ag-action-btn"><Eye size={16} /></Button>
          <Button variant="ghost" size="sm" className="ag-action-btn"><Download size={16} /></Button>
          <Button variant="ghost" size="sm" className="ag-action-btn"><MoreHorizontal size={16} /></Button>
        </div>
      )
    }
  ];

  return (
    <div className="ag-invoices-page">
      <header className="ag-page-header">
        <div className="ag-page-header__title-group">
          <h1 className="ag-page-title">Facturas</h1>
          <p className="ag-page-subtitle">Gestiona tu facturación y el cumplimiento con Verifactu.</p>
        </div>
        <div className="ag-page-header__actions">
          <Button variant="secondary" leftIcon={<Download size={18} />}>Exportar</Button>
          <Button variant="primary" leftIcon={<Plus size={18} />}>Nueva Factura</Button>
        </div>
      </header>

      <div className="ag-invoices-summary">
        <Card className="ag-mini-stat">
          <p className="ag-mini-stat__label">Total Facturado</p>
          <h3 className="ag-mini-stat__value">45.230 €</h3>
        </Card>
        <Card className="ag-mini-stat">
          <p className="ag-mini-stat__label">Pendiente Cobro</p>
          <h3 className="ag-mini-stat__value ag-text-warn">8.120 €</h3>
        </Card>
        <Card className="ag-mini-stat">
          <p className="ag-mini-stat__label">Impuestos (IVA)</p>
          <h3 className="ag-mini-stat__value">9.498 €</h3>
        </Card>
      </div>

      <Card className="ag-invoices-filters">
        <div className="ag-filters-bar">
          <Input 
            placeholder="Buscar por número o cliente..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={18} />}
            className="ag-search-input"
          />
        </div>
      </Card>

      <Table 
        columns={columns} 
        data={invoices} 
        isLoading={isLoading}
      />
    </div>
  );
};

export default Invoices;
