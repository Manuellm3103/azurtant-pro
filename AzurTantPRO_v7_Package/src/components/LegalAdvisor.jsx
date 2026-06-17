/**
 * AzurTant PRO — UI: Legal Advisor
 * =================================
 * Analiza contratos con /api/legal/analyze-contract.
 * Muestra verdict, red flags, scores, sugerencias de negociación.
 */
import React, { useState } from 'react';

const API = '/api/legal';

export default function LegalAdvisor() {
  const [contractText, setContractText] = useState('');
  const [contractType, setContractType] = useState('');
  const [language, setLanguage] = useState('es');
  const [useOllama, setUseOllama] = useState(true);
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  React.useEffect(() => { fetch(`${API}/stats`).then(r => r.json()).then(setStats).catch(() => {}); }, [result]);

  const analyze = async () => {
    if (contractText.length < 50) { setMsg('Mínimo 50 caracteres'); return; }
    setLoading(true); setMsg(''); setResult(null);
    try {
      const r = await fetch(`${API}/analyze-contract`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractText, contractType: contractType || undefined, language, useOllama }),
      }).then(r => r.json());
      if (r.success) setResult(r);
      else setMsg('Error: ' + r.error);
    } catch (e) { setMsg('Error: ' + e.message); }
    finally { setLoading(false); }
  };

  const sampleContract = `CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES

Entre la Empresa Emanuel Azur Corporativo S.A. de C.V. (en adelante "El Cliente") y el Prestador de Servicios.

Vigencia: 1 año a partir de la fecha de firma.
Terminación: cualquier parte puede terminar el contrato con 5 días de preaviso por escrito de forma unilateral.
Responsabilidad: el Prestador responde ilimitadamente por cualquier daño, pérdida o defecto, sin tope máximo.
Propiedad intelectual: todo lo creado durante la vigencia del contrato, incluyendo trabajo personal y tiempo libre, es propiedad del Cliente.
No competencia: el Prestador no puede trabajar en el mismo sector durante 5 años en cualquier país del mundo.
Pago: a 60 días sin intereses moratorios.
Auto-renovación: el contrato se renueva automáticamente por períodos iguales salvo aviso con 15 días de anticipación.
Confidencialidad: el Prestador mantiene confidencialidad perpetua sobre toda información del Cliente, incluso información pública.
Ley aplicable: leyes del estado de California, EUA.
Resolución de disputas: tribunales exclusivos de San Francisco, EUA.`;

  const loadSample = () => setContractText(sampleContract);

  const verdictColor = (v) => ({ 'SIGN': '#10B981', 'NEGOTIATE': '#F59E0B', 'REJECT': '#EF4444' }[v] || '#888');
  const levelColor = (l) => ({ 'LOW': '#10B981', 'MEDIUM': '#3B82F6', 'HIGH': '#F59E0B', 'CRITICAL': '#EF4444' }[l] || '#888');

  return (
    <div style={{ padding: 24, color: '#FFF', background: '#0a0a0a', minHeight: '100vh' }}>
      <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, textTransform: 'uppercase' }}>⚖️ Legal Advisor</h2>
      <p style={{ color: '#999', marginBottom: 16 }}>Análisis de contratos con IA · 9 categorías · 6 red flags automáticos · Verdict SIGN / NEGOTIATE / REJECT</p>
      {stats && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, fontSize: 12, color: '#999' }}>
          <span>📊 {stats.total} contratos analizados</span>
          <span style={{ color: '#10B981' }}>✓ {stats.byVerdict?.SIGN || 0} SIGN</span>
          <span style={{ color: '#F59E0B' }}>⚠ {stats.byVerdict?.NEGOTIATE || 0} NEGOTIATE</span>
          <span style={{ color: '#EF4444' }}>✗ {stats.byVerdict?.REJECT || 0} REJECT</span>
        </div>
      )}

      <div style={{ background: '#1a1a1a', padding: 20, borderRadius: 8, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: 8, marginBottom: 8 }}>
          <select value={contractType} onChange={e => setContractType(e.target.value)} style={inp}>
            <option value="">Tipo (auto)</option>
            <option value="Employment Agreement">Empleo</option>
            <option value="Service Agreement">Servicios</option>
            <option value="NDA">NDA</option>
            <option value="Lease">Arrendamiento</option>
            <option value="Freelance Agreement">Freelance</option>
            <option value="Partnership Agreement">Sociedad</option>
          </select>
          <select value={language} onChange={e => setLanguage(e.target.value)} style={inp}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FFF' }}>
            <input type="checkbox" checked={useOllama} onChange={e => setUseOllama(e.target.checked)} /> Usar Ollama
          </label>
          <button onClick={loadSample} style={{ padding: 10, background: '#333', color: '#FFF', border: 'none', borderRadius: 4, cursor: 'pointer' }}>📋 Cargar ejemplo</button>
          <button onClick={analyze} disabled={loading} style={{ padding: 10, background: '#FFD400', color: '#000', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}>
            {loading ? '⏳ Analizando...' : '🔍 ANALIZAR'}
          </button>
        </div>
        <textarea value={contractText} onChange={e => setContractText(e.target.value)} placeholder="Pega el texto del contrato aquí (mínimo 50 caracteres)..." style={{ ...inp, minHeight: 200, fontFamily: 'monospace' }} />
        {msg && <div style={{ marginTop: 8, color: '#EF4444' }}>{msg}</div>}
      </div>

      {result && (
        <div style={{ background: '#1a1a1a', padding: 20, borderRadius: 8 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <div style={{ padding: '8px 16px', background: verdictColor(result.verdict), color: '#FFF', borderRadius: 4, fontSize: 18, fontWeight: 900 }}>{result.verdict}</div>
            <div style={{ padding: '8px 16px', background: levelColor(result.level), color: '#FFF', borderRadius: 4, fontSize: 14, fontWeight: 700 }}>{result.level}</div>
            <div style={{ color: '#999' }}>Overall: <strong style={{ color: '#FFF' }}>{result.overall}/10</strong></div>
            <div style={{ color: '#999' }}>{result.wordCount} palabras · {result.elapsedMs}ms · {result.model}</div>
          </div>

          {result.redFlags && result.redFlags.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ color: '#EF4444', marginTop: 0 }}>🚩 Red Flags Detectados ({result.redFlags.length})</h3>
              {result.redFlags.map(rf => (
                <div key={rf.id} style={{ padding: 8, marginBottom: 4, background: '#2a1a1a', borderLeft: `4px solid ${rf.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B'}`, borderRadius: 4 }}>
                  <strong>[{rf.severity}]</strong> {rf.label}
                </div>
              ))}
            </div>
          )}

          <h3>📊 Scores por Categoría (1-10)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
            {Object.entries(result.categoryScores).map(([k, v]) => (
              <div key={k} style={{ background: '#0a0a0a', padding: 8, borderRadius: 4 }}>
                <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase' }}>{k}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: '#222', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${v * 10}%`, height: '100%', background: v >= 7 ? '#EF4444' : v >= 5 ? '#F59E0B' : '#10B981' }} />
                  </div>
                  <span style={{ fontWeight: 700, color: '#FFF' }}>{v}</span>
                </div>
              </div>
            ))}
          </div>

          {result.negotiationSuggestions && result.negotiationSuggestions.length > 0 && (
            <>
              <h3 style={{ marginTop: 20 }}>💬 Sugerencias de Negociación</h3>
              {result.negotiationSuggestions.map(s => (
                <div key={s.category} style={{ padding: 10, marginBottom: 6, background: '#0a0a0a', borderRadius: 4, borderLeft: '4px solid #F59E0B' }}>
                  <strong>{s.label}</strong> (score: {s.score})<br />
                  <span style={{ color: '#999' }}>{s.suggestion}</span>
                </div>
              ))}
            </>
          )}

          <div style={{ marginTop: 16, padding: 10, background: '#1a0a0a', borderRadius: 4, fontSize: 12, color: '#F59E0B', border: '1px solid #F59E0B' }}>
            ⚠️ {result.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
}

const inp = { padding: 10, background: '#0a0a0a', border: '1px solid #333', color: '#FFF', borderRadius: 4, width: '100%' };
