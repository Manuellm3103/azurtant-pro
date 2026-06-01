/**
 * AzurTant PRO — Industry Packs
 * Plantillas pre-armadas que activan múltiples agentes + skills + SOPs
 * para resolver un vertical completo de negocio.
 *
 * Uso:
 *   import { IndustryPacks } from './src/industryPacks.js';
 *   const pack = IndustryPacks.restaurante;
 *   const depts = pack.activate(); // registra agentes, skills, SOPs
 */

export const IndustryPacks = {
    // ─────────────────────────────────────────────
    // 🍽️  RESTAURANTE MEXICANO
    // ─────────────────────────────────────────────
    'restaurante-mx': {
        name: 'Restaurante Mexicano',
        icon: '🍽️',
        tagline: 'Opera tu restaurante con IA, sin meseros ni administrativos',
        description: 'Para restaurantes, fondas, cafeterías, dark kitchens. Comandas, tickets, propinas, inventario, CFDI automático al cliente.',
        target: 'Dueños de restaurantes con 1-5 sucursales',
        price: 'Pro ($14,999 MXN/mes)',
        agents: ['finanzas', 'operaciones', 'marketing', 'rrhh', 'tecnologia', 'ventas'],
        required_skills: ['cfdi-mx', 'restaurant-mx', 'whatsapp-business'],
        sop_templates: [
            'new_order: cliente pide → cocina prepara → ticket → CFDI → cobro',
            'inventory_check: diario 11pm → nivel de ingredientes → alerta si <20%',
            'daily_close: corte de caja → propinas → CFDI global → reporte dueño',
            'birthday_promo: lead cumple años → cupón WhatsApp automático',
        ],
        kpis: ['ticket_promedio', 'tiempo_preparacion', 'rotacion_mesas', 'costo_mercancia', 'propina_promedio'],
        integrations: ['iiko', 'mr-pos', 'shopify-pos', 'sumup', 'mercadopago_qr'],
        sample_queries: [
            '¿Cuánto vendimos hoy?',
            'Inventario: ¿qué necesito reordenar?',
            'Cierre de caja del turno vespertino',
            'CFDI al cliente de la mesa 12',
            'Promoción del día: 2x1 en margaritas',
        ],
    },

    // ─────────────────────────────────────────────
    // 🦷  CLÍNICA DENTAL
    // ─────────────────────────────────────────────
    'clinica-dental': {
        name: 'Clínica Dental',
        icon: '🦷',
        tagline: 'Citas, historiales, presupuestos — todo automático',
        description: 'Para consultorios dentales, ortodoncistas, especialistas. Agenda citas, recordatorios WhatsApp, presupuestos, expedientes clínicos (NOM-013-SSA).',
        target: 'Dentistas con 1-3 consultorios',
        price: 'Pro ($14,999 MXN/mes)',
        agents: ['operaciones', 'finanzas', 'marketing', 'rrhh', 'legal'],
        required_skills: ['dental-clinic', 'whatsapp-business', 'cfdi-mx'],
        sop_templates: [
            'new_patient: lead → cita valoración → expediente → presupuesto → plan pago',
            'appointment_reminder: T-24h → WhatsApp recordatorio al paciente',
            'treatment_plan: doctor crea plan → presupuesto → aceptación → calendarización',
            'recall_cleaning: cada 6 meses → recordatorio limpieza al paciente',
        ],
        kpis: ['citas_diarias', 'tasa_rellamada', 'ticket_promedio', 'no_show_rate', 'aceptacion_presupuestos'],
        integrations: ['dentrix', 'clinicorp', 'whatsapp_business_api', 'calendar'],
        sample_queries: [
            '¿Cuántas citas tengo mañana?',
            'Recordatorio de limpieza a todos los que vencieron',
            'Presupuesto para Juan Pérez: ortodoncia',
            'Cierre de mes: ingresos netos',
        ],
    },

    // ─────────────────────────────────────────────
    // 🛒  E-COMMERCE / TIENDA ONLINE
    // ─────────────────────────────────────────────
    'ecommerce-mx': {
        name: 'E-commerce México',
        icon: '🛒',
        tagline: 'Vende en MercadoLibre, Amazon MX, Shopify, TikTok Shop con IA',
        description: 'Para sellers de e-commerce. 142 sub-skills pre-empaquetados. Pricing, listings, PPC, fulfillment, post-venta.',
        target: 'Sellers con $50K-$1M MXN/mes',
        price: 'Pro ($14,999 MXN/mes)',
        agents: ['ventas', 'marketing', 'finanzas', 'operaciones', 'tecnologia', 'legal'],
        required_skills: ['ecommerce-mx', 'cfdi-mx', 'logistics-mx'],
        sop_templates: [
            'new_listing: producto nuevo → research keywords → listing optimizado → publicar multi-canal',
            'price_war: competencia baja precio → análisis → decisión automática de paridad',
            'ppc_optimization: diario → ROAS < 2 → pausar anuncio / ROAS > 5 → subir budget',
            'low_stock_alert: inventario <10 → PO automática al proveedor',
            'returns_handling: cliente solicita devolución → guía prepaga → reembolso al recibir',
        ],
        kpis: ['gmv', 'aov', 'cac', 'ltv', 'roas', 'return_rate', 'margin'],
        integrations: ['mercadolibre', 'amazon_mx', 'shopify', 'tiktok_shop', 'dhl', 'fedex', 'estafeta'],
        sample_queries: [
            '¿Cuál es mi ROAS consolidado del mes?',
            'Lista mis 5 productos más rentables',
            'Optimiza el listing de "tenis Nike Air Max"',
            'Alerta: stock bajo de SKU AZ-1234',
        ],
    },

    // ─────────────────────────────────────────────
    // 🏠  INMOBILIARIA
    // ─────────────────────────────────────────────
    'inmobiliaria-mx': {
        name: 'Inmobiliaria',
        icon: '🏠',
        tagline: 'De la propiedad al cierre, sin vendedor',
        description: 'Para inmobiliarias. Captura leads, agenda citas, contratos de arrendamiento, corridas financieras, marketing de propiedades.',
        target: 'Inmobiliarias con 10-100 propiedades activas',
        price: 'Enterprise ($39,999 MXN/mes)',
        agents: ['ventas', 'marketing', 'legal', 'finanzas', 'rrhh'],
        required_skills: ['real-estate-mx', 'whatsapp-business', 'cfdi-mx'],
        sop_templates: [
            'new_lead: lead de portal → respuesta WhatsApp <2min → cita → recorrido → oferta',
            'property_listing: propietario da propiedad → análisis mercado → foto pro → listing → portales',
            'rental_contract: cliente decide → contrato → fiador → primer mes → entrega llaves',
            'commission_payout: cierre de mes → cálculo de comisiones → dispersión a agentes',
        ],
        kpis: ['leads_por_agente', 'conversion_lead_to_visit', 'cierres_mes', 'ticket_promedio', 'tiempo_promedio_cierre'],
        integrations: ['inmoblia', 'easybroker', 'vivanuncios', 'mercadolibre_inmuebles', 'whatsapp_business_api'],
        sample_queries: [
            'Pipeline de leads del mes',
            'Acción: todos los leads sin respuesta > 24h',
            'Contrato de arrendamiento para cliente L-4521',
            'Corrida financiera: departamento Polanco 80m²',
        ],
    },

    // ─────────────────────────────────────────────
    // 📚  ESCUELA / COACHING
    // ─────────────────────────────────────────────
    'educacion-mx': {
        name: 'Educación / Academia',
        icon: '📚',
        tagline: 'Inscripciones, calificaciones, boletas, todo en automático',
        description: 'Para escuelas, academias, coaching, cursos online. Inscripciones, mensualidades, RVOE, calificaciones, boletas SEP.',
        target: 'Escuelas con 50-500 alumnos',
        price: 'Pro ($14,999 MXN/mes)',
        agents: ['rrhh', 'finanzas', 'operaciones', 'marketing', 'legal'],
        required_skills: ['education-mx', 'cfdi-mx', 'whatsapp-business'],
        sop_templates: [
            'enrollment: prospecto → expediente → inscripción → mensualidad → bienvenida',
            'monthly_payment: día 5 → recordatorio → día 10 → cobranza → reporte morosos',
            'grade_report: fin de mes → captura calificaciones → boleta → envío padres',
            'parent_meeting: bajo rendimiento → cita con padres → plan remedial',
        ],
        kpis: ['alumnos_activos', 'tasa_aprobacion', 'morosidad', 'satisfaccion_padres', 'retencion'],
        integrations: ['moodle', 'google_classroom', 'sep', 'whatsapp_business_api'],
        sample_queries: [
            'Lista de alumnos morosos',
            'Boleta de Juan Pérez — 3er trimestre',
            'Inscripción nuevo alumno: María López',
            'Reporte mensual de calificaciones',
        ],
    },

    // ─────────────────────────────────────────────
    // 💼  CONSULTORÍA / AGENCIA
    // ─────────────────────────────────────────────
    'consultoria-mx': {
        name: 'Consultoría / Agencia',
        icon: '💼',
        tagline: 'Propuestas, contratos, timesheets, facturación — sin PM ni administrativos',
        description: 'Para consultoras, agencias, freelancers+. Time tracking, propuestas, contratos, facturación recurrente.',
        target: 'Consultoras con 3-30 personas',
        price: 'Pro ($14,999 MXN/mes)',
        agents: ['ventas', 'finanzas', 'rrhh', 'legal', 'marketing'],
        required_skills: ['cfdi-mx', 'whatsapp-business'],
        sop_templates: [
            'new_prospect: lead → discovery call → propuesta → contrato → kickoff',
            'monthly_billing: día 1 → horas del mes → factura → envío → seguimiento pago',
            'employee_payment: quincena → cálculo horas → nómina timbrada → transferencia',
        ],
        kpis: ['utilizacion_equipo', 'horas_facturables', 'ticket_promedio', 'tasa_renovacion', 'nps'],
        integrations: ['hubspot', 'pipedrive', 'harvest', 'toggl', 'gusto', 'bamboo_hr'],
        sample_queries: [
            '¿Cuántas horas facturables llevamos del mes?',
            'Propuesta para cliente Innovatech — 3 meses',
            'Factura mensual del cliente Femsa',
        ],
    },

    // ─────────────────────────────────────────────
    // 🚚  LOGÍSTICA / PAQUETERÍA
    // ─────────────────────────────────────────────
    'logistica-mx': {
        name: 'Logística / Paquetería',
        icon: '🚚',
        tagline: 'Guías, rastreo, rutas, devoluciones — todo conectado',
        description: 'Para couriers, 3PL, e-commerce fulfillment. Generación de guías multi-carrier, rastreo, devoluciones, NVOCC.',
        target: 'Couriers y 3PL con 100+ envíos/día',
        price: 'Enterprise ($39,999 MXN/mes)',
        agents: ['operaciones', 'finanzas', 'tecnologia', 'ventas', 'redes'],
        required_skills: ['logistics-mx', 'cfdi-mx', 'whatsapp-business'],
        sop_templates: [
            'new_shipment: orden → guía DHL/FedEx/Estafeta → rastreo → entrega → confirmación',
            'exception_handler: paquete retrasado → alerta → re-ruteo → compensación',
            'monthly_billing: cliente → cálculo por peso/zona → factura → portal cliente',
        ],
        kpis: ['on_time_delivery', 'damage_rate', 'costo_por_envio', 'satisfaccion_cliente'],
        integrations: ['dhl_api', 'fedex_api', 'estafeta_api', 'skydropx', 'envia_com'],
        sample_queries: [
            'Genera 50 guías para cliente Bimbo',
            '¿Cuántos paquetes en excepción hoy?',
            'Factura mensual a cliente Liverpool',
        ],
    },

    // ─────────────────────────────────────────────
    // 🏥  CONSULTORIO MÉDICO GENERAL
    // ─────────────────────────────────────────────
    'consultorio-medico': {
        name: 'Consultorio Médico',
        icon: '🏥',
        tagline: 'Citas, expedientes, recetas, todo digital y CFDI',
        description: 'Para médicos generales, especialistas, nutriólogos, psicólogos. Agenda, expediente clínico (NOM-004-SSA3), recetas, cobros.',
        target: 'Consultorios con 1-3 doctores',
        price: 'Pro ($14,999 MXN/mes)',
        agents: ['operaciones', 'finanzas', 'rrhh', 'legal'],
        required_skills: ['cfdi-mx', 'whatsapp-business'],
        sop_templates: [
            'appointment_booking: paciente → agenda → confirmación → recordatorio T-24h',
            'consultation: doctor atiende → notas SOAP → receta digital → cobro → seguimiento',
        ],
        kpis: ['citas_diarias', 'tasa_rellamada', 'ticket_promedio', 'no_show_rate'],
        integrations: ['doctoralia', 'whatsapp_business_api'],
        sample_queries: [
            'Agenda del Dr. López mañana',
            'Receta digital para paciente X',
            'Cierre del día: ingresos',
        ],
    },
};

export const PACK_LIST = Object.keys(IndustryPacks);

export function getPack(industry) {
    return IndustryPacks[industry] || null;
}

export function activatePack(industry) {
    const pack = IndustryPacks[industry];
    if (!pack) throw new Error(`Pack no encontrado: ${industry}. Disponibles: ${PACK_LIST.join(', ')}`);
    return {
        ...pack,
        activated_at: new Date().toISOString(),
        next_steps: [
            `1. Instala los skills: ${pack.required_skills.map(s => `npx azurant-skill add ${s}`).join(' && ')}`,
            `2. Activa los ${pack.agents.length} agentes en el dashboard`,
            `3. Configura integraciones: ${pack.integrations.join(', ')}`,
            `4. Personaliza los ${pack.sop_templates.length} SOPs con tus datos`,
            `5. Listo: tu ${pack.name.toLowerCase()} corre solo`,
        ],
    };
}
