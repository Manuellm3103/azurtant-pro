/**
 * AzurTant PRO — Landing Hero estilo Marblism
 * =============================================
 * Paleta y tipografía inspiradas en marblism.com:
 *   - Fondo principal: #191919 (oscuro profundo)
 *   - Acento: #FFD400 (amarillo vibrante)
 *   - Texto: #FFFFFF
 *   - Font-display: bold + uppercase
 *   - Font-heading: bold + line-tight
 *
 * Secciones:
 *   1. Hero "Tu Equipo de IA Para Escalar Tu Negocio"
 *   2. Grid de 14 departamentos como AI Employees
 *   3. CTA final
 */
import React from 'react';

const DEPARTMENTS = [
  { id: 'ceo', label: 'CEO', desc: 'Estrategia y BI', icon: '👑' },
  { id: 'finanzas', label: 'Finanzas', desc: 'CFDI 4.0, nóminas, flujo', icon: '💰' },
  { id: 'legal', label: 'Legal', desc: 'Contratos y compliance', icon: '⚖️' },
  { id: 'marketing', label: 'Marketing', desc: 'Campañas y contenido', icon: '📣' },
  { id: 'ventas', label: 'Ventas', desc: 'Pipeline y forecasting', icon: '📈' },
  { id: 'operaciones', label: 'Operaciones', desc: 'Logística y calidad', icon: '⚙️' },
  { id: 'rrhh', label: 'RRHH', desc: 'Nómina y NOM-035', icon: '👥' },
  { id: 'tecnologia', label: 'Tecnología', desc: 'Soporte N1/N2/N3', icon: '🛠️' },
  { id: 'seguridad', label: 'Seguridad', desc: 'Ciberseguridad OWASP', icon: '🛡️' },
  { id: 'compras', label: 'Compras', desc: 'Proveedores y RFQ', icon: '🛒' },
  { id: 'sysadmin', label: 'Sysadmin', desc: 'Infra y backups', icon: '🖥️' },
  { id: 'innovacion', label: 'Innovación', desc: 'Research y trends', icon: '💡' },
  { id: 'redes', label: 'Redes', desc: 'Social media scheduler', icon: '📱' },
  { id: 'propuestas', label: 'Propuestas', desc: 'Cotizaciones B2B/B2C', icon: '📄' },
];

export default function LandingHero() {
  return (
    <div className="azt-landing">
      {/* HERO */}
      <section className="azt-hero">
        <div className="azt-hero-inner">
          <h1 className="azt-hero-title">
            Tu Equipo de IA Para Escalar Tu Negocio
          </h1>
          <p className="azt-hero-subtitle">
            14 departamentos automatizados. Cero empleados. Producción comercial con IA Ollama Cloud + Local.
          </p>
          <div className="azt-hero-cta">
            <button className="azt-cta-primary">Empieza Gratis</button>
            <button className="azt-cta-secondary">Ver Demo →</button>
          </div>
          <div className="azt-hero-stats">
            <div><strong>14</strong><span>Departamentos IA</span></div>
            <div><strong>17</strong><span>Modelos Ollama</span></div>
            <div><strong>23</strong><span>Skills listas</span></div>
            <div><strong>300+</strong><span>Endpoints API</span></div>
          </div>
        </div>
      </section>

      {/* GRID DEPARTAMENTOS */}
      <section className="azt-depts">
        <h2 className="azt-section-title">Conoce a tu nuevo equipo de IA</h2>
        <div className="azt-dept-grid">
          {DEPARTMENTS.map(d => (
            <div key={d.id} className="azt-dept-card">
              <div className="azt-dept-icon">{d.icon}</div>
              <h3 className="azt-dept-label">{d.label}</h3>
              <p className="azt-dept-desc">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="azt-cta-final">
        <h2 className="azt-section-title">Deja de hacer malabares.</h2>
        <p className="azt-cta-text">CEO, marketero, vendedor, gerente de operaciones... Ya no.</p>
        <button className="azt-cta-primary azt-cta-large">Activar Mi Equipo de IA →</button>
      </section>
    </div>
  );
}
