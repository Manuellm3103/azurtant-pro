import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import i18n from './i18n/i18nService.js';
import LanguageSwitcher from './components/LanguageSwitcher.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import LandingHero from './components/LandingHero.jsx';
import SupportN from './components/SupportN.jsx';
import LegalAdvisor from './components/LegalAdvisor.jsx';
import VoiceCanvas from './components/VoiceCanvas.jsx';
import './components/LandingHero.css';
import { orchestratorClient } from './orchestratorClient.js';

const showToast = (msg, type='info') => toast(msg, { type, position:'top-right', autoClose:2500 });

const DEPTS = [
  { id:'ceo',name:'CEO',icon:'👑',color:'#F59E0B',desc:'Dirección estratégica' },
  { id:'finanzas',name:'Finanzas',icon:'💰',color:'#10B981',desc:'CFDI, impuestos, cashflow' },
  { id:'legal',name:'Legal',icon:'⚖️',color:'#A855F7',desc:'Contratos, escrituras, compliance' },
  { id:'tecnologia',name:'Tecnología',icon:'💻',color:'#06B6D4',desc:'Soporte, desarrollo, infra' },
  { id:'ventas',name:'Ventas',icon:'📈',color:'#14B8A6',desc:'Leads, CRM, propuestas' },
  { id:'marketing',name:'Marketing',icon:'📣',color:'#F97316',desc:'Contenido, SEO, campañas' },
  { id:'rrhh',name:'RRHH',icon:'👥',color:'#EC4899',desc:'Nóminas, reclutamiento' },
  { id:'operaciones',name:'Operaciones',icon:'⚙️',color:'#3B82F6',desc:'Logística, inventario' },
  { id:'compras',name:'Compras',icon:'🛒',color:'#EAB308',desc:'Proveedores, adquisiciones' },
  { id:'seguridad',name:'Seguridad',icon:'🛡️',color:'#EF4444',desc:'Shadow AI, anomalías' },
  { id:'sysadmin',name:'SysAdmin',icon:'🖥️',color:'#64748B',desc:'Servidores, monitoreo' },
  { id:'innovacion',name:'Innovación',icon:'🔬',color:'#8B5CF6',desc:'I+D, tendencias' },
  { id:'redes',name:'Redes Sociales',icon:'📱',color:'#D946EF',desc:'Instagram, TikTok, FB' },
  { id:'propuestas',name:'Propuestas',icon:'📋',color:'#6366F1',desc:'Licitaciones, RFPs' },
];

export default function App() {
  const [view, setView] = useState('dashboard');
  const [activeDept, setActiveDept] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [systemStatus, setSystemStatus] = useState('connecting');
  const [showSettings, setShowSettings] = useState(false);
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [integrations, setIntegrations] = useState(0);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const health = await orchestratorClient.getSystemHealth();
        setIntegrations(health.integrations || 0);
        setUptime(health.uptime || 0);
        setSystemStatus(health.status === 'operational' ? 'operational' : 'degraded');
        showToast(`🟢 ${health.integrations} integraciones · ${health.departments} deptos`, 'success');
      } catch(e) {
        setSystemStatus('error');
        showToast('Servidor no disponible', 'error');
      }
    })();
  }, []);

  const handleSend = useCallback(async (e) => {
    e?.preventDefault?.();
    const msg = input.trim();
    if (!msg || loading) return;
    setInput(''); setLoading(true);
    const userMsg = { role:'user', content:msg, ts: Date.now() };
    setChat(c => [...c, userMsg]);

    try {
      const data = await orchestratorClient.processRequest(msg, activeDept, 'cliente');
      const dept = DEPTS.find(d => d.id === (data.department || 'ceo')) || DEPTS[0];
      setChat(c => [...c, {
        role:'assistant',
        content: data.message || data.error || 'Sin respuesta',
        dept: data.department || 'ceo',
        deptName: dept.name,
        deptColor: dept.color,
        integration: data.integration || null,
        ts: Date.now(),
        success: data.success !== false
      }]);
      if (data.integration) showToast(`⚡ ${data.integration.name}`, 'info');
    } catch(err) {
      setChat(c => [...c, { role:'assistant', content:'Error: '+err.message, ts:Date.now(), success:false }]);
    } finally { setLoading(false); }
  }, [input, loading, activeDept]);

  const activeDeptData = DEPTS.find(d => d.id === activeDept);

  return (
    <div className="h-screen flex flex-col bg-[#0a0b0f] text-white overflow-hidden">
      <ToastContainer theme="dark" />
      {/* Voice Canvas: voice en canvas, STT + TTS + waveform, arrastrable */}
      <VoiceCanvas dept={activeDept || 'ceo'} onCommand={(cmd) => {
        showToast(`🎙️ Voz → ${cmd.dept}: "${(cmd.message||'').slice(0,40)}..."`, 'info');
        if (cmd.reply) {
          setChat(prev => [...prev, { role: 'assistant', text: cmd.reply, dept: cmd.dept, source: 'voice' }]);
        }
      }} />
      <header className="h-14 flex items-center justify-between px-4 bg-[#070b1a] border-b border-[#1e2030] shrink-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-[#1e2030] rounded-lg">
            <span className="text-lg">☰</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🦁</span>
            <span className="font-bold bg-gradient-to-r from-[#d4c6a8] to-[#c59b60] bg-clip-text text-transparent text-lg">
              AzurTant PRO
            </span>
            <span className="hidden sm:inline text-[10px] bg-[#c59b60]/20 text-[#d4c6a8] px-2 py-0.5 rounded font-semibold uppercase">
              Enterprise v5.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                const health = await orchestratorClient.getSystemHealth();
                setIntegrations(health.integrations || 0);
                showToast(`🔄 ${health.integrations} integs activas`, 'success');
              } catch { showToast('Error refresh', 'error'); }
            }}
            className="px-3 py-1.5 text-xs rounded-lg bg-[#1a1c24] text-[#d4c6a8] hover:bg-[#c59b60]/20 transition-all"
          >🔄 Refresh</button>

          <div className="flex bg-[#1a1c24] rounded-lg p-0.5">
            {[{ id:'chat', icon:'💬', label:'Chat' }, { id:'dashboard', icon:'📊', label:'Dashboard' }, { id:'enterprise', icon:'🏢', label:'Analytics' }].map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view===v.id ? 'bg-[#c59b60] text-[#070b1a]' : 'text-slate-400 hover:text-white'}`}>
                <span className="mr-1">{v.icon}</span><span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>

          <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ${
            systemStatus==='operational' ? 'bg-emerald-900/30 text-emerald-400' : systemStatus==='degraded' ? 'bg-amber-900/30 text-amber-400' : 'bg-red-900/30 text-red-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${systemStatus==='operational'?'bg-emerald-400 animate-pulse':'bg-amber-400'}`}/>
            {systemStatus==='operational' ? `${integrations} integs` : systemStatus==='degraded' ? 'Degradado' : 'Offline'}
          </div>

          <LanguageSwitcher compact />
          <button onClick={() => { setVoiceEnabled(!voiceEnabled); showToast(voiceEnabled?'Voice OFF':'Voice ON','info'); }}
            className={`p-2 rounded-lg ${voiceEnabled?'bg-red-900/50 text-red-400':'hover:bg-[#1e2030] text-slate-400'}`}>
            {voiceEnabled?'🎤':'🎙️'}
          </button>
          <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-[#1e2030] rounded-lg text-slate-400 hover:text-white">⚙️</button>
          <a href="/agentos" target="_blank" className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#c59b60]/20 text-[#d4c6a8] hover:bg-[#c59b60]/40 border border-[#c59b60]/30 transition-all flex items-center gap-1" title="Abrir AgentOS — León 3D Empresarial">
            🦁 AgentOS
          </a>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && (
          <nav className="w-[220px] bg-[#0d0f14] border-r border-[#1e2030] flex flex-col shrink-0 overflow-hidden">
            <div className="p-3 border-b border-[#1e2030]">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Departamentos</h3>
              <p className="text-[10px] text-slate-600">{DEPTS.length} agentes · {integrations} integs</p>
            </div>
            <div className="flex-1 overflow-y-auto py-1" style={{scrollbarWidth:'thin',scrollbarColor:'#1e2030 transparent'}}>
              <button onClick={() => setActiveDept(null)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all border-l-[3px] ${!activeDept?'bg-blue-900/20 border-blue-500 text-white':'border-transparent text-slate-400 hover:bg-[#1a1c24]/50 hover:text-white'}`}>
                <span className="text-base">🌐</span>
                <div className="flex-1 min-w-0"><p className="text-xs font-semibold">Global Chat</p><p className="text-[10px] text-slate-500">CEO auto-routing</p></div>
              </button>
              {DEPTS.map(d => (
                <button key={d.id} onClick={() => setActiveDept(d.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all border-l-[3px] ${activeDept===d.id?'text-white':'border-transparent text-slate-400 hover:bg-[#1a1c24]/50 hover:text-white'}`}
                  style={activeDept===d.id ? { backgroundColor:d.color+'15', borderColor:d.color } : {}}>
                  <span className="text-base">{d.icon}</span>
                  <div className="flex-1 min-w-0"><p className="text-xs font-semibold">{d.name}</p><p className="text-[10px] text-slate-500 truncate">{d.desc}</p></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"/>
                </button>
              ))}
            </div>
          </nav>
        )}

        <main className="flex-1 flex flex-col overflow-hidden bg-[#0a0b0f]">
          {activeDeptData && (
            <div className="px-6 py-3 border-b border-[#1e2030] flex items-center gap-3 shrink-0"
              style={{ background: `linear-gradient(135deg, ${activeDeptData.color}10, transparent)` }}>
              <span className="text-xl">{activeDeptData.icon}</span>
              <div><h2 className="font-bold text-sm">{activeDeptData.name}</h2><p className="text-[10px] text-slate-500">{activeDeptData.desc}</p></div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[10px] text-slate-500">Estado:</span>
                <span className="text-[10px] bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded">Activo</span>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto" style={{scrollbarWidth:'thin',scrollbarColor:'#1e2030 transparent'}}>
            {view === 'dashboard' && <DashboardView chat={chat} input={input} setInput={setInput} loading={loading} onSend={handleSend} DEPTS={DEPTS} activeDept={activeDept} setActiveDept={setActiveDept} integrations={integrations} uptime={uptime}/>}
            {view === 'chat' && <ChatOnlyView chat={chat} input={input} setInput={setInput} loading={loading} onSend={handleSend} DEPTS={DEPTS}/>}
            {view === 'enterprise' && <EnterpriseView DEPTS={DEPTS} integrations={integrations} uptime={uptime}/>}
            {view === 'landing' && <LandingHero />}
            {view === 'support-n' && <SupportN />}
            {view === 'legal-advisor' && <LegalAdvisor />}
          </div>
        </main>
      </div>
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function DashboardView({ chat, input, setInput, loading, onSend, DEPTS, activeDept, setActiveDept, integrations, uptime }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:'Agentes', value:DEPTS.length, color:'emerald' },
          { label:'Integs', value:integrations, color:'blue' },
          { label:'Uptime', value:Math.floor(uptime/60)+'min', color:'cyan' },
          { label:'Status', value:'Online', color:'amber' },
        ].map(s => (
          <div key={s.label} className="bg-[#111318] border border-[#1e2030] rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-bold mt-1 text-emerald-400">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {DEPTS.map(d => (
          <button key={d.id} onClick={() => setActiveDept(d.id)}
            className={`p-2 rounded-xl border text-center transition-all ${activeDept===d.id?'border-current scale-105':'border-[#1e2030] hover:border-[#2a2d3a]'}`}
            style={activeDept===d.id ? { borderColor:d.color, background:d.color+'12' } : { background:'#111318' }}>
            <span className="text-lg block">{d.icon}</span>
            <p className="text-[9px] font-semibold mt-1 truncate">{d.name}</p>
          </button>
        ))}
      </div>
      <div className="bg-[#111318] border border-[#1e2030] rounded-2xl flex flex-col" style={{ minHeight:'400px' }}>
        <div className="px-5 py-3 border-b border-[#1e2030] flex items-center gap-2">
          <span>💬</span>
          <span className="text-sm font-semibold">{activeDept ? `Chat con ${DEPTS.find(d=>d.id===activeDept)?.name}` : 'Global Chat — CEO Auto-Routing'}</span>
          <span className="text-[10px] text-slate-500 ml-auto">{chat.length} msgs</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{maxHeight:'420px', scrollbarWidth:'thin',scrollbarColor:'#1e2030 transparent'}}>
          {chat.length===0 && (
            <div className="text-center py-12 text-slate-500">
              <p className="text-4xl mb-3">🤖</p>
              <p className="text-sm font-medium">AzurTant PRO a tu servicio</p>
              <p className="text-xs mt-1">Escribe o selecciona un departamento</p>
            </div>
          )}
          {chat.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role==='user'?'justify-end':''}`}>
              {m.role==='assistant' && <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{background:(m.deptColor||'#3B82F6')+'30'}}>{DEPTS.find(d=>d.id===m.dept)?.icon||'🤖'}</div>}
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${m.role==='user'?'bg-blue-600 text-white rounded-br-md':m.success===false?'bg-red-900/30 border border-red-800 text-red-200 rounded-bl-md':'bg-[#1a1c24] border border-[#2a2d3a] text-slate-100 rounded-bl-md'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {m.role==='assistant' && m.deptName && <span className="text-[10px] font-semibold" style={{color:m.deptColor||'#94A3B8'}}>{m.deptName}</span>}
                  <span className="text-[9px] text-slate-600 ml-auto">{new Date(m.ts).toLocaleTimeString()}</span>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              </div>
              {m.role==='user' && <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm shrink-0">👤</div>}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">🤖</div>
              <div className="bg-[#1a1c24] border border-[#2a2d3a] rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">{[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.1}s`}}/>)}</div>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-[#1e2030]">
          <form onSubmit={onSend} className="flex gap-3">
            <input type="text" value={input} onChange={e=>setInput(e.target.value)} disabled={loading}
              placeholder={activeDept ? `Mensaje a ${DEPTS.find(d=>d.id===activeDept)?.name}...` : 'Escribe — el CEO auto-enruta al departamento correcto...'}
              className="flex-1 bg-[#0a0b0f] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
            <button type="submit" disabled={loading||!input.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 px-5 py-3 rounded-xl text-sm font-semibold transition-all shrink-0">
              {loading?'⏳':'Enviar →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ChatOnlyView({ chat, input, setInput, loading, onSend, DEPTS }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-4 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 pb-4" style={{scrollbarWidth:'thin',scrollbarColor:'#1e2030 transparent'}}>
        {chat.length===0 && (
          <div className="text-center py-20 text-slate-500">
            <p className="text-5xl mb-4">🤖</p>
            <p className="font-semibold text-lg text-slate-300">AzurTant PRO Chat</p>
            <p className="text-sm mt-2">Escribe — el CEO enruta automáticamente</p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {['factura CFDI','revisar contrato','estrategia marketing','soporte técnico','cashflow'].map(ex => (
                <button key={ex} onClick={()=>setInput(ex)} className="text-[11px] bg-[#111318] border border-[#2a2d3a] hover:border-blue-700 rounded-lg px-3 py-2 text-slate-400 hover:text-white transition-all">"{ex}"</button>
              ))}
            </div>
          </div>
        )}
        {chat.map((m,i)=>(
          <div key={i} className={`flex gap-3 ${m.role==='user'?'justify-end':''}`}>
            {m.role==='assistant' && <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{background:(m.deptColor||'#3B82F6')+'30'}}>{DEPTS.find(d=>d.id===m.dept)?.icon||'🤖'}</div>}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${m.role==='user'?'bg-blue-600 text-white rounded-br-md':m.success===false?'bg-red-900/30 border border-red-800 text-red-200 rounded-bl-md':'bg-[#111318] border border-[#2a2d3a] text-slate-100 rounded-bl-md'}`}>
              <div className="flex items-center gap-2 mb-1">
                {m.role==='assistant' && m.deptName && <span className="text-[10px] font-semibold" style={{color:m.deptColor||'#94A3B8'}}>{m.deptName}</span>}
                <span className="text-[9px] text-slate-600 ml-auto">{new Date(m.ts).toLocaleTimeString()}</span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
            </div>
            {m.role==='user' && <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">👤</div>}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">🤖</div>
            <div className="bg-[#111318] border border-[#2a2d3a] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">{[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.1}s`}}/>)}</div>
            </div>
          </div>
        )}
      </div>
      <div className="shrink-0 pt-2">
        <form onSubmit={onSend} className="flex gap-3">
          <input value={input} onChange={e=>setInput(e.target.value)} disabled={loading}
            placeholder="Escribe cualquier cosa..."
            className="flex-1 bg-[#0d0f14] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
          <button type="submit" disabled={loading||!input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 px-5 py-3 rounded-xl text-sm font-semibold transition-all shrink-0">
            {loading?'⏳':'Enviar →'}
          </button>
        </form>
      </div>
    </div>
  );
}

function EnterpriseView({ DEPTS, integrations, uptime }) {
  const [data, setData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [d, m, dash] = await Promise.all([
          orchestratorClient.getAnalytics(),
          orchestratorClient.getAnalyticsMetrics(),
          orchestratorClient.getAnalyticsDashboard(),
        ]);
        setData(d); setMetrics(m); setDashboard(dash);
        showToast('📊 Analytics cargados', 'success');
      } catch(e) { showToast('Error cargando analytics', 'error'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center"><p className="text-4xl mb-3">📊</p><p className="text-slate-400">Cargando analytics...</p></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6 overflow-y-auto h-full" style={{scrollbarWidth:'thin',scrollbarColor:'#1e2030 transparent'}}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">🏢 Enterprise Analytics</h2>
          <p className="text-xs text-slate-500">AzurTant PRO · {data?.integrations?.total || integrations} integraciones · {DEPTS.length} deptos</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-slate-500">Health Score</p>
            <p className="text-2xl font-bold text-emerald-400">{dashboard?.healthScore || 98}%</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500">Revenue MRR</p>
            <p className="text-lg font-bold text-[#d4c6a8]">{data?.revenue?.projectedMRR || '$49,999'}</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label:'Integraciones', value:data?.integrations?.total || integrations, icon:'🔌', color:'#06B6D4' },
          { label:'Departamentos', value:data?.integrations?.departments || DEPTS.length, icon:'🏢', color:'#A855F7' },
          { label:'Clientes Activos', value:data?.revenue?.activeClients || 3, icon:'👥', color:'#10B981' },
          { label:'Pipeline', value:data?.revenue?.pipeline || 7, icon:'📈', color:'#F59E0B' },
          { label:'Uptime', value:Math.floor(uptime/3600)+'h', icon:'⏱️', color:'#EC4899' },
        ].map(k => (
          <div key={k.label} className="bg-[#111318] border border-[#1e2030] rounded-xl p-4 hover:border-[#2a2d3a] transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span>{k.icon}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">{k.label}</span>
            </div>
            <p className="text-2xl font-bold" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* System + Revenue Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#111318] border border-[#1e2030] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">🖥️ Sistema</h3>
          <div className="space-y-3">
            {metrics && [
              { label:'CPU', value:metrics.cpu?.cores+' cores', sub:metrics.cpu?.usage },
              { label:'RAM', value:metrics.memory?.process, sub:`${metrics.memory?.free} libres / ${metrics.memory?.total}` },
              { label:'Node', value:data?.system?.node },
              { label:'Platform', value:data?.system?.platform },
              { label:'Process Uptime', value:data?.system?.uptime + 's' },
            ].map(m => (
              <div key={m.label} className="flex justify-between items-center">
                <span className="text-xs text-slate-500">{m.label}</span>
                <div className="text-right">
                  <span className="text-xs text-white">{m.value}</span>
                  {m.sub && <span className="text-[10px] text-slate-600 block">{m.sub}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111318] border border-[#1e2030] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">💼 Revenue & Clientes</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Proyección MRR</span>
              <span className="text-sm font-bold text-[#d4c6a8]">{data?.revenue?.projectedMRR || '$49,999'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Clientes Activos</span>
              <span className="text-sm text-emerald-400">{data?.revenue?.activeClients || 3}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Pipeline</span>
              <span className="text-sm text-amber-400">{data?.revenue?.pipeline || 7}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Avg Response</span>
              <span className="text-sm text-cyan-400">{data?.performance?.avgResponseTime || 120}ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Errors/h</span>
              <span className="text-sm text-red-400">{data?.performance?.errorsLastHour || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Integrations by Department */}
      <div className="bg-[#111318] border border-[#1e2030] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">🔌 Integraciones por Departamento</h3>
        <div className="grid grid-cols-4 gap-3">
          {data?.integrations?.byDepartment ? Object.entries(data.integrations.byDepartment).map(([dept, info]) => {
            const deptData = DEPTS.find(d => d.id === dept);
            return (
              <div key={dept} className="bg-[#0a0b0f] border border-[#1e2030] rounded-lg p-3 flex items-center gap-3">
                <span className="text-lg">{deptData?.icon || '📦'}</span>
                <div>
                  <p className="text-xs font-semibold text-white">{deptData?.name || dept}</p>
                  <p className="text-[10px] text-slate-500">{info.count} integs · {info.avgLatency}ms avg</p>
                </div>
              </div>
            );
          }) : DEPTS.slice(0,14).map(d => (
            <div key={d.id} className="bg-[#0a0b0f] border border-[#1e2030] rounded-lg p-3 flex items-center gap-3 opacity-50">
              <span className="text-lg">{d.icon}</span>
              <div>
                <p className="text-xs font-semibold text-white">{d.name}</p>
                <p className="text-[10px] text-slate-500">Cargando...</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#111318] border border-[#1e2030] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">📋 Actividad Reciente</h3>
        <div className="space-y-2">
          {(dashboard?.recentActivity || [
            { type:'system', name:'Sistema estable', dept:'ceo', time:'ahora', status:'success' }
          ]).map((act, i) => {
            const deptData = DEPTS.find(d => d.id === act.dept);
            return (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-[#1e2030] last:border-0">
                <span className={`w-2 h-2 rounded-full ${act.status === 'success' ? 'bg-emerald-400' : act.status === 'warning' ? 'bg-amber-400' : 'bg-red-400'}`} />
                <span className="text-xs text-slate-400 capitalize w-20">{act.type}</span>
                <span className="text-xs text-white flex-1">{act.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded" style={{background:(deptData?.color||'#64748B')+'20', color:deptData?.color||'#94A3B8'}}>{deptData?.name || act.dept}</span>
                <span className="text-[10px] text-slate-600 w-20 text-right">{act.time}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alertas */}
      {dashboard?.alerts?.length > 0 && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-red-400 mb-2">🚨 Alertas</h3>
          {dashboard.alerts.map((a,i) => (
            <p key={i} className="text-xs text-red-300">{a.message || a}</p>
          ))}
        </div>
      )}
    </div>
  );
}
