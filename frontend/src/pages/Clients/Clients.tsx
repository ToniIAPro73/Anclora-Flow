import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Table, Card, Button, Input, Column } from '../../components';
import { Plus, Search, Edit2, Trash2, Mail, Phone, ExternalLink } from 'lucide-react';
import './Clients.css';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  nifCif?: string;
  address?: string;
  createdAt: string;
}

const Clients: React.FC = () => {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients', search],
    queryFn: () => api.get<Client[]>('/clients' + (search ? `?search=${search}` : '')),
  });

  const columns: Column<Client>[] = [
    { 
      key: 'name', 
      header: 'Cliente',
      render: (client) => (
        <div className="ag-client-cell">
          <div className="ag-client-avatar">{client.name.charAt(0)}</div>
          <div className="ag-client-info">
            <span className="ag-client-name">{client.name}</span>
            <span className="ag-client-sub">{client.nifCif || 'Sin NIF'}</span>
          </div>
        </div>
      )
    },
    { 
      key: 'contact', 
      header: 'Contacto',
      render: (client) => (
        <div className="ag-contact-info">
          {client.email && (
            <div className="ag-contact-item">
              <Mail size={14} /> <span>{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="ag-contact-item">
              <Phone size={14} /> <span>{client.phone}</span>
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'createdAt', 
      header: 'Alta',
      render: (client) => new Date(client.createdAt).toLocaleDateString()
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (client) => (
        <div className="ag-table-actions">
          <Button variant="ghost" size="sm" className="ag-action-btn"><Edit2 size={16} /></Button>
          <Button variant="ghost" size="sm" className="ag-action-btn ag-action-btn--danger"><Trash2 size={16} /></Button>
        </div>
      )
    }
  ];

  return (
    <div className="ag-clients-page">
      <header className="ag-page-header">
        <div className="ag-page-header__title-group">
          <h1 className="ag-page-title">Clientes</h1>
          <p className="ag-page-subtitle">Gestiona tu base de datos de clientes y contactos.</p>
        </div>
        <div className="ag-page-header__actions">
          <Button variant="primary" leftIcon={<Plus size={18} />}>Nuevo Cliente</Button>
        </div>
      </header>

      <Card className="ag-clients-filters">
        <div className="ag-filters-bar">
          <Input 
            placeholder="Buscar por nombre, email o NIF..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={18} />}
            className="ag-search-input"
          />
          {/* More filters could go here */}
        </div>
      </Card>

      <Table 
        columns={columns} 
        data={clients} 
        isLoading={isLoading}
        zebra
      />
    </div>
  );
};

export default Clients;
