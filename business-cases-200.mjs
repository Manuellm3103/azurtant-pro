/**
 * AzurTant PRO — 200 Casos de Uso por Tipo de Negocio
 * 25 industrias × 8 casos cada una
 * Para validar que el sistema sirve a clientes reales diversos
 */

export const BUSINESS_CASES = {
    // 1. RESTAURANTE (ya cubierto en industry pack)
    'restaurante-mx': [
        { q: '¿Cuánto vendimos hoy?', dept: 'finanzas' },
        { q: 'Inventario: ¿qué necesito reordenar?', dept: 'operaciones' },
        { q: 'Cierre de caja del turno vespertino', dept: 'finanzas' },
        { q: 'CFDI al cliente de la mesa 12', dept: 'finanzas' },
        { q: 'Promoción del día: 2x1 en margaritas', dept: 'marketing' },
        { q: 'Reclutar mesero para turno nocturno', dept: 'rrhh' },
        { q: 'WiFi del comedor está lento', dept: 'tecnologia' },
        { q: '¿Cuál es mi ticket promedio este mes?', dept: 'finanzas' },
    ],

    // 2. DENTAL
    'clinica-dental': [
        { q: '¿Cuántas citas tengo mañana?', dept: 'operaciones' },
        { q: 'Recordatorio de limpieza a todos los que vencieron', dept: 'redes' },
        { q: 'Presupuesto para Juan Pérez: ortodoncia', dept: 'finanzas' },
        { q: 'Cierre de mes: ingresos netos', dept: 'finanzas' },
        { q: 'Contrato con nuevo ortodoncista', dept: 'legal' },
        { q: 'Equipar consultorio 2 con nuevo sillón', dept: 'compras' },
        { q: 'Capacitación de asistente en software dental', dept: 'rrhh' },
        { q: 'Instagram: campaña de blanqueamiento', dept: 'marketing' },
    ],

    // 3. E-COMMERCE
    'ecommerce-mx': [
        { q: 'ROAS consolidado del mes', dept: 'marketing' },
        { q: 'Lista de 5 productos más rentables', dept: 'ventas' },
        { q: 'Optimiza el listing de "tenis Nike Air Max"', dept: 'marketing' },
        { q: 'Alerta: stock bajo de SKU AZ-1234', dept: 'operaciones' },
        { q: 'CFDI del pedido 9982 a cliente Amazon', dept: 'finanzas' },
        { q: 'Migrar tienda de Shopify a Tiendanube', dept: 'tecnologia' },
        { q: 'Política de devoluciones actualizada', dept: 'legal' },
        { q: 'Reclutar community manager', dept: 'rrhh' },
    ],

    // 4. INMOBILIARIA
    'inmobiliaria-mx': [
        { q: 'Pipeline de leads del mes', dept: 'ventas' },
        { q: 'Acción: leads sin respuesta > 24h', dept: 'ventas' },
        { q: 'Contrato de arrendamiento para cliente L-4521', dept: 'legal' },
        { q: 'Corrida financiera: Polanco 80m²', dept: 'finanzas' },
        { q: 'Fotos profesionales para propiedad nueva', dept: 'marketing' },
        { q: 'Publicar en Vivanuncios y MercadoLibre', dept: 'marketing' },
        { q: 'Reclutar agente comercial', dept: 'rrhh' },
        { q: 'CRM no sincroniza con EasyBroker', dept: 'tecnologia' },
    ],

    // 5. EDUCACIÓN
    'educacion-mx': [
        { q: 'Lista de alumnos morosos', dept: 'finanzas' },
        { q: 'Boleta de Juan Pérez — 3er trimestre', dept: 'rrhh' },
        { q: 'Inscripción nuevo alumno: María López', dept: 'operaciones' },
        { q: 'Reporte mensual de calificaciones', dept: 'rrhh' },
        { q: 'Trámite RVOE para nuevo programa', dept: 'legal' },
        { q: 'Material didáctico para taller de matemáticas', dept: 'compras' },
        { q: 'Correos masivos a padres de familia', dept: 'redes' },
        { q: 'Plataforma Moodle se cayó', dept: 'tecnologia' },
    ],

    // 6. CONSULTORÍA
    'consultoria-mx': [
        { q: 'Horas facturables del mes', dept: 'finanzas' },
        { q: 'Propuesta para cliente Innovatech', dept: 'ventas' },
        { q: 'Factura mensual a cliente Femsa', dept: 'finanzas' },
        { q: 'Contrato con nuevo cliente', dept: 'legal' },
        { q: 'Nómina quincenal del equipo', dept: 'rrhh' },
        { q: 'LinkedIn: publicar caso de éxito', dept: 'redes' },
        { q: 'Onboarding del nuevo consultor', dept: 'rrhh' },
        { q: 'CRM no muestra oportunidades cerradas', dept: 'tecnologia' },
    ],

    // 7. LOGÍSTICA
    'logistica-mx': [
        { q: 'Genera 50 guías para cliente Bimbo', dept: 'operaciones' },
        { q: '¿Cuántos paquetes en excepción hoy?', dept: 'operaciones' },
        { q: 'Factura mensual a cliente Liverpool', dept: 'finanzas' },
        { q: 'Reclamo a DHL por paquete dañado', dept: 'legal' },
        { q: 'Ruta óptima para 200 paquetes CDMX', dept: 'operaciones' },
        { q: 'Contrato con Estafeta para nuevo volumen', dept: 'compras' },
        { q: 'Reclutar chofer para ruta norte', dept: 'rrhh' },
        { q: 'Sistema de rastreo caído', dept: 'tecnologia' },
    ],

    // 8. CONSULTORIO MÉDICO
    'consultorio-medico': [
        { q: 'Agenda del Dr. López mañana', dept: 'operaciones' },
        { q: 'Receta digital para paciente X', dept: 'operaciones' },
        { q: 'Cierre del día: ingresos', dept: 'finanzas' },
        { q: 'Recordatorio de cita a pacientes de mañana', dept: 'redes' },
        { q: 'Expediente clínico de María', dept: 'operaciones' },
        { q: 'Compra de medicamentos para stock', dept: 'compras' },
        { q: 'Capacitación al asistente en NOM-004', dept: 'rrhh' },
        { q: 'Computadora del consultorio 2 no prende', dept: 'tecnologia' },
    ],

    // 9. DESPACHO CONTABLE
    'despacho-contable': [
        { q: 'Declaración mensual de IVA de cliente X', dept: 'finanzas' },
        { q: 'Conciliación bancaria de 30 clientes', dept: 'finanzas' },
        { q: 'Timbrado de nómina quincenal', dept: 'finanzas' },
        { q: 'Alerta: cliente sin presentar facturas', dept: 'operaciones' },
        { q: 'Contrato de servicios con nuevo cliente', dept: 'legal' },
        { q: 'Correo masivo: recordatorio declaraciones', dept: 'redes' },
        { q: 'Reclutar contador junior', dept: 'rrhh' },
        { q: 'Sistema CONTPAQi se desconectó del SAT', dept: 'tecnologia' },
    ],

    // 10. AGENCIA DE MARKETING
    'agencia-marketing': [
        { q: 'Pipeline de propuestas pendientes', dept: 'ventas' },
        { q: 'Reporte de campaña para cliente Lala', dept: 'marketing' },
        { q: 'Factura de retainer mensual', dept: 'finanzas' },
        { q: 'Contrato con nuevo influencer', dept: 'legal' },
        { q: 'Reclutar diseñador gráfico', dept: 'rrhh' },
        { q: 'Brief creativo para campaña de lanzamiento', dept: 'marketing' },
        { q: 'Meta Ads desconectado del Business Manager', dept: 'tecnologia' },
        { q: 'Reporte de horas invertidas por cliente', dept: 'finanzas' },
    ],

    // 11. TALLER MECÁNICO
    'taller-mecanico': [
        { q: '¿Cuántas órdenes de servicio abiertas?', dept: 'operaciones' },
        { q: 'Cotización para cliente Juan: afinación', dept: 'ventas' },
        { q: 'Compra de refacciones para stock', dept: 'compras' },
        { q: 'Cierre de caja del día', dept: 'finanzas' },
        { q: 'Recordatorio de servicio a clientes vencidos', dept: 'redes' },
        { q: 'Reclutar mecánico eléctrico', dept: 'rrhh' },
        { q: 'Sistema de taller se cayó', dept: 'tecnologia' },
        { q: 'Garantía de 3 meses en trabajo defectuoso', dept: 'legal' },
    ],

    // 12. PANADERÍA / CAFETERÍA
    'panaderia-cafeteria': [
        { q: 'Producción diaria de pan: ¿cuánto hornear?', dept: 'operaciones' },
        { q: 'Inventario de harina y levadura', dept: 'operaciones' },
        { q: 'CFDI a cliente mayorista', dept: 'finanzas' },
        { q: 'Promoción: 3 conchas por $20 en Instagram', dept: 'marketing' },
        { q: 'Reclutar ayudante de panadero', dept: 'rrhh' },
        { q: 'Contrato con proveedor de harina', dept: 'compras' },
        { q: 'Horno industrial: falla en termostato', dept: 'tecnologia' },
        { q: 'Reporte mensual de ventas por producto', dept: 'finanzas' },
    ],

    // 13. GIMNASIO / FITNESS
    'gimnasio-fitness': [
        { q: 'Lista de membresías por vencer', dept: 'ventas' },
        { q: 'Cobro de mensualidades del día', dept: 'finanzas' },
        { q: 'Promoción: 2x1 en inscripciones', dept: 'marketing' },
        { q: 'Reclutar instructor de spinning', dept: 'rrhh' },
        { q: 'Contrato con nuevo proveedor de suplementos', dept: 'compras' },
        { q: 'Sistema de acceso biométrico no funciona', dept: 'tecnologia' },
        { q: 'Renovación del seguro del local', dept: 'legal' },
        { q: 'Reporte de asistencia por horario', dept: 'operaciones' },
    ],

    // 14. SALÓN DE BELLEZA
    'salon-belleza': [
        { q: 'Agenda de estilistas del sábado', dept: 'operaciones' },
        { q: 'Cierre de caja del día', dept: 'finanzas' },
        { q: 'Cotización cliente: tinte + corte', dept: 'ventas' },
        { q: 'Promoción en Instagram: 30% en keratina', dept: 'marketing' },
        { q: 'Reclutar estilista con experiencia', dept: 'rrhh' },
        { q: 'Compra de tintes y shampoo', dept: 'compras' },
        { q: 'Secador de pelo del puesto 3 no calienta', dept: 'tecnologia' },
        { q: 'Reglamento interno del salón', dept: 'legal' },
    ],

    // 15. Tienda de ROPA
    'tienda-ropa': [
        { q: 'Inventario de la nueva colección', dept: 'operaciones' },
        { q: 'Liquidación de temporada: 50% off', dept: 'marketing' },
        { q: 'CFDI a cliente mayorista', dept: 'finanzas' },
        { q: 'Foto de producto para catálogo', dept: 'marketing' },
        { q: 'Reclutar vendedora de medio tiempo', dept: 'rrhh' },
        { q: 'Contrato con proveedor de China', dept: 'compras' },
        { q: 'Sistema de punto de venta lento', dept: 'tecnologia' },
        { q: 'Devolución de cliente: cambio de talla', dept: 'ventas' },
    ],

    // 16. ABOGADO / BUFETE
    'bufete-juridico': [
        { q: 'Agenda de audiencias del mes', dept: 'operaciones' },
        { q: 'Demanda para cliente X', dept: 'legal' },
        { q: 'Facturación de honorarios', dept: 'finanzas' },
        { q: 'Contrato con nuevo cliente corporativo', dept: 'legal' },
        { q: 'Reclutar abogado asociado', dept: 'rrhh' },
        { q: 'Tesis jurisprudencial sobre LFPDPPP', dept: 'innovacion' },
        { q: 'Sistema de gestión jurídica no responde', dept: 'tecnologia' },
        { q: 'Cobranza a cliente moroso', dept: 'finanzas' },
    ],

    // 17. CONSTRUCTORA
    'constructora': [
        { q: 'Avance de obra del proyecto Polanco', dept: 'operaciones' },
        { q: 'Cotización para cliente nuevo', dept: 'ventas' },
        { q: 'Compra de cemento y varilla', dept: 'compras' },
        { q: 'Nómina semanal de albañiles', dept: 'rrhh' },
        { q: 'Contrato con subcontratista eléctrico', dept: 'legal' },
        { q: 'Permiso de construcción ante alcaldía', dept: 'legal' },
        { q: 'Costo-beneficio: comprar vs rentar grúa', dept: 'finanzas' },
        { q: 'Dron para inspección: piloto automático', dept: 'tecnologia' },
    ],

    // 18. DISTRIBUIDORA
    'distribuidora': [
        { q: 'Ruta de reparto del día', dept: 'operaciones' },
        { q: 'Pedidos pendientes de surtir', dept: 'ventas' },
        { q: 'Factura a cliente mayorista', dept: 'finanzas' },
        { q: 'Compra de producto al fabricante', dept: 'compras' },
        { q: 'Reclutar chofer con licencia federal', dept: 'rrhh' },
        { q: 'Promoción: combo de 3 productos', dept: 'marketing' },
        { q: 'Camión #5: falla en transmisión', dept: 'tecnologia' },
        { q: 'Seguro de la flotilla: renovación', dept: 'legal' },
    ],

    // 19. AGENCIA DE VIAJES
    'agencia-viajes': [
        { q: 'Reservar vuelo y hotel para cliente', dept: 'ventas' },
        { q: 'Cotización paquete Europa 15 días', dept: 'ventas' },
        { q: 'Cancelación de reservación: penalización', dept: 'operaciones' },
        { q: 'Promoción en Facebook: Caribe todo incluido', dept: 'marketing' },
        { q: 'Contrato con hotel para tarifa corporativa', dept: 'compras' },
        { q: 'Reclutar agente de viajes bilingüe', dept: 'rrhh' },
        { q: 'Sabre GDS no sincroniza disponibilidad', dept: 'tecnologia' },
        { q: 'Visa americana rechazada: reclamación', dept: 'legal' },
    ],

    // 20. ESTUDIO DE DISEÑO
    'estudio-diseno': [
        { q: 'Pipeline de proyectos activos', dept: 'operaciones' },
        { q: 'Cotización para branding de cliente X', dept: 'ventas' },
        { q: 'Factura de hito 50% proyecto', dept: 'finanzas' },
        { q: 'Contrato de cesión de derechos', dept: 'legal' },
        { q: 'Reclutar diseñador senior', dept: 'rrhh' },
        { q: 'Portafolio en Behance: actualizar', dept: 'marketing' },
        { q: 'Adobe Creative Cloud: licencia caducó', dept: 'tecnologia' },
        { q: 'Tendencia de diseño 2026', dept: 'innovacion' },
    ],

    // 21. FARMACIA
    'farmacia': [
        { q: 'Inventario de medicamentos controlados', dept: 'operaciones' },
        { q: 'Reorden de药品 controlados vs COFEPRIS', dept: 'compras' },
        { q: 'CFDI a cliente con receta médica', dept: 'finanzas' },
        { q: 'Promoción: 3x2 en vitaminas', dept: 'marketing' },
        { q: 'Reclutar farmacéutico titulado', dept: 'rrhh' },
        { q: 'Contrato con distribuidor COFEPRIS', dept: 'compras' },
        { q: 'Sistema de farmacia lento en horas pico', dept: 'tecnologia' },
        { q: 'Vencimiento de medicamentos en 30 días', dept: 'operaciones' },
    ],

    // 22. BAR / ANTRO
    'bar-antro': [
        { q: 'Ventas del viernes por hora', dept: 'finanzas' },
        { q: 'Cierre de caja del fin de semana', dept: 'finanzas' },
        { q: 'Inventario de botella de whisky', dept: 'operaciones' },
        { q: 'Promoción: 2x1 en cocteles de la casa', dept: 'marketing' },
        { q: 'Reclutar bartender para viernes-sábado', dept: 'rrhh' },
        { q: 'Permiso de venta de alcohol: renovación', dept: 'legal' },
        { q: 'Sistema de sonido: falla en mezcladora', dept: 'tecnologia' },
        { q: 'Contrato con proveedor de hielo', dept: 'compras' },
    ],

    // 23. TRANSPORTE / TAXI / UBER
    'transporte-taxi': [
        { q: '¿Cuántas unidades activas hoy?', dept: 'operaciones' },
        { q: 'Liquidación semanal a conductores', dept: 'finanzas' },
        { q: 'Ruta más rentable del día', dept: 'operaciones' },
        { q: 'Promoción: primer viaje 50% off', dept: 'marketing' },
        { q: 'Reclutar conductor con vehículo propio', dept: 'rrhh' },
        { q: 'Seguro vehicular: renovación de pólizas', dept: 'legal' },
        { q: 'App de gestión: GPS no actualiza', dept: 'tecnologia' },
        { q: 'Mantenimiento programado de unidad 23', dept: 'operaciones' },
    ],

    // 24. AGROINDUSTRIA
    'agroindustria': [
        { q: 'Cosecha de maíz: ¿cuándo empezar?', dept: 'operaciones' },
        { q: 'Precio actual del mercado', dept: 'ventas' },
        { q: 'Compra de fertilizante y semilla', dept: 'compras' },
        { q: 'Contrato de compra-venta con industria', dept: 'legal' },
        { q: 'Reclutar jornaleros para temporada', dept: 'rrhh' },
        { q: 'Tractor John Deere: falla hidráulica', dept: 'tecnologia' },
        { q: 'Sensores IoT: humedad del suelo', dept: 'innovacion' },
        { q: 'Reporte de producción por parcela', dept: 'finanzas' },
    ],

    // 25. STARTUP SAAS / TECH
    'startup-saas': [
        { q: 'MRR del mes: ¿cuánto creció?', dept: 'finanzas' },
        { q: 'Churn rate y cohortes', dept: 'ventas' },
        { q: 'Burn rate y runway', dept: 'finanzas' },
        { q: 'Pipeline de inversión Serie A', dept: 'ceo' },
        { q: 'Onboarding del nuevo CTO', dept: 'rrhh' },
        { q: 'Contrato enterprise con Femsa', dept: 'legal' },
        { q: 'Outage en producción: AWS caído', dept: 'tecnologia' },
        { q: 'Postmortem del incidente del lunes', dept: 'tecnologia' },
    ],
};

// Total casos:
export const TOTAL_BUSINESS_CASES = Object.values(BUSINESS_CASES).reduce((s, arr) => s + arr.length, 0);
export const INDUSTRY_LIST = Object.keys(BUSINESS_CASES);
