import React, { useState } from 'react';
import { Card, Button, Input } from '../../components';
import { 
  User, 
  Building, 
  Bell, 
  Shield, 
  Key, 
  Mail, 
  Globe,
  Settings as SettingsIcon,
  CheckCircle,
  Save
} from 'lucide-react';
import { clsx } from 'clsx';
import './Settings.css';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Mi Perfil', icon: <User size={18} /> },
    { id: 'business', label: 'Empresa', icon: <Building size={18} /> },
    { id: 'notifications', label: 'Notificaciones', icon: <Bell size={18} /> },
    { id: 'security', label: 'Seguridad', icon: <Shield size={18} /> },
  ];

  return (
    <div className="ag-settings-page">
      <header className="ag-page-header">
        <div className="ag-page-header__title-group">
          <h1 className="ag-page-title">Ajustes</h1>
          <p className="ag-page-subtitle">Configura tu perfil personal y las preferencias de tu negocio.</p>
        </div>
        <div className="ag-page-header__actions">
          <Button variant="primary" leftIcon={<Save size={18} />}>Guardar Cambios</Button>
        </div>
      </header>

      <div className="ag-settings-container">
        <aside className="ag-settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={clsx('ag-settings-tab-btn', activeTab === tab.id && 'is-active')}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="ag-settings-tab-icon">{tab.icon}</span>
              <span className="ag-settings-tab-label">{tab.label}</span>
            </button>
          ))}
        </aside>

        <div className="ag-settings-content">
          {activeTab === 'profile' && (
            <Card title="Información Personal">
              <div className="ag-settings-form">
                <div className="ag-form-row">
                  <Input label="Nombre Completo" defaultValue="Toni IA" />
                  <Input label="Correo Electrónico" defaultValue="toni@anclora.com" type="email" />
                </div>
                <div className="ag-form-row">
                  <Input label="Teléfono" defaultValue="+34 600 000 000" />
                  <Input label="Idioma" defaultValue="Español (ES)" />
                </div>
                <div className="ag-form-footer">
                  <p className="ag-text-muted">Tu dirección de correo se utilizará para todas las comunicaciones fiscales.</p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'business' && (
            <Card title="Datos de Facturación">
              <div className="ag-settings-form">
                <Input label="Razón Social" defaultValue="Anclora Technologies S.L." />
                <div className="ag-form-row">
                  <Input label="NIF / CIF" defaultValue="B12345678" />
                  <Input label="Sitio Web" defaultValue="https://anclora.com" />
                </div>
                <Input label="Dirección Fiscal" defaultValue="Calle de la Innovación 42, 28001 Madrid" />
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card title="Cambiar Contraseña">
              <div className="ag-settings-form">
                 <Input label="Contraseña Actual" type="password" />
                 <Input label="Nueva Contraseña" type="password" />
                 <Input label="Confirmar Nueva Contraseña" type="password" />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
