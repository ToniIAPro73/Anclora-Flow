import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { api } from '../../services/api';
import { Card, Button } from '../../components';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  AlertCircle,
  Plus,
  ArrowRight
} from 'lucide-react';
import './Dashboard.css';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isUp: boolean };
  color?: string;
}> = ({ title, value, icon, trend, color }) => (
  <Card className="ag-stat-card">
    <div className="ag-stat-card__content">
      <div className="ag-stat-card__info">
        <p className="ag-stat-card__title">{title}</p>
        <h2 className="ag-stat-card__value">{value}</h2>
        {trend && (
          <p className={clsx('ag-stat-card__trend', trend.isUp ? 'is-up' : 'is-down')}>
            {trend.isUp ? '↑' : '↓'} {trend.value}% vs mes anterior
          </p>
        )}
      </div>
      <div className="ag-stat-card__icon" style={{ backgroundColor: `${color}15`, color: color }}>
        {icon}
      </div>
    </div>
  </Card>
);

const Dashboard: React.FC = () => {
  const { data: projectSummary, isLoading: loadingProjects } = useQuery({
    queryKey: ['projectSummary'],
    queryFn: () => api.getProjectSummary(),
  });

  const { data: invoiceStats, isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoiceStats'],
    queryFn: () => api.getInvoicesStatistics(),
  });

  return (
    <div className="ag-dashboard">
      <header className="ag-page-header">
        <div className="ag-page-header__title-group">
          <h1 className="ag-page-title">Bienvenido de nuevo</h1>
          <p className="ag-page-subtitle">Aquí tienes un resumen de tu actividad financiera.</p>
        </div>
        <div className="ag-page-header__actions">
          <Button variant="secondary" leftIcon={<FileText size={18} />}>Generar Informe</Button>
          <Button variant="primary" leftIcon={<Plus size={18} />}>Nueva Factura</Button>
        </div>
      </header>

      <div className="ag-dashboard__stats">
        <StatCard 
          title="Facturación Mensual" 
          value={`${invoiceStats?.monthlyIncome || 0} €`} 
          icon={<TrendingUp size={24} />} 
          color="#2563eb"
        />
        <StatCard 
          title="Proyectos Activos" 
          value={projectSummary?.activeProjects || 0} 
          icon={<AlertCircle size={24} />} 
          color="#f59e0b"
        />
        <StatCard 
          title="Nuevos Clientes" 
          value={12} // Placeholder for mock
          icon={<Users size={24} />} 
          color="#10b981"
        />
        <StatCard 
          title="Facturas Pendientes" 
          value={invoiceStats?.pendingCount || 0} 
          icon={<FileText size={24} />} 
          color="#ef4444"
        />
      </div>

      <div className="ag-dashboard__grid">
        <Card title="Facturas Recientes" headerActions={<Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>Ver todas</Button>}>
          <p className="ag-text-muted">No hay facturas recientes para mostrar.</p>
        </Card>
        
        <Card title="Próximos Vencimientos">
           <p className="ag-text-muted">No hay vencimientos próximos.</p>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
