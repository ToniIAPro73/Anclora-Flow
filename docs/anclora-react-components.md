# ANCLORA FLOW - COMPONENTES REACT

**Última actualización:** 2026-01-17  
**Versión:** 1.0  
**Stack:** React 18 + TypeScript + Tailwind CSS

---

## TABLA DE CONTENIDOS

1. [Estructura del Proyecto](#estructura-del-proyecto)
2. [Componentes Core](#componentes-core)
3. [Componentes de Página](#componentes-de-página)
4. [Componentes Reutilizables](#componentes-reutilizables)
5. [Hooks Personalizados](#hooks-personalizados)
6. [State Management](#state-management)
7. [Ejemplos de Uso](#ejemplos-de-uso)

---

## ESTRUCTURA DEL PROYECTO

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── core/           # Componentes base
│   │   ├── pages/          # Componentes de página
│   │   ├── ui/             # Componentes reutilizables
│   │   └── layouts/        # Layouts
│   ├── hooks/              # Hooks personalizados
│   ├── context/            # Context API
│   ├── services/           # API calls
│   ├── types/              # TypeScript types
│   ├── utils/              # Utilidades
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## COMPONENTES CORE

### 1. `ReceiptUpload.tsx` - Cargador de Documentos

```typescript
import React, { useState, useRef } from 'react';
import { useAPI } from '@/hooks/useAPI';

interface ReceiptUploadProps {
  onSuccess?: (receipt: Receipt) => void;
  onError?: (error: string) => void;
}

export const ReceiptUpload: React.FC<ReceiptUploadProps> = ({ 
  onSuccess, 
  onError 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadReceipt } = useAPI();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    setIsLoading(true);
    
    for (const file of files) {
      // Validar tipo de archivo
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        onError?.(`Tipo de archivo no válido: ${file.type}`);
        continue;
      }

      // Validar tamaño (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        onError?.(`Archivo demasiado grande: ${file.name}`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const receipt = await uploadReceipt(formData);
        onSuccess?.(receipt);
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'Error al subir archivo');
      }
    }

    setIsLoading(false);
  };

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center
        transition-colors duration-200 cursor-pointer
        ${isDragging 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        disabled={isLoading}
        className="hidden"
      />

      <div className="space-y-2">
        <div className="text-4xl">📄</div>
        <h3 className="text-lg font-semibold">Arrastra archivos aquí</h3>
        <p className="text-sm text-gray-600">
          o haz clic para seleccionar. Soporta PDF, JPG y PNG (máx 10MB)
        </p>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 rounded-lg">
          <div className="animate-spin">⏳</div>
        </div>
      )}
    </div>
  );
};
```

---

### 2. `DataExtractor.tsx` - Visualizador de Datos Extraídos

```typescript
import React from 'react';
import { Receipt, ExtractedData } from '@/types';

interface DataExtractorProps {
  receipt: Receipt;
  data: ExtractedData;
  isLoading?: boolean;
}

export const DataExtractor: React.FC<DataExtractorProps> = ({
  receipt,
  data,
  isLoading = false
}) => {
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold">{data.vendor}</h2>
        <p className="text-blue-100">{data.document_number}</p>
      </div>

      {/* GRID DE DATOS */}
      <div className="grid grid-cols-2 gap-4">
        <DataField
          label="Fecha"
          value={data.date}
          icon="📅"
        />
        <DataField
          label="Importe Total"
          value={`€ ${data.total?.toFixed(2)}`}
          icon="💰"
        />
        <DataField
          label="IVA"
          value={`€ ${data.tax?.toFixed(2)}`}
          icon="📊"
        />
        <DataField
          label="Estado"
          value={receipt.status}
          icon="✅"
        />
      </div>

      {/* ITEMS */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold mb-4">Artículos</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.items?.map((item, idx) => (
            <div key={idx} className="text-sm text-gray-700 pb-2 border-b">
              <div className="flex justify-between">
                <span>{item.description}</span>
                <span className="font-semibold">€ {item.amount?.toFixed(2)}</span>
              </div>
              <div className="text-xs text-gray-500">
                Confianza OCR: {(item.confidence * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* METADATA */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm">
        <p className="text-gray-700">
          <strong>Archivo:</strong> {receipt.file_name}
        </p>
        <p className="text-gray-700">
          <strong>Subido:</strong> {new Date(receipt.created_at).toLocaleString('es-ES')}
        </p>
      </div>
    </div>
  );
};

// Componente auxiliar
interface DataFieldProps {
  label: string;
  value: string | undefined;
  icon: string;
}

const DataField: React.FC<DataFieldProps> = ({ label, value, icon }) => (
  <div className="bg-white rounded-lg p-4 border border-gray-200">
    <div className="text-2xl mb-2">{icon}</div>
    <p className="text-sm text-gray-600">{label}</p>
    <p className="text-lg font-semibold text-gray-900">
      {value || 'N/A'}
    </p>
  </div>
);
```

---

### 3. `AssistantChat.tsx` - Chat con IA

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { useAPI } from '@/hooks/useAPI';

type Context = 'tax' | 'accounting' | 'invoicing' | 'payments';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AssistantChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [context, setContext] = useState<Context>('tax');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { chatWithAssistant } = useAPI();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithAssistant(input, context);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const contextOptions: { value: Context; label: string; emoji: string }[] = [
    { value: 'tax', label: 'Impuestos', emoji: '📋' },
    { value: 'accounting', label: 'Contabilidad', emoji: '📊' },
    { value: 'invoicing', label: 'Facturación', emoji: '🧾' },
    { value: 'payments', label: 'Pagos', emoji: '💳' }
  ];

  return (
    <div className="flex flex-col h-screen bg-white rounded-lg shadow-lg">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-400 text-white p-4">
        <h2 className="text-xl font-bold mb-3">🤖 Asesor Fiscal IA</h2>
        <div className="flex gap-2 overflow-x-auto">
          {contextOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setContext(option.value)}
              className={`
                px-3 py-1 rounded-full whitespace-nowrap text-sm font-medium
                transition-colors
                ${context === option.value
                  ? 'bg-white text-purple-600'
                  : 'bg-purple-500 text-white hover:bg-purple-400'
                }
              `}
            >
              {option.emoji} {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-4xl mb-2">💬</div>
            <p>Haz una pregunta sobre fiscalidad...</p>
          </div>
        )}

        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-xs lg:max-w-md px-4 py-2 rounded-lg
                ${message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
                }
              `}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="Escribe tu pregunta..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## COMPONENTES DE PÁGINA

### `DashboardPage.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { useAPI } from '@/hooks/useAPI';
import { DashboardMetrics } from '@/components/DashboardMetrics';
import { ReceiptList } from '@/components/ReceiptList';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getDashboardMetrics, getReceipts } = useAPI();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [metricsData, receiptsData] = await Promise.all([
          getDashboardMetrics(),
          getReceipts({ limit: 10 })
        ]);
        setMetrics(metricsData);
        setReceipts(receiptsData);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen de tu actividad fiscal</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Cargando...</div>
      ) : (
        <>
          <DashboardMetrics metrics={metrics} />
          <ReceiptList receipts={receipts} />
        </>
      )}
    </div>
  );
};
```

---

## COMPONENTES REUTILIZABLES

### `Button.tsx`

```typescript
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  disabled,
  ...props
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-colors';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${(disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? '⏳ Cargando...' : children}
    </button>
  );
};
```

---

## HOOKS PERSONALIZADOS

### `useAPI.ts`

```typescript
import { useState, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export const useAPI = () => {
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async (method: string, endpoint: string, data?: any) => {
      try {
        const url = `${API_BASE}${endpoint}`;
        const options: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        };

        if (data && method !== 'GET') {
          options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      }
    },
    []
  );

  return {
    error,
    uploadReceipt: async (formData: FormData) => 
      request('POST', '/receipts/', formData),
    getReceipts: async (params?: any) => 
      request('GET', `/receipts?${new URLSearchParams(params)}`),
    getDashboardMetrics: async () => 
      request('GET', '/dashboard/metrics'),
    chatWithAssistant: async (message: string, context: string) =>
      request('POST', '/assistant/chat', { message, context })
  };
};
```

---

## STATE MANAGEMENT

### `useReceipts.ts` - Context Hook

```typescript
import { createContext, useContext, useState, ReactNode } from 'react';
import { Receipt } from '@/types';

interface ReceiptsContextType {
  receipts: Receipt[];
  addReceipt: (receipt: Receipt) => void;
  removeReceipt: (id: string) => void;
  updateReceipt: (id: string, receipt: Partial<Receipt>) => void;
}

const ReceiptsContext = createContext<ReceiptsContextType | undefined>(undefined);

export const ReceiptsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  const addReceipt = (receipt: Receipt) => {
    setReceipts(prev => [receipt, ...prev]);
  };

  const removeReceipt = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  const updateReceipt = (id: string, updatedData: Partial<Receipt>) => {
    setReceipts(prev => 
      prev.map(r => r.id === id ? { ...r, ...updatedData } : r)
    );
  };

  return (
    <ReceiptsContext.Provider value={{ receipts, addReceipt, removeReceipt, updateReceipt }}>
      {children}
    </ReceiptsContext.Provider>
  );
};

export const useReceipts = () => {
  const context = useContext(ReceiptsContext);
  if (!context) {
    throw new Error('useReceipts must be used within ReceiptsProvider');
  }
  return context;
};
```

---

## TIPOS TYPESCRIPT

### `types/index.ts`

```typescript
export interface Receipt {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  extracted_data: ExtractedData;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface ExtractedData {
  vendor: string;
  date: string;
  document_number: string;
  total: number;
  tax: number;
  items: LineItem[];
  confidence: number;
  raw_text: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  confidence: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface DashboardMetrics {
  total_receipts: number;
  total_amount: number;
  average_confidence: number;
  processing_time_avg: number;
}
```

---

## EJEMPLOS DE USO

### En `App.tsx`

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ReceiptsProvider } from '@/context/useReceipts';
import { DashboardPage } from '@/pages/DashboardPage';
import { Layout } from '@/components/Layout';

function App() {
  return (
    <ReceiptsProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            {/* Más rutas */}
          </Routes>
        </Layout>
      </BrowserRouter>
    </ReceiptsProvider>
  );
}

export default App;
```

---

## INSTALACIÓN Y SETUP

```bash
# Dependencias principales
npm install react@18 react-dom@18 typescript
npm install -D tailwindcss postcss autoprefixer
npm install react-router-dom
npm install axios

# TypeScript types
npm install -D @types/react @types/react-dom @types/node

# Inicializar Tailwind
npx tailwindcss init -p
```

---

## VARIABLES DE ENTORNO (.env)

```
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_ENVIRONMENT=development
```

---

**Última actualización:** 2026-01-17  
**Versión:** 1.0.1
