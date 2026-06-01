// AzurTant PRO - 13 Department Definitions
// Data only. Structure validated against the corporate org document
// (10 official departments from the doc + 3 complementary for ops reality).

export const DEPARTMENTS_CONFIG = [
    {
        id: 'ceo',
        name: 'Dirección General y Estrategia Corporativa',
        shortName: 'CEO',
        icon: '👑',
        color: 'amber',
        description: 'Liderazgo apoyado en sistemas de Business Intelligence (BI) para decisiones basadas en datos. Supervisa la operación interdepartamental y traduce la visión del dueño en metas ejecutables.',
        maxPersonnel: 10,
        kpis: [
            { name: 'Cumplimiento de Visión Estratégica', unit: '%', target: 95 },
            { name: 'Coordinación Interdepartamental', unit: 'score', target: 90 },
            { name: 'ROI Global de la Operación', unit: '%', target: 25 }
        ],
        skills: ['estrategia', 'BI', 'coordinación', 'decisiones', 'visión', 'gobierno corporativo', 'LGSM'],
        complianceLaws: ['LGSM', 'LFT', 'LFPDPPP'],
        handlers: ['strategicPlan', 'kpiSummary', 'crossDeptCoordination']
    },
    {
        id: 'finanzas',
        name: 'Finanzas y Contraloría Inteligente',
        shortName: 'Finanzas',
        icon: '💰',
        color: 'green',
        description: 'Automatización total de cuentas por pagar/cobrar, predicción de flujo de caja con algoritmos financieros. Liquidez y cumplimiento fiscal ante el SAT.',
        maxPersonnel: 22,
        kpis: [
            { name: 'Flujo de Caja (Liquidez)', unit: 'MXN', target: 500000 },
            { name: 'Margen de Utilidad Neta', unit: '%', target: 18 },
            { name: 'Cumplimiento Fiscal ante el SAT', unit: '%', target: 100 }
        ],
        skills: ['contabilidad', 'flujo de caja', 'facturación electrónica', 'CFDI 4.0', 'SAT', 'conciliación', 'FP&A', 'presupuestos', 'nómina', 'impuestos'],
        complianceLaws: ['LISR', 'LIVA', 'CFF', 'RMF'],
        handlers: ['generateInvoice', 'reconcileAccounts', 'predictCashFlow', 'fileTaxReturn', 'auditExpense']
    },
    {
        id: 'tecnologia',
        name: 'Tecnología, IA y Ciberseguridad',
        shortName: 'Tecnología',
        icon: '💻',
        color: 'cyan',
        description: 'Núcleo que mantiene la infraestructura, implementa ITPA (Automatización de Procesos de TI) y protege los datos bajo la LFPDPPP. Soporte N1-N5.',
        maxPersonnel: 25,
        kpis: [
            { name: 'Uptime de Sistemas', unit: '%', target: 99.9 },
            { name: 'Nivel de Automatización', unit: '%', target: 70 },
            { name: 'Seguridad de Datos', unit: 'incidentes/mes', target: 0 }
        ],
        skills: ['infraestructura', 'redes', 'DevOps', 'ciberseguridad', 'soporte N1-N5', 'ITPA', 'cloud', 'scripts', 'automatización'],
        complianceLaws: ['LFPDPPP', 'NOM-001', 'NIST'],
        handlers: ['diagnosticSystem', 'provisionAccess', 'securityAudit', 'deployService', 'ticketing']
    },
    {
        id: 'innovacion',
        name: 'Investigación, Desarrollo e Innovación (I+D+i)',
        shortName: 'I+D+i',
        icon: '🔬',
        color: 'indigo',
        description: 'IA para análisis de tendencias globales y aceleración de prototipos. Vigilancia tecnológica, estudios de viabilidad y validación técnica.',
        maxPersonnel: 15,
        kpis: [
            { name: 'Tasa de Lanzamiento de Productos Nuevos', unit: 'productos/año', target: 4 },
            { name: 'ROI de Innovación', unit: '%', target: 35 },
            { name: 'Valor de Patentes Generadas', unit: 'MXN', target: 1000000 }
        ],
        skills: ['investigación', 'desarrollo', 'innovación', 'prototipos', 'vigilancia tecnológica', 'patentes', 'tendencias', 'viabilidad', 'tecnología'],
        complianceLaws: ['LFPPI', 'IMPI', 'LGSM', 'LFPDPPP'],
        handlers: ['researchTrends', 'prototypeDesign', 'patentSearch', 'feasibilityStudy']
    },
    {
        id: 'rrhh',
        name: 'Capital Humano y People Operations',
        shortName: 'RRHH',
        icon: '👥',
        color: 'pink',
        description: 'People Analytics para predecir rotación y optimizar clima laboral. Gestión del talento conforme a la LFT y el IMSS.',
        maxPersonnel: 20,
        kpis: [
            { name: 'Retención de Talento', unit: '%', target: 90 },
            { name: 'Clima Laboral', unit: 'score/10', target: 8.5 },
            { name: 'Productividad por Empleado', unit: 'índice', target: 1.2 }
        ],
        skills: ['reclutamiento', 'nómina', 'capacitación', 'clima laboral', 'LFT', 'IMSS', 'RCV', 'People Analytics', 'compensaciones'],
        complianceLaws: ['LFT', 'LSS', 'NOM-035'],
        handlers: ['recruitCandidate', 'calculatePayroll', 'predictTurnover', 'onboardingPlan', 'trainingPlan']
    },
    {
        id: 'operaciones',
        name: 'Operaciones y Logística 4.0',
        shortName: 'Operaciones',
        icon: '⚙️',
        color: 'blue',
        description: 'Integración de ERP inteligentes para cadena de suministro Just-in-Time sin errores humanos. Cumplimiento de tiempos de entrega.',
        maxPersonnel: 30,
        kpis: [
            { name: 'Índice de Calidad (Cero Errores)', unit: 'DPMO', target: 100 },
            { name: 'Cumplimiento de Tiempos de Entrega (OTD)', unit: '%', target: 97 },
            { name: 'Costo por Unidad', unit: 'MXN', target: 50 }
        ],
        skills: ['supply chain', 'logística', 'calidad', 'inventarios', 'ERP', 'Just-in-Time', 'mantenimiento', 'NOM', 'procesos'],
        complianceLaws: ['NOM-001', 'NOM-035', 'ISO 9001'],
        handlers: ['optimizeSupplyChain', 'qualityCheck', 'scheduleProduction', 'logisticsPlan']
    },
    {
        id: 'marketing',
        name: 'Marketing y Generación de Leads',
        shortName: 'Marketing',
        icon: '📣',
        color: 'orange',
        description: 'Automatización de contenidos, SEO/SEM inteligente y nutrición de prospectos (MQL) a escala masiva. Análisis de KPIs y posicionamiento de marca.',
        maxPersonnel: 25,
        kpis: [
            { name: 'CAC (Costo de Adquisición)', unit: 'MXN', target: 800 },
            { name: 'Volumen de MQL', unit: 'leads/mes', target: 500 },
            { name: 'ROAS (Retorno en Publicidad)', unit: 'x', target: 4 }
        ],
        skills: ['SEO', 'SEM', 'contenido', 'redes sociales', 'MQL', 'branding', 'email marketing', 'analítica', 'CRM'],
        complianceLaws: ['LFPDPPP', 'NOM-028'],
        handlers: ['generateContent', 'qualifyLead', 'campaignPlan', 'seoAudit', 'brandStrategy']
    },
    {
        id: 'ventas',
        name: 'Ventas y Conversión Predictiva',
        shortName: 'Ventas',
        icon: '📈',
        color: 'emerald',
        description: 'CRM potenciado con IA para calificar leads y predecir cierres. Cierre de negocios y fidelización conforme a la Ley Federal de Protección al Consumidor.',
        maxPersonnel: 40,
        kpis: [
            { name: 'Tasa de Conversión', unit: '%', target: 25 },
            { name: 'Valor del Pipeline', unit: 'MXN', target: 5000000 },
            { name: 'LTV (Valor de Vida del Cliente)', unit: 'MXN', target: 250000 }
        ],
        skills: ['ventas', 'CRM', 'pipeline', 'embudo', 'SDR', 'AE', 'Customer Success', 'objeciones', 'LFPC'],
        complianceLaws: ['LFPC', 'LFPDPPP', 'NOM-028'],
        handlers: ['predictClose', 'managePipeline', 'handleObjection', 'proposalDraft', 'followUpSequence']
    },
    {
        id: 'legal',
        name: 'Legal, Compliance y Riesgos',
        shortName: 'Legal',
        icon: '⚖️',
        color: 'purple',
        description: 'LegalTech para revisión automática de contratos y cumplimiento normativo preventivo. Defensa jurídica y auditoría.',
        maxPersonnel: 12,
        kpis: [
            { name: 'Riesgos Mitigados', unit: '%', target: 95 },
            { name: 'Cumplimiento Normativo', unit: '%', target: 100 },
            { name: 'Blindaje Contractual', unit: 'score', target: 9 }
        ],
        skills: ['contratos', 'compliance', 'defensa', 'PI', 'LFT', 'LISR', 'LFPC', 'auditoría legal', 'corporativo'],
        complianceLaws: ['LFT', 'LGSM', 'LISR', 'LFPC', 'LFPPI'],
        handlers: ['reviewContract', 'checkCompliance', 'draftNDA', 'riskAssessment']
    },
    {
        id: 'compras',
        name: 'Compras y Gestión de Proveedores',
        shortName: 'Compras',
        icon: '🛒',
        color: 'yellow',
        description: 'Gestión de proveedores, órdenes de compra, negociación de contratos marco y evaluación continua de desempeño.',
        maxPersonnel: 8,
        kpis: [
            { name: 'Ahorro vs Presupuesto', unit: '%', target: 12 },
            { name: 'On-Time Delivery Proveedores', unit: '%', target: 95 },
            { name: 'Cumplimiento de Contratos Marco', unit: '%', target: 100 }
        ],
        skills: ['proveedores', 'compras', 'OC', 'contratos marco', 'RFP', 'licitaciones', '3-Way Match'],
        complianceLaws: ['LAASSP', 'LISR'],
        handlers: ['createPurchaseOrder', 'evaluateSupplier', 'rfpGeneration', 'negotiateContract']
    },
    {
        id: 'propuestas',
        name: 'Propuestas, Licitaciones y Redacción',
        shortName: 'Propuestas',
        icon: '📋',
        color: 'violet',
        description: 'Writer IA para generar propuestas persuasivas y formales en minutos. Gestión del ciclo de vida de propuestas (RFP/RFI).',
        maxPersonnel: 12,
        kpis: [
            { name: 'Win Rate en Licitaciones', unit: '%', target: 35 },
            { name: 'Tiempo de Respuesta', unit: 'días', target: 5 },
            { name: 'Nivel de Persuasión Comercial', unit: 'score', target: 9 }
        ],
        skills: ['RFP', 'RFI', 'redacción técnica', 'propuestas', 'licitaciones', 'estructura de precios', 'persuasión', 'compliance docs'],
        complianceLaws: ['LAASSP', 'LOPSRM', 'LGSM'],
        handlers: ['draftProposal', 'respondRFI', 'winTheme', 'pricingStrategy']
    },
    {
        id: 'redes',
        name: 'Redes Sociales y Contenido Auto',
        shortName: 'Redes',
        icon: '📱',
        color: 'fuchsia',
        description: 'Publicación automática, scheduling, curación de contenido, escucha social y analítica de engagement.',
        maxPersonnel: 6,
        kpis: [
            { name: 'Engagement Rate', unit: '%', target: 5 },
            { name: 'Posts Publicados / Mes', unit: 'posts', target: 60 },
            { name: 'Crecimiento de Seguidores', unit: '%/mes', target: 8 }
        ],
        skills: ['Twitter/X', 'Instagram', 'LinkedIn', 'Facebook', 'TikTok', 'YouTube Shorts', 'copywriting', 'analytics', 'scheduling'],
        complianceLaws: ['LFPDPPP', 'NOM-028'],
        handlers: ['schedulePost', 'generateCopy', 'engagementReport', 'trendMonitor']
    },
    {
        id: 'sysadmin',
        name: 'SysAdmin e Infraestructura',
        shortName: 'SysAdmin',
        icon: '🖥️',
        color: 'slate',
        description: 'Administración de servidores, DNS, cloud, Linux/Windows, backups, monitoreo 24/7 y respuesta a incidentes.',
        maxPersonnel: 8,
        kpis: [
            { name: 'Uptime de Servicios', unit: '%', target: 99.95 },
            { name: 'MTTR (Tiempo Medio de Resolución)', unit: 'minutos', target: 30 },
            { name: 'Backups Verificados', unit: '%', target: 100 }
        ],
        skills: ['servidores', 'DNS', 'cloud', 'Linux', 'Windows Server', 'infraestructura', 'backups', 'monitoring', 'incident response', 'sysadmin'],
        complianceLaws: ['LFPDPPP', 'ISO 27001'],
        handlers: ['provisionServer', 'runBackup', 'checkService', 'incidentResponse']
    }
];
