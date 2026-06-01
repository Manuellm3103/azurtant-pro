import { orchestratorAgent } from './src/agents/orchestratorAgent.js';

const msg = 'Dame un plan para reducir churn 20%';
const lower = msg.toLowerCase();
const allKws = {
    ceo: { high: ['estrategia', 'plan estratégico', 'okr', 'kpi', 'visión', 'swot', 'dirección general', 'board meeting', 'consejo', 'reporte ejecutivo', 'objetivos trimestrales', 'inversionistas'], med: ['estratégico', 'dirección', 'general', 'consejo', 'reporte mensual', 'agendar reunión'], low: ['plan', 'resumen'] },
    tecnologia: { high: [], med: ['servidor', 'computadora', 'laptop', 'error', 'bug', 'sistema caído', 'red', 'tech', 'ti ', 'soporte', 'caído', 'auditoría de seguridad', 'migración'], low: ['tecnología', 'infraestructura', 'cloud'] }
};
for (const [dept, kws] of Object.entries(allKws)) {
    let s=0;
    for (const kw of kws.high||[]) if (lower.includes(kw)) { s+=3; console.log('  HIGH', dept, kw); }
    for (const kw of kws.med||[]) if (lower.includes(kw)) { s+=2; console.log('  MED', dept, kw); }
    for (const kw of kws.low||[]) if (lower.includes(kw)) { s+=1; console.log('  LOW', dept, kw); }
    console.log(dept+':', s);
}
console.log('---');
console.log('result:', orchestratorAgent.detectDepartment(msg));
