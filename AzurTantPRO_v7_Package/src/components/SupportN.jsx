/**
 * AzurTant PRO — UI: Soporte N1/N2/N3
 * =====================================
 * Conecta con /api/support/* para crear, listar, escalar, resolver tickets.
 * Auto-refresh cada 15s.
 */
import React, { useState, useEffect } from 'react';

const API = '/api/support';

export default function SupportN() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({ status: '', level: '' });
  const [newTicket, setNewTicket] = useState({ title: '', description: '', severity: 'P3-med', dept: 'tecnologia' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.level) params.set('level', filter.level);
      const [tRes, sRes] = await Promise.all([
        fetch(`${API}/tickets?${params}`).then(r => r.json()),
        fetch(`${API}/stats`).then(r => r.json()),
      ]);
      setTickets(tRes.tickets || []);
      setStats(sRes);
    } catch (e) { setMsg('Error cargando: ' + e.message); }
  };

  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i); }, [filter.status, filter.level]);

  const create = async () => {
    if (!newTicket.title) { setMsg('Título requerido'); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/ticket`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket),
      }).then(r => r.json());
      if (r.success) {
        setMsg(`✓ Ticket ${r.ticket.id} creado (${r.ticket.level})${r.autoResolution?.resolved ? ' — auto-resuelto' : ''}${r.alert ? ' — ' + r.alert : ''}`);
        setNewTicket({ title: '', description: '', severity: 'P3-med', dept: 'tecnologia' });
        load();
      } else { setMsg('Error: ' + r.error); }
    } finally { setLoading(false); }
  };

  const escalate = async (id) => {
    const r = await fetch(`${API}/ticket/${id}/escalate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(r => r.json());
    if (r.success) { setMsg(`✓ ${id} → ${r.ticket.level}${r.alert ? ' — ' + r.alert : ''}`); load(); }
  };

  const resolve = async (id) => {
    const r = await fetch(`${API}/ticket/${id}/resolve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resolution: 'Resuelto por Manuel' }) }).then(r => r.json());
    if (r.success) { setMsg(`✓ ${id} resuelto`); load(); }
  };

  const sevColor = (s) => ({ 'P1-critical': '#EF4444', 'P2-high': '#F59E0B', 'P3-med': '#3B82F6', 'P4-low': '#10B981' }[s] || '#888');
  const levelColor = (l) => ({ 'N1': '#10B981', 'N2': '#F59E0B', 'N3': '#EF4444' }[l] || '#888');

  return (
    <div style={{ padding: 24, color: '#FFF', background: '#0a0a0a', minHeight: '100vh' }}>
      <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, textTransform: 'uppercase' }}>🛠️ Soporte N1/N2/N3</h2>
      <p style={{ color: '#999', marginBottom: 24 }}>Tecnología con escalación automática · SLA: N1&lt;1h · N2&lt;4h · N3&lt;1h (CEO alert)</p>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            ['Total', stats.total, '#FFD400'],
            ['Abiertos', stats.open, '#3B82F6'],
            ['Resueltos', stats.resolved, '#10B981'],
            ['Vencidos', stats.overdue, '#EF4444'],
            ['N3 activos', stats.n3Alerts, '#EF4444'],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background: '#1a1a1a', padding: 16, borderRadius: 8, borderLeft: `4px solid ${color}` }}>
              <div style={{ fontSize: 28, fontWeight: 900, color }}>{val}</div>
              <div style={{ fontSize: 12, color: '#999', textTransform: 'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: '#1a1a1a', padding: 20, borderRadius: 8, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, fontSize: 18, fontWeight: 700 }}>+ Nuevo Ticket</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8 }}>
          <input placeholder="Título del problema" value={newTicket.title} onChange={e => setNewTicket({ ...newTicket, title: e.target.value })}
            style={{ padding: 10, background: '#0a0a0a', border: '1px solid #333', color: '#FFF', borderRadius: 4 }} />
          <select value={newTicket.severity} onChange={e => setNewTicket({ ...newTicket, severity: e.target.value })}
            style={{ padding: 10, background: '#0a0a0a', border: '1px solid #333', color: '#FFF', borderRadius: 4 }}>
            <option value="P4-low">P4-low (N1)</option>
            <option value="P3-med">P3-med (N1)</option>
            <option value="P2-high">P2-high (N2)</option>
            <option value="P1-critical">P1-critical (N3) 🚨</option>
          </select>
          <select value={newTicket.dept} onChange={e => setNewTicket({ ...newTicket, dept: e.target.value })}
            style={{ padding: 10, background: '#0a0a0a', border: '1px solid #333', color: '#FFF', borderRadius: 4 }}>
            <option value="tecnologia">Tecnología</option>
            <option value="operaciones">Operaciones</option>
            <option value="seguridad">Seguridad</option>
            <option value="marketing">Marketing</option>
          </select>
          <button onClick={create} disabled={loading}
            style={{ padding: 10, background: '#FFD400', color: '#000', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}>
            {loading ? '...' : 'CREAR'}
          </button>
        </div>
        <textarea placeholder="Descripción (opcional)" value={newTicket.description} onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
          style={{ width: '100%', padding: 10, background: '#0a0a0a', border: '1px solid #333', color: '#FFF', borderRadius: 4, marginTop: 8, minHeight: 60 }} />
        {msg && <div style={{ marginTop: 8, padding: 8, background: '#222', borderRadius: 4, fontSize: 13 }}>{msg}</div>}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setFilter({ status: '', level: '' })} style={btnStyle(filter.status === '' && filter.level === '')}>Todos</button>
        <button onClick={() => setFilter({ status: 'open', level: '' })} style={btnStyle(filter.status === 'open')}>Abiertos</button>
        <button onClick={() => setFilter({ status: 'open', level: 'N3' })} style={btnStyle(filter.level === 'N3')}>N3 activos</button>
        <button onClick={() => setFilter({ status: '', level: 'N1' })} style={btnStyle(filter.level === 'N1')}>Solo N1</button>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {tickets.length === 0 && <div style={{ color: '#666', textAlign: 'center', padding: 40 }}>No hay tickets con esos filtros</div>}
        {tickets.map(t => (
          <div key={t.id} style={{ background: '#1a1a1a', padding: 14, borderRadius: 6, borderLeft: `4px solid ${levelColor(t.level)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ background: sevColor(t.severity), color: '#FFF', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{t.severity}</span>
                <span style={{ background: levelColor(t.level), color: '#FFF', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{t.level}</span>
                <span style={{ color: '#666', fontSize: 11 }}>{t.id}</span>
                <span style={{ color: '#666', fontSize: 11 }}>{t.dept}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{t.title}</div>
              {t.description && <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{t.description}</div>}
              <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>SLA: {t.sla_hours}h · Restante: {t.sla_remaining_hours}h · Estado: {t.status}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {t.level !== 'N3' && t.status === 'open' && (
                <button onClick={() => escalate(t.id)} style={{ padding: '6px 12px', background: '#F59E0B', color: '#000', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>↑ Escalar</button>
              )}
              {t.status === 'open' && (
                <button onClick={() => resolve(t.id)} style={{ padding: '6px 12px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✓ Resolver</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const btnStyle = (active) => ({
  padding: '6px 14px',
  background: active ? '#FFD400' : '#1a1a1a',
  color: active ? '#000' : '#FFF',
  border: '1px solid #333',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
});
