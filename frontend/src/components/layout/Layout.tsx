import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Receipt, 
  Users, 
  Repeat, 
  PieChart, 
  Calendar, 
  TrendingUp, 
  Bot, 
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import './Layout.css';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, collapsed }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => clsx('ag-sidebar-item', isActive && 'is-active')}
    title={collapsed ? label : undefined}
  >
    <span className="ag-sidebar-item__icon">{icon}</span>
    {!collapsed && <span className="ag-sidebar-item__label">{label}</span>}
  </NavLink>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  return (
    <div className={clsx('ag-app-shell', isCollapsed && 'is-collapsed')}>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div className="ag-mobile-backdrop" onClick={toggleMobile} />
      )}

      {/* Sidebar */}
      <aside className={clsx('ag-sidebar', isMobileOpen && 'is-mobile-open')}>
        <div className="ag-sidebar__header">
          {!isCollapsed && (
            <Link to="/" className="ag-sidebar__logo">
              <span className="ag-logo-icon">A</span>
              <span className="ag-logo-text">Anclora</span>
            </Link>
          )}
          {isCollapsed && (
             <Link to="/" className="ag-sidebar__logo ag-sidebar__logo--icon">
                <span className="ag-logo-icon">A</span>
             </Link>
          )}
          <button className="ag-sidebar__toggle ag-desktop-only" onClick={toggleSidebar}>
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button className="ag-sidebar__toggle ag-mobile-only" onClick={toggleMobile}>
            <X size={24} />
          </button>
        </div>

        <nav className="ag-sidebar__nav">
          <SidebarItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" collapsed={isCollapsed} />
          <SidebarItem to="/invoices" icon={<FileText size={20} />} label="Facturas" collapsed={isCollapsed} />
          <SidebarItem to="/expenses" icon={<Receipt size={20} />} label="Gastos" collapsed={isCollapsed} />
          <SidebarItem to="/clients" icon={<Users size={20} />} label="Clientes" collapsed={isCollapsed} />
          <SidebarItem to="/subscriptions" icon={<Repeat size={20} />} label="Suscripciones" collapsed={isCollapsed} />
          <SidebarItem to="/budget" icon={<PieChart size={20} />} label="Presupuesto" collapsed={isCollapsed} />
          <SidebarItem to="/calendar" icon={<Calendar size={20} />} label="Calendario" collapsed={isCollapsed} />
          <SidebarItem to="/reports" icon={<TrendingUp size={20} />} label="Informes" collapsed={isCollapsed} />
          
          <div className="ag-sidebar__separator" />
          
          <SidebarItem to="/assistant" icon={<Bot size={20} />} label="Asistente AI" collapsed={isCollapsed} />
          <SidebarItem to="/settings" icon={<Settings size={20} />} label="Ajustes" collapsed={isCollapsed} />
        </nav>

        <div className="ag-sidebar__footer">
          <button className="ag-sidebar-item ag-logout-button">
            <span className="ag-sidebar-item__icon"><LogOut size={20} /></span>
            {!isCollapsed && <span className="ag-sidebar-item__label">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ag-main-container">
        <header className="ag-topbar">
          <button className="ag-topbar__menu ag-mobile-only" onClick={toggleMobile}>
            <Menu size={24} />
          </button>
          <div className="ag-topbar__search">
            {/* Search input could go here */}
          </div>
          <div className="ag-topbar__user">
             <div className="ag-user-avatar">AD</div>
          </div>
        </header>
        
        <div className="ag-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
