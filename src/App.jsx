/**
 * AzurTant PRO - Main App with Enterprise Dashboard
 * Autonomous Business AI with Inter-Agent Communication
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import services
import { ollamaService } from './services/ollamaService.js';
import { mem0Service } from './services/mem0Service.js';
import { deepResearchService } from './services/deepResearchService.js';
import { voiceService } from './services/voiceService.js';
import { graphRAGService } from './services/graphRAGService.js';
import { mlService } from './services/mlService.js';
import { orchestratorAgent } from './agents/orchestratorAgent.js';
import { interAgentHub } from './agents/interagent/interAgentHub.js';
import { ensureRegistered, DEPARTMENTS as DEPT_INSTANCES } from './agents/departments/index.js';

// Import Enterprise Dashboard
import EnterpriseDashboard from './components/EnterpriseDashboard.jsx';

const DEPARTMENTS = [
  { id: 'ceo', name: 'CEO / Dirección', icon: '👑', color: 'amber', desc: 'Orquestador maestro' },
  { id: 'finanzas', name: 'Finanzas', icon: '💰', color: 'green', desc: 'Contabilidad, nóminas' },
  { id: 'operaciones', name: 'Operaciones', icon: '⚙️', color: 'blue', desc: 'Procesos' },
  { id: 'legal', name: 'Legal', icon: '⚖️', color: 'purple', desc: 'Contratos' },
  { id: 'rrhh', name: 'RRHH', icon: '👥', color: 'pink', desc: 'Personal' },
  { id: 'tecnologia', name: 'Tecnología', icon: '💻', color: 'cyan', desc: 'Soporte N1-N5' },
  { id: 'marketing', name: 'Marketing', icon: '📣', color: 'orange', desc: 'Branding, CVs' },
  { id: 'ventas', name: 'Ventas', icon: '📈', color: 'emerald', desc: 'CRM, propuestas' },
  { id: 'compras', name: 'Compras', icon: '🛒', color: 'yellow', desc: 'Proveedores' },
  { id: 'seguridad', name: 'Seguridad', icon: '🔒', color: 'red', desc: 'Ciberseguridad' },
  { id: 'innovacion', name: 'Innovación', icon: '🔬', color: 'indigo', desc: 'I+D, Research' },
  { id: 'redes', name: 'Redes Sociales', icon: '📱', color: 'fuchsia', desc: 'Contenido auto' },
  { id: 'sysadmin', name: 'SysAdmin', icon: '🖥️', color: 'slate', desc: 'Infraestructura' },
];

// Toast notification
const showToast = (message, type = 'info') => {
  toast(message, { type, position: 'top-right', autoClose: 3000 });
};

// (Eliminado: useEffect huérfano a nivel de módulo.
// Movido dentro de App() para que React dispatcher esté inicializado.)

export default function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'enterprise' | 'dept'
  const [activeDept, setActiveDept] = useState('dashboard');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [systemStatus, setSystemStatus] = useState('initializing');
  const [globalChat, setGlobalChat] = useState([]);  // [{role, content, dept, ts}]
  const [globalInput, setGlobalInput] = useState('');
  const [globalLoading, setGlobalLoading] = useState(false);

  // Register all 13 agents in the inter-agent hub
  useEffect(() => {
    try {
      const n = ensureRegistered();
      showToast(`${n} agentes conectados al hub inter-departamental`, 'success');
    } catch (e) {
      showToast('Error registrando agentes: ' + e.message, 'error');
    }
  }, []);

  // Initialize services
  useEffect(() => {
    async function init() {
      try {
        // Initialize Ollama
        const ollamaStatus = await ollamaService.initialize();
        showToast(`Ollama: ${ollamaStatus.status}`, ollamaStatus.status === 'connected' ? 'success' : 'warning');

        // Initialize ML
        const mlStatus = await mlService.initialize();
        showToast(`ML Engine: ${mlStatus.status}`, 'success');

        // Initialize Voice
        const voiceStatus = await voiceService.initialize();
        showToast(`Voice: ${voiceStatus.status}`, 'success');

        setSystemStatus('operational');
      } catch (error) {
        console.error('Initialization error:', error);
        setSystemStatus('degraded');
        showToast('Some services may not be available', 'warning');
      }
    }
    init();
  }, []);

  // Handle inter-agent messages
  const sendToAgent = async (from, to, action, payload) => {
    const result = await interAgentHub.sendMessage(from, to, action, payload);
    return result;
  };

  // Broadcast to all agents
  const broadcastToAll = async (action, payload) => {
    const result = await interAgentHub.broadcast('ceo', action, payload);
    showToast(`Broadcast enviado a ${result.sent_to} agentes`, 'info');
    return result;
  };

  // Global chat handler - REAL: orchestrator routes to depto, gets real response
  const handleGlobalChat = async (e) => {
    e?.preventDefault?.();
    const msg = (globalInput || '').trim();
    if (!msg || globalLoading) return;

    setGlobalInput('');
    setGlobalLoading(true);
    const userMsg = { role: 'user', content: msg, ts: new Date().toISOString() };
    setGlobalChat(c => [...c, userMsg]);

    try {
      const result = await orchestratorAgent.processRequest(msg, null, 'ceo-user');
      const deptId = result?.department || 'ceo';
      const deptInfo = DEPARTMENTS.find(d => d.id === deptId);
      const replyText = result?.message || (result?.error ? `Error: ${result.error}` : 'Sin respuesta');
      const reply = {
        role: 'assistant',
        content: replyText,
        dept: deptId,
        deptName: deptInfo?.name || deptId,
        model: result?.model,
        ts: new Date().toISOString(),
        success: result?.success !== false
      };
      setGlobalChat(c => [...c, reply]);
      showToast(`Respuesta de ${deptInfo?.name || deptId}`, reply.success ? 'success' : 'error');
    } catch (err) {
      setGlobalChat(c => [...c, { role: 'assistant', content: 'Error: ' + err.message, ts: new Date().toISOString(), success: false }]);
    } finally {
      setGlobalLoading(false);
    }
  };

  // Quick action: Generate Invoice via finanzas (REAL)
  const handleQuickInvoice = async () => {
    setGlobalLoading(true);
    const userMsg = { role: 'user', content: 'Generar invoice de prueba', ts: new Date().toISOString() };
    setGlobalChat(c => [...c, userMsg]);
    try {
      const r = await orchestratorAgent.generateDocument('invoice_cfdi', {
        cliente: 'Cliente Demo',
        monto: 10000,
        moneda: 'MXN',
        conceptos: [{ desc: 'Servicio de consultoría multi-agente', cantidad: 1, precio: 10000 }]
      }, 'ceo-user');
      setGlobalChat(c => [...c, {
        role: 'assistant',
        content: r?.message || 'No se pudo generar la invoice',
        dept: 'finanzas',
        deptName: 'Finanzas',
        model: r?.model,
        ts: new Date().toISOString(),
        success: r?.success !== false
      }]);
    } catch (err) {
      setGlobalChat(c => [...c, { role: 'assistant', content: 'Error: ' + err.message, ts: new Date().toISOString(), success: false }]);
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <ToastContainer />

      {/* Top Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌐</span>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                AzurTant PRO
              </span>
              <span className="text-xs bg-cyan-900/50 text-cyan-300 px-2 py-1 rounded">v1.0 Enterprise</span>
            </div>

            {/* View Switcher */}
            <div className="flex gap-2 ml-8">
              <button
                onClick={() => setView('dashboard')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  view === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setView('enterprise')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  view === 'enterprise' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Analytics
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* System Status */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              systemStatus === 'operational' ? 'bg-green-900/50' : 'bg-amber-900/50'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                systemStatus === 'operational' ? 'bg-green-400 animate-pulse' : 'bg-amber-400'
              }`}></div>
              <span className="text-sm">{systemStatus === 'operational' ? 'All Systems GO' : 'Degraded'}</span>
            </div>

            {/* Voice Toggle */}
            <button
              onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                showToast(voiceEnabled ? 'Voice disabled' : 'Voice enabled - Click mic to talk', 'info');
              }}
              className={`p-3 rounded-xl transition-all ${
                voiceEnabled ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {voiceEnabled ? '🎤' : '🎙️'}
            </button>

            {/* Quick Actions */}
            <button
              onClick={() => broadcastToAll('status_check', {})}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400"
              title="Ping all agents"
            >
              🔄
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {view === 'dashboard' && (
          <>
            {/* Sidebar - Department Navigation */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-73px)]">
              <div className="p-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3">Departamentos</h3>
                <nav className="space-y-1">
                  {DEPARTMENTS.map(dept => (
                    <button
                      key={dept.id}
                      onClick={() => setActiveDept(dept.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        activeDept === dept.id
                          ? 'bg-blue-900/50 text-white border-l-4 border-blue-500'
                          : 'hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="text-xl">{dept.icon}</span>
                      <div className="text-left flex-1">
                        <p className="font-medium text-sm">{dept.name}</p>
                        <p className="text-xs text-slate-500">{dept.desc}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main Panel */}
            <main className="flex-1 p-6">
              {activeDept === 'dashboard' ? (
                <MainDashboard
                  sendToAgent={sendToAgent}
                  broadcastToAll={broadcastToAll}
                  interAgentHub={interAgentHub}
                  globalChat={globalChat}
                  globalInput={globalInput}
                  setGlobalInput={setGlobalInput}
                  globalLoading={globalLoading}
                  handleGlobalChat={handleGlobalChat}
                  handleQuickInvoice={handleQuickInvoice}
                />
              ) : (
                <DepartmentPanel
                  deptId={activeDept}
                  department={DEPARTMENTS.find(d => d.id === activeDept)}
                  sendToAgent={sendToAgent}
                />
              )}
            </main>
          </>
        )}

        {view === 'enterprise' && (
          <div className="w-full">
            <EnterpriseDashboard />
          </div>
        )}
      </div>
    </div>
  );
}

// Main Dashboard Component
function MainDashboard({ sendToAgent, broadcastToAll, interAgentHub, globalChat, globalInput, setGlobalInput, globalLoading, handleGlobalChat, handleQuickInvoice }) {
  const [stats, setStats] = useState({ agents: 0, messages: 0, tasks: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const hubStats = interAgentHub.getStatistics();
      setStats({
        agents: hubStats.active_agents,
        messages: hubStats.total_messages,
        tasks: hubStats.pending_responses
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">AzurTant PRO Dashboard</h1>
        <button
          onClick={() => broadcastToAll('report_status', { status_type: 'system' })}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm"
        >
          🔄 Refresh All Agents
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <p className="text-sm text-slate-400">Active Agents</p>
          <p className="text-4xl font-bold text-white mt-1">{stats.agents}</p>
          <p className="text-xs text-green-400 mt-2">All operational</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <p className="text-sm text-slate-400">Messages Processed</p>
          <p className="text-4xl font-bold text-white mt-1">{stats.messages}</p>
          <p className="text-xs text-cyan-400 mt-2">Real-time</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <p className="text-sm text-slate-400">Inter-Agent Tasks</p>
          <p className="text-4xl font-bold text-white mt-1">{stats.tasks}</p>
          <p className="text-xs text-amber-400 mt-2">Pending</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <p className="text-sm text-slate-400">System Health</p>
          <p className="text-4xl font-bold text-green-400 mt-1">99.8%</p>
          <p className="text-xs text-green-400 mt-2">Uptime</p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4">🚀 Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Generate Invoice', action: () => handleQuickInvoice() },
              { label: 'Post to Social', action: () => sendToAgent('ceo', 'redes', 'create_content', { platform: 'all' }) },
              { label: 'Sales Report', action: () => sendToAgent('ceo', 'ventas', 'generate_report', { type: 'sales' }) },
              { label: 'Research', action: () => sendToAgent('ceo', 'innovacion', 'start_research', { query: 'industry trends' }) }
            ].map((action, i) => (
              <button key={i} onClick={action.action}
                className="bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded-lg text-sm text-left">
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4">🤖 Agent Status</h3>
          <div className="space-y-2">
            {['finanzas', 'ventas', 'marketing', 'innovacion'].map(agentId => (
              <div key={agentId} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <span className="text-sm capitalize">{agentId}</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-xs text-green-400">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4">📊 ML Predictions</h3>
          <div className="space-y-3">
            <div className="p-3 bg-green-900/30 rounded-lg border border-green-600">
              <p className="text-sm">Revenue Forecast</p>
              <p className="text-xl font-bold text-green-400">+$18% Q2</p>
            </div>
            <div className="p-3 bg-amber-900/30 rounded-lg border border-amber-600">
              <p className="text-sm">Churn Risk</p>
              <p className="text-xl font-bold text-amber-400">3 accounts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Communication Log */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
        <h3 className="text-lg font-semibold mb-4">🔗 Inter-Agent Communication</h3>
        <div className="h-48 overflow-auto font-mono text-xs text-slate-400 space-y-1">
          {interAgentHub.getMessageHistory(null, 10).map((msg, i) => (
            <div key={i} className="p-2 bg-slate-800 rounded">
              [{new Date(msg.timestamp || msg.logged_at).toLocaleTimeString()}] {msg.from} → {msg.to}: {msg.action}
            </div>
          ))}
        </div>
      </div>

      {/* GLOBAL CHAT PANEL - Always visible, real orchestrator routing */}
      <div className="bg-slate-900 rounded-xl p-6 border-2 border-cyan-700" data-testid="global-chat-panel">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          💬 Chat con AzurTant (CEO)
          <span className="text-xs text-slate-400 font-normal">— Escribe cualquier cosa, el CEO enruta al depto correcto</span>
        </h3>
        <div className="h-64 overflow-auto bg-slate-950 rounded-lg p-3 mb-3 space-y-2" data-testid="chat-messages">
          {globalChat.length === 0 && (
            <div className="text-slate-500 text-sm text-center py-6">
              💬 Escribe algo abajo. Ejemplos: "crear invoice por $10,000", "reclutar vendedor", "estrategia del trimestre"
            </div>
          )}
          {globalChat.map((m, i) => (
            <div key={i} className={`p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-blue-900/50 ml-12' : m.success === false ? 'bg-red-900/40 mr-12 border border-red-700' : 'bg-slate-800 mr-12'}`}>
              <div className="flex items-center gap-2 mb-1 text-xs text-slate-400">
                {m.role === 'user' ? '👤 Tú' : `🤖 ${m.deptName || 'CEO'}`}
                {m.model && <span className="text-cyan-400">· {m.model}</span>}
                <span className="ml-auto">{new Date(m.ts).toLocaleTimeString()}</span>
              </div>
              <div className="whitespace-pre-wrap text-slate-100">{m.content}</div>
            </div>
          ))}
          {globalLoading && (
            <div className="bg-slate-800 mr-12 p-3 rounded-lg text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay:'0.1s'}}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay:'0.2s'}}></div>
                <span>Procesando con el agente departamental...</span>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleGlobalChat} className="flex gap-2">
          <input
            type="text"
            data-testid="global-chat-input"
            value={globalInput}
            onChange={e => setGlobalInput(e.target.value)}
            placeholder="Escribe tu mensaje... (Enter para enviar)"
            disabled={globalLoading}
            className="flex-1 bg-slate-950 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            data-testid="global-chat-send"
            disabled={globalLoading || !globalInput.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 px-6 py-3 rounded-lg font-medium"
          >
            {globalLoading ? '⏳' : '📤 Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Department Panel Component
function DepartmentPanel({ deptId, department, sendToAgent }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Send to the department agent
      const response = await sendToAgent('ceo', deptId, 'process_request', { message: input });

      setMessages(m => [...m, {
        role: 'assistant',
        content: response.success ? response.response?.message : `Error: ${response.error}`
      }]);

      // Also store in memory
      mem0Service.add(`User to ${deptId}: ${input}`, 'session');
      mem0Service.add(`${deptId} response: ${response.response?.message || response.error}`, 'session');
    } catch (error) {
      setMessages(m => [...m, { role: 'assistant', content: `Error: ${error.message}` }]);
    }

    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`bg-gradient-to-br ${getColorClass(department.color)} rounded-xl p-6 border mb-6`}>
        <div className="flex items-center gap-4">
          <span className="text-5xl">{department.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">{department.name}</h1>
            <p className="text-slate-300">{department.desc}</p>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              <p className="text-lg">💬 Chat con {department.name}</p>
              <p className="text-sm mt-2">Escribe tu mensaje y el agente te responderá</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-xl p-4 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-200 border border-slate-700'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={`Message ${department.name}...`}
              className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 px-6 py-3 rounded-lg font-medium"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getColorClass(color) {
  const map = {
    amber: 'from-amber-900/50 to-amber-800/30 border-amber-600',
    green: 'from-green-900/50 to-green-800/30 border-green-600',
    blue: 'from-blue-900/50 to-blue-800/30 border-blue-600',
    purple: 'from-purple-900/50 to-purple-800/30 border-purple-600',
    pink: 'from-pink-900/50 to-pink-800/30 border-pink-600',
    cyan: 'from-cyan-900/50 to-cyan-800/30 border-cyan-600',
    orange: 'from-orange-900/50 to-orange-800/30 border-orange-600',
    emerald: 'from-emerald-900/50 to-emerald-800/30 border-emerald-600',
    red: 'from-red-900/50 to-red-800/30 border-red-600',
    indigo: 'from-indigo-900/50 to-indigo-800/30 border-indigo-600',
    fuchsia: 'from-fuchsia-900/50 to-fuchsia-800/30 border-fuchsia-600',
    slate: 'from-slate-900/50 to-slate-800/30 border-slate-600'
  };
  return map[color] || map.amber;
}