/**
 * AzurTant PRO — Batería 100 Casos de Vida Real
 *
 * Categorías:
 *   1-15  · CEO / Estrategia
 *  16-30  · Finanzas (CFDI, nóminas, SAT, conciliaciones)
 *  31-40  · Operaciones / Logística / Inventario
 *  41-50  · Legal / Contratos / Compliance
 *  51-60  · RRHH (reclutamiento, onboarding, nómina, finiquitos)
 *  61-70  · Tecnología (soporte N1-N5, sysadmin, redes, seguridad)
 *  71-80  · Marketing (branding, contenido, SEO/SEM, redes)
 *  81-90  · Ventas (CRM, propuestas, cierres, post-venta)
 *  91-95  · Compras (proveedores, RFQs, RFPs)
 *  96-100 · Cross-department / Edge cases / Stress
 *
 * Cada test: { id, input, expectedDept, expectSuccess, timeoutMs, validate }
 */

export const TEST_CASES = [
  // ════════════════════════════════════════════════════════════
  // 1-15: CEO / ESTRATEGIA
  // ════════════════════════════════════════════════════════════
  { id: 1,  cat: 'ceo', input: '¿Cuál debería ser la estrategia de la empresa para el próximo trimestre?', expectedDept: 'ceo', expectSuccess: true },
  { id: 2,  cat: 'ceo', input: 'Necesito una visión general de cómo vamos', expectedDept: 'ceo', expectSuccess: true },
  { id: 3,  cat: 'ceo', input: 'Dame un consejo sobre si debemos expandir a Colombia', expectedDept: 'ceo', expectSuccess: true },
  { id: 4,  cat: 'ceo', input: '¿Qué dirección deberíamos tomar para el Q3?', expectedDept: 'ceo', expectSuccess: true },
  { id: 5,  cat: 'ceo', input: 'Resume los KPIs principales de la empresa', expectedDept: 'ceo', expectSuccess: true },
  { id: 6,  cat: 'ceo', input: 'Coordinación entre departamentos para el lanzamiento del nuevo producto', expectedDept: 'ceo', expectSuccess: true },
  { id: 7,  cat: 'ceo', input: 'Plan estratégico 2026-2027 con hitos trimestrales', expectedDept: 'ceo', expectSuccess: true },
  { id: 8,  cat: 'ceo', input: 'Necesito un SWOT analysis de la empresa', expectedDept: 'ceo', expectSuccess: true },
  { id: 9,  cat: 'ceo', input: '¿Cómo nos comparamos con la competencia?', expectedDept: 'ceo', expectSuccess: true },
  { id: 10, cat: 'ceo', input: 'Dame un plan para reducir churn 20%', expectedDept: 'ceo', expectSuccess: true },
  { id: 11, cat: 'ceo', input: 'Necesito la visión de la empresa para inversionistas', expectedDept: 'ceo', expectSuccess: true },
  { id: 12, cat: 'ceo', input: 'Reporte ejecutivo mensual', expectedDept: 'ceo', expectSuccess: true },
  { id: 13, cat: 'ceo', input: '¿Cuál es la estrategia de retención de talento?', expectedDept: 'ceo', expectSuccess: true },
  { id: 14, cat: 'ceo', input: 'Quiero agendar un board meeting para revisar Q2', expectedDept: 'ceo', expectSuccess: true },
  { id: 15, cat: 'ceo', input: 'Dame los objetivos OKR del próximo trimestre', expectedDept: 'ceo', expectSuccess: true },

  // ════════════════════════════════════════════════════════════
  // 16-30: FINANZAS
  // ════════════════════════════════════════════════════════════
  { id: 16, cat: 'finanzas', input: 'Necesito una factura CFDI para cliente Acme Corp por $50,000 MXN', expectedDept: 'finanzas', expectSuccess: true },
  { id: 17, cat: 'finanzas', input: '¿Cómo va el flujo de caja este mes?', expectedDept: 'finanzas', expectSuccess: true },
  { id: 18, cat: 'finanzas', input: 'Dame el balance general al cierre de mayo', expectedDept: 'finanzas', expectSuccess: true },
  { id: 19, cat: 'finanzas', input: 'Conciliación bancaria de la cuenta 1234 del Banco Azteca', expectedDept: 'finanzas', expectSuccess: true },
  { id: 20, cat: 'finanzas', input: 'Calcula el impuesto ISR del primer trimestre', expectedDept: 'finanzas', expectSuccess: true },
  { id: 21, cat: 'finanzas', input: 'Necesito timbrar la nómina de los 8 empleados', expectedDept: 'finanzas', expectSuccess: true },
  { id: 22, cat: 'finanzas', input: '¿Cuánto debo cobrarle al cliente Bimbo Sur?', expectedDept: 'finanzas', expectSuccess: true },
  { id: 23, cat: 'finanzas', input: 'Pagar al proveedor Office Depot la factura 9982', expectedDept: 'finanzas', expectSuccess: true },
  { id: 24, cat: 'finanzas', input: 'Genera el complemento de pago para el CFDI 4.0', expectedDept: 'finanzas', expectSuccess: true },
  { id: 25, cat: 'finanzas', input: '¿Cuál es el presupuesto restante de marketing?', expectedDept: 'finanzas', expectSuccess: true },
  { id: 26, cat: 'finanzas', input: 'Dame el reporte de cuentas por cobrar vencidas', expectedDept: 'finanzas', expectSuccess: true },
  { id: 27, cat: 'finanzas', input: '¿Cuánto IVA tengo que pagar al SAT este mes?', expectedDept: 'finanzas', expectSuccess: true },
  { id: 28, cat: 'finanzas', input: 'Necesito cancelar el CFDI folio A-2451 del cliente X', expectedDept: 'finanzas', expectSuccess: true },
  { id: 29, cat: 'finanzas', input: 'Calcula la depreciación del equipo de cómputo', expectedDept: 'finanzas', expectSuccess: true },
  { id: 30, cat: 'finanzas', input: 'Proyección financiera a 12 meses con 3 escenarios', expectedDept: 'finanzas', expectSuccess: true },

  // ════════════════════════════════════════════════════════════
  // 31-40: OPERACIONES
  // ════════════════════════════════════════════════════════════
  { id: 31, cat: 'operaciones', input: 'Optimiza el proceso de onboarding de clientes nuevos', expectedDept: 'operaciones', expectSuccess: true },
  { id: 32, cat: 'operaciones', input: '¿Cómo está el inventario de la bodega principal?', expectedDept: 'operaciones', expectSuccess: true },
  { id: 33, cat: 'operaciones', input: 'Necesito un workflow para gestión de pedidos', expectedDept: 'operaciones', expectSuccess: true },
  { id: 34, cat: 'operaciones', input: 'Logística de envío para 200 paquetes a Guadalajara', expectedDept: 'operaciones', expectSuccess: true },
  { id: 35, cat: 'operaciones', input: 'Control de calidad: tenemos 3% de defectos en línea 2', expectedDept: 'operaciones', expectSuccess: true },
  { id: 36, cat: 'operaciones', input: 'Producción: ¿cuántas unidades podemos fabricar la próxima semana?', expectedDept: 'operaciones', expectSuccess: true },
  { id: 37, cat: 'operaciones', input: 'Reporte de operación mensual', expectedDept: 'operaciones', expectSuccess: true },
  { id: 38, cat: 'operaciones', input: 'Necesito reordenar tornillos M8, estamos bajos', expectedDept: 'operaciones', expectSuccess: true },
  { id: 39, cat: 'operaciones', input: 'Auditoría de procesos del área de manufactura', expectedDept: 'operaciones', expectSuccess: true },
  { id: 40, cat: 'operaciones', input: 'Mapa de procesos para certificación ISO 9001', expectedDept: 'operaciones', expectSuccess: true },

  // ════════════════════════════════════════════════════════════
  // 41-50: LEGAL
  // ════════════════════════════════════════════════════════════
  { id: 41, cat: 'legal', input: 'Redacta un contrato de prestación de servicios profesionales', expectedDept: 'legal', expectSuccess: true },
  { id: 42, cat: 'legal', input: 'Necesito revisar el NDA con el proveedor de IA', expectedDept: 'legal', expectSuccess: true },
  { id: 43, cat: 'legal', input: '¿Qué ley aplica para protección de datos en México (LFPDPPP)?', expectedDept: 'legal', expectSuccess: true },
  { id: 44, cat: 'legal', input: 'Compliance: revisemos las políticas de privacidad', expectedDept: 'legal', expectSuccess: true },
  { id: 45, cat: 'legal', input: '¿Cuáles son las obligaciones legales de una SA de CV?', expectedDept: 'legal', expectSuccess: true },
  { id: 46, cat: 'legal', input: 'Necesito un poder notarial para representar a la empresa', expectedDept: 'legal', expectSuccess: true },
  { id: 47, cat: 'legal', input: 'Revisar contrato de arrendamiento de la nueva oficina', expectedDept: 'legal', expectSuccess: true },
  { id: 48, cat: 'legal', input: 'Demanda: nos están reclamando $200K por incumplimiento', expectedDept: 'legal', expectSuccess: true },
  { id: 49, cat: 'legal', input: 'Norma NOM-035: programa de clima laboral', expectedDept: 'legal', expectSuccess: true },
  { id: 50, cat: 'legal', input: 'Contrato laboral para nuevo director de ventas', expectedDept: 'legal', expectSuccess: true },

  // ════════════════════════════════════════════════════════════
  // 51-60: RRHH
  // ════════════════════════════════════════════════════════════
  { id: 51, cat: 'rrhh', input: 'Necesito reclutar un desarrollador senior React', expectedDept: 'rrhh', expectSuccess: true },
  { id: 52, cat: 'rrhh', input: 'Onboarding del nuevo contador que entra el lunes', expectedDept: 'rrhh', expectSuccess: true },
  { id: 53, cat: 'rrhh', input: 'Calcula el finiquito de María que renunció ayer', expectedDept: 'rrhh', expectSuccess: true },
  { id: 54, cat: 'rrhh', input: 'Capacitación en Excel avanzado para el equipo administrativo', expectedDept: 'rrhh', expectSuccess: true },
  { id: 55, cat: 'rrhh', input: 'Encuesta de clima laboral 2026', expectedDept: 'rrhh', expectSuccess: true },
  { id: 56, cat: 'rrhh', input: 'Política de vacaciones: cuánto le toca a cada empleado', expectedDept: 'rrhh', expectSuccess: true },
  { id: 57, cat: 'rrhh', input: 'Necesito contratar a 3 personas para el call center', expectedDept: 'rrhh', expectSuccess: true },
  { id: 58, cat: 'rrhh', input: 'Evaluación de desempeño del equipo de ventas', expectedDept: 'rrhh', expectSuccess: true },
  { id: 59, cat: 'rrhh', input: 'Plan de compensación variable para el equipo comercial', expectedDept: 'rrhh', expectSuccess: true },
  { id: 60, cat: 'rrhh', input: 'Renuncia de Juan Pérez - cálculo de prestaciones', expectedDept: 'rrhh', expectSuccess: true },

  // ════════════════════════════════════════════════════════════
  // 61-70: TECNOLOGÍA
  // ════════════════════════════════════════════════════════════
  { id: 61, cat: 'tecnologia', input: 'Soporte N1: no me anda el correo electrónico', expectedDept: 'tecnologia', expectSuccess: true },
  { id: 62, cat: 'tecnologia', input: 'El servidor de la oficina está caído, ayuda', expectedDept: 'tecnologia', expectSuccess: true },
  { id: 63, cat: 'tecnologia', input: 'La red WiFi está muy lenta en la sala de juntas', expectedDept: 'tecnologia', expectSuccess: true },
  { id: 64, cat: 'tecnologia', input: 'Bug crítico: los clientes no pueden pagar en el portal', expectedDept: 'tecnologia', expectSuccess: true },
  { id: 65, cat: 'tecnologia', input: 'Ciberseguridad: detectamos intentos de phishing', expectedDept: 'tecnologia', expectSuccess: true },
  { id: 66, cat: 'tecnologia', input: 'Mi laptop no enciende, necesito soporte urgente', expectedDept: 'tecnologia', expectSuccess: true },
  { id: 67, cat: 'tecnologia', input: 'Configura VPN para que los remotos puedan entrar', expectedDept: 'tecnologia', expectSuccess: true },
  { id: 68, cat: 'tecnologia', input: 'Auditoría de seguridad para cumplir SOC2', expectedDept: 'tecnologia', expectSuccess: true },
  { id: 69, cat: 'tecnologia', input: 'Migración de Office 365 a Google Workspace', expectedDept: 'tecnologia', expectSuccess: true },
  { id: 70, cat: 'tecnologia', input: 'El sistema SAP no responde, error 500 en /api/invoices', expectedDept: 'tecnologia', expectSuccess: true },

  // ════════════════════════════════════════════════════════════
  // 71-80: MARKETING
  // ════════════════════════════════════════════════════════════
  { id: 71, cat: 'marketing', input: 'Estrategia de marketing digital para Q3 2026', expectedDept: 'marketing', expectSuccess: true },
  { id: 72, cat: 'marketing', input: 'Campaña de branding en LinkedIn para posicionar la marca', expectedDept: 'marketing', expectSuccess: true },
  { id: 73, cat: 'marketing', input: 'Optimización SEO de la landing page', expectedDept: 'marketing', expectSuccess: true },
  { id: 74, cat: 'marketing', input: 'Crear contenido para el blog: 5 posts sobre IA para PyMEs', expectedDept: 'marketing', expectSuccess: true },
  { id: 75, cat: 'marketing', input: 'CAC actual: $1,200 MXN. ¿Cómo lo bajamos a $800?', expectedDept: 'marketing', expectSuccess: true },
  { id: 76, cat: 'marketing', input: 'ROAS de 2.5x en Meta Ads, ¿es bueno?', expectedDept: 'marketing', expectSuccess: true },
  { id: 77, cat: 'marketing', input: 'Plan de email marketing para 5000 suscriptores inactivos', expectedDept: 'marketing', expectSuccess: true },
  { id: 78, cat: 'marketing', input: 'Lead magnet: ebook de 20 páginas sobre CFDI 4.0', expectedDept: 'marketing', expectSuccess: true },
  { id: 79, cat: 'marketing', input: 'MQL a SQL: convertimos 12%, queremos llegar a 25%', expectedDept: 'marketing', expectSuccess: true },
  { id: 80, cat: 'marketing', input: 'Presupuesto de marketing 2026: $1.2M MXN, cómo lo distribuimos', expectedDept: 'marketing', expectSuccess: true },

  // ════════════════════════════════════════════════════════════
  // 81-90: VENTAS
  // ════════════════════════════════════════════════════════════
  { id: 81, cat: 'ventas', input: 'Lead nuevo: Innovatech SA, presupuesto $250K, contacto Juan Pérez', expectedDept: 'ventas', expectSuccess: true },
  { id: 82, cat: 'ventas', input: 'Cotización para cliente Bimbo: 50 licencias Pro', expectedDept: 'ventas', expectSuccess: true },
  { id: 83, cat: 'ventas', input: 'Pipeline de ventas del mes: 23 oportunidades, $4.5M', expectedDept: 'ventas', expectSuccess: true },
  { id: 84, cat: 'ventas', input: 'LTV del cliente promedio: $180K. ¿Cómo lo subimos?', expectedDept: 'ventas', expectSuccess: true },
  { id: 85, cat: 'ventas', input: 'Cierre: cliente Femsa firmó por $850K MXN', expectedDept: 'ventas', expectSuccess: true },
  { id: 86, cat: 'ventas', input: 'Prospecto: Walmart México, deal de $2.4M, status: discovery', expectedDept: 'ventas', expectSuccess: true },
  { id: 87, cat: 'ventas', input: 'SDR outreach: 200 emails enviados, 12% respuesta', expectedDept: 'ventas', expectSuccess: true },
  { id: 88, cat: 'ventas', input: 'Account executive María cerró 3 deals esta semana', expectedDept: 'ventas', expectSuccess: true },
  { id: 89, cat: 'ventas', input: 'Post-venta: cliente Liverpool pidió entrenamiento del equipo', expectedDept: 'ventas', expectSuccess: true },
  { id: 90, cat: 'ventas', input: 'Renovación anual: cliente Soriana vence en 30 días', expectedDept: 'ventas', expectSuccess: true },

  // ════════════════════════════════════════════════════════════
  // 91-95: COMPRAS
  // ════════════════════════════════════════════════════════════
  { id: 91, cat: 'compras', input: 'Cotiza 10 laptops Dell con 3 proveedores', expectedDept: 'compras', expectSuccess: true },
  { id: 92, cat: 'compras', input: 'Orden de compra #4521 al proveedor OfficeMax', expectedDept: 'compras', expectSuccess: true },
  { id: 93, cat: 'compras', input: 'RFP para servicio de limpieza mensual de las 3 oficinas', expectedDept: 'compras', expectSuccess: true },
  { id: 94, cat: 'compras', input: 'Evaluación de proveedores: 3M vs Kimberly vs Tork', expectedDept: 'compras', expectSuccess: true },
  { id: 95, cat: 'compras', input: 'Licitación pública: SEDENA busca proveedor de uniformes', expectedDept: 'compras', expectSuccess: true },

  // ════════════════════════════════════════════════════════════
  // 96-100: CROSS-DEPT / EDGE CASES / STRESS
  // ════════════════════════════════════════════════════════════
  { id: 96,  cat: 'cross',  input: 'Necesito facturar y luego publicar en Instagram que ya está listo el servicio', expectedDept: 'finanzas', expectSuccess: true },
  { id: 97,  cat: 'cross',  input: '',  expectedDept: 'ceo', expectSuccess: true, _note: 'string vacío → CEO fallback' },
  { id: 98,  cat: 'cross',  input: '🤖 Hola, esto es un test con emojis 🚀💼', expectedDept: 'ceo', expectSuccess: true, _note: 'emojis y caracteres especiales' },
  { id: 99,  cat: 'cross',  input: 'Necesito una factura CFDI urgente de 5 millones para un cliente muy importante que se llama Walmart y que requiere timbrado hoy mismo con complemento de pago y todo', expectedDept: 'finanzas', expectSuccess: true, _note: 'request largo y complejo' },
  { id: 100, cat: 'cross',  input: '   espacios   al   inicio   y   final   y palabras como   CFDI   SAT   facturación   ', expectedDept: 'finanzas', expectSuccess: true, _note: 'whitespace y múltiples keywords' },
];
