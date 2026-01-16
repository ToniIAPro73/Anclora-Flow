import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Input } from '../../components';
import { Send, Bot, User, Sparkles, MessageSquare, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';
import './Assistant.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: '¡Hola! Soy tu asistente fiscal inteligente. ¿En qué puedo ayudarte hoy?', 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { 
      role: 'user', 
      content: input, 
      timestamp: new Date() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Mock response for now, placeholder for real AI service integration
    setTimeout(() => {
      const botMsg: Message = {
        role: 'assistant',
        content: `He analizado tu petición sobre "${input}". Según tus datos actuales, tu facturación ha subido un 15% este mes.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="ag-assistant-page">
      <header className="ag-page-header">
        <div className="ag-page-header__title-group">
          <h1 className="ag-page-title">Asistente AI</h1>
          <p className="ag-page-subtitle">Consulta tus dudas fiscales y obtén análisis inteligentes de tu negocio.</p>
        </div>
      </header>

      <div className="ag-assistant-container">
        <Card className="ag-chat-card">
          <div className="ag-chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={clsx('ag-message', `is-${msg.role}`)}>
                <div className="ag-message__avatar">
                  {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                </div>
                <div className="ag-message__content">
                  <div className="ag-message__text">{msg.content}</div>
                  <div className="ag-message__time">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="ag-message is-assistant is-typing">
                <div className="ag-message__avatar"><Bot size={18} /></div>
                <div className="ag-message__content">
                  <div className="ag-typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="ag-chat-input-area">
            <Input 
              placeholder="Pregúntame algo sobre tus facturas o gastos..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="ag-chat-input"
            />
            <Button 
              variant="primary" 
              onClick={handleSend}
              className="ag-send-btn"
            >
              <Send size={18} />
            </Button>
          </div>
        </Card>

        <aside className="ag-assistant-sidebar">
          <Card title="Sugerencias" className="ag-suggestions-card">
            <div className="ag-suggestion-list">
              <button className="ag-suggestion-item">
                <Sparkles size={14} /> "¿Cuál es mi IVA este trimestre?"
              </button>
              <button className="ag-suggestion-item">
                <TrendingUp size={14} /> "¿Cómo va mi rentabilidad?"
              </button>
              <button className="ag-suggestion-item">
                <MessageSquare size={14} /> "Resumen de gastos del mes"
              </button>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default Assistant;
