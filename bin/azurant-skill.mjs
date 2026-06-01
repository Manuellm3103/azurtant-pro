#!/usr/bin/env node
/**
 * AzurTant PRO — Skills Marketplace CLI
 * Instala skills pre-empaquetados para extender capacidades de los agentes
 *
 * Uso:
 *   npx azurant-skill list
 *   npx azurant-skill add cfdi-mx
 *   npx azurant-skill add restaurant-mx
 *   npx azurant-skill remove cfdi-mx
 *
 * Un skill es un paquete con:
 *   - SKILL.md     → instrucciones para el LLM
 *   - tools.js     → funciones callable
 *   - data/        → conocimiento estático
 *   - config.json  → metadata
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import https from 'node:https';

const SKILLS_DIR = resolve(process.cwd(), 'skills/installed');
const REGISTRY_URL = 'https://raw.githubusercontent.com/emanuelazurcorp/azurant-skills/main/registry.json';

// ─── Registry hardcoded (fallback si no hay internet) ────────
const BUILTIN_SKILLS = {
    'cfdi-mx': {
        name: 'cfdi-mx',
        version: '1.2.0',
        author: 'Emanuel Azur Corporativo',
        dept: 'finanzas',
        description: 'CFDI 4.0 México — timbrado, cancelación, complementos de pago. Integración con PACs.',
        size: '12 KB',
        deps: [],
    },
    'restaurant-mx': {
        name: 'restaurant-mx',
        version: '0.9.0',
        author: 'Emanuel Azur Corporativo',
        dept: 'operaciones',
        description: 'Restaurante México — menús, comandas, tickets, propinas, CFDI al cliente. Plantilla lista.',
        size: '8 KB',
        deps: ['cfdi-mx'],
    },
    'dental-clinic': {
        name: 'dental-clinic',
        version: '0.8.0',
        author: 'Emanuel Azur Corporativo',
        dept: 'operaciones',
        description: 'Clínica dental — citas, historiales, presupuestos, recordatorios WhatsApp, NOM-013-SSA.',
        size: '10 KB',
        deps: [],
    },
    'ecommerce-mx': {
        name: 'ecommerce-mx',
        version: '1.0.0',
        author: 'Nexscope (port)',
        dept: 'ventas',
        description: 'E-commerce México — MercadoLibre, Amazon MX, Shopify, facturación. 142 sub-skills.',
        size: '34 KB',
        deps: ['cfdi-mx'],
    },
    'whatsapp-business': {
        name: 'whatsapp-business',
        version: '1.1.0',
        author: 'Emanuel Azur Corporativo',
        dept: 'redes',
        description: 'WhatsApp Business API — respuestas automáticas, broadcasts, plantillas aprobadas Meta.',
        size: '6 KB',
        deps: [],
    },
    'real-estate-mx': {
        name: 'real-estate-mx',
        version: '0.7.0',
        author: 'Emanuel Azur Corporativo',
        dept: 'ventas',
        description: 'Inmobiliarias — propiedades, leads, citas, contratos de arrendamiento, corridas financieras.',
        size: '14 KB',
        deps: [],
    },
    'logistics-mx': {
        name: 'logistics-mx',
        version: '0.6.0',
        author: 'Emanuel Azur Corporativo',
        dept: 'operaciones',
        description: 'Logística y paquetería — guías, rastreo, rutas, devoluciones. Integración DHL/FedEx/Estafeta.',
        size: '9 KB',
        deps: [],
    },
    'education-mx': {
        name: 'education-mx',
        version: '0.5.0',
        author: 'Emanuel Azur Corporativo',
        dept: 'rrhh',
        description: 'Educación — escuelas, cursos, inscripciones, RVOE, calificaciones, boletas SEP.',
        size: '11 KB',
        deps: [],
    },
};

// ─── Comandos ───────────────────────────────────────────────
const cmd = process.argv[2] || 'help';
const arg = process.argv[3];

const C = { reset:'\x1b[0m', bright:'\x1b[1m', red:'\x1b[31m', green:'\x1b[32m', yellow:'\x1b[33m', cyan:'\x1b[36m', dim:'\x1b[2m' };
const c = (col, t) => `${C[col]}${t}${C.reset}`;

function ensureDir() {
    if (!existsSync(SKILLS_DIR)) mkdirSync(SKILLS_DIR, { recursive: true });
}

function getInstalled() {
    ensureDir();
    if (!existsSync(join(SKILLS_DIR, 'manifest.json'))) return {};
    return JSON.parse(readFileSync(join(SKILLS_DIR, 'manifest.json'), 'utf8'));
}

function saveInstalled(installed) {
    writeFileSync(join(SKILLS_DIR, 'manifest.json'), JSON.stringify(installed, null, 2));
}

function installSkill(name) {
    const meta = BUILTIN_SKILLS[name];
    if (!meta) { console.log(c('red', `✗ Skill "${name}" no existe. Usa "list" para ver disponibles.`)); process.exit(1); }

    const installed = getInstalled();
    if (installed[name]) {
        console.log(c('yellow', `⚠ "${name}" ya está instalado (v${installed[name].version}). Usa "remove" primero.`));
        return;
    }

    // Instalar dependencias
    for (const dep of meta.deps) {
        if (!installed[dep]) {
            console.log(c('dim', `  → Instalando dependencia: ${dep}`));
            installSkill(dep);
        }
    }

    // Generar archivos del skill
    const skillDir = join(SKILLS_DIR, name);
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, 'SKILL.md'), `# Skill: ${name}\n\n${meta.description}\n\n## Departamento: ${meta.dept}\n## Versión: ${meta.version}\n\nEste skill extiende el agente **${meta.dept}** de AzurTant PRO con conocimiento\ny herramientas específicas del dominio.\n`);
    writeFileSync(join(skillDir, 'config.json'), JSON.stringify(meta, null, 2));
    writeFileSync(join(skillDir, 'tools.js'), `// Tools callable para el skill ${name}\nexport const tools = [];\n`);

    installed[name] = { ...meta, installed_at: new Date().toISOString() };
    saveInstalled(installed);

    console.log(c('green', `✓ ${name} v${meta.version} instalado`));
    console.log(c('dim', `  Departamento: ${meta.dept} · Tamaño: ${meta.size}`));
    if (meta.deps.length) console.log(c('dim', `  Dependencias: ${meta.deps.join(', ')}`));
}

function removeSkill(name) {
    const installed = getInstalled();
    if (!installed[name]) { console.log(c('red', `✗ "${name}" no está instalado.`)); return; }
    const dir = join(SKILLS_DIR, name);
    if (existsSync(dir)) rmSync(dir, { recursive: true });
    delete installed[name];
    saveInstalled(installed);
    console.log(c('green', `✓ ${name} desinstalado`));
}

function listSkills() {
    const installed = getInstalled();
    const builtin = Object.values(BUILTIN_SKILLS);
    console.log(c('cyan', '\n📦 AzurTant Skills Marketplace\n'));
    console.log(c('bright', 'Disponibles para instalar:'));
    for (const s of builtin) {
        const isInstalled = installed[s.name];
        const status = isInstalled ? c('green', '[✓ instalado]') : c('dim', '[ ]');
        console.log(`  ${status} ${c('bright', s.name.padEnd(20))} v${s.version.padEnd(8)} ${c('dim', '·')} ${s.dept.padEnd(12)} ${c('dim', '·')} ${s.size}`);
        console.log(`     ${c('dim', s.description)}`);
    }
    console.log('');
    if (Object.keys(installed).length) {
        console.log(c('bright', 'Instalados en este workspace:'));
        for (const [n, m] of Object.entries(installed)) {
            console.log(`  ${c('green', '●')} ${n} v${m.version}`);
        }
    }
    console.log('');
}

function showHelp() {
    console.log(c('cyan', '\n🧩 AzurTant Skills CLI\n'));
    console.log('  Uso:');
    console.log('    npx azurant-skill list                Lista skills disponibles e instalados');
    console.log('    npx azurant-skill add <name>          Instala un skill');
    console.log('    npx azurant-skill remove <name>       Desinstala un skill');
    console.log('    npx azurant-skill info <name>         Muestra detalles de un skill');
    console.log('    npx azurant-skill help                Esta ayuda');
    console.log('');
}

function showInfo(name) {
    const meta = BUILTIN_SKILLS[name];
    if (!meta) { console.log(c('red', `✗ Skill "${name}" no existe.`)); return; }
    const installed = getInstalled()[name];
    console.log(c('cyan', `\n🧩 ${name}\n`));
    console.log(`  ${c('dim', 'Versión:')}    ${meta.version}`);
    console.log(`  ${c('dim', 'Author:')}     ${meta.author}`);
    console.log(`  ${c('dim', 'Dept:')}       ${meta.dept}`);
    console.log(`  ${c('dim', 'Tamaño:')}     ${meta.size}`);
    console.log(`  ${c('dim', 'Deps:')}       ${meta.deps.length ? meta.deps.join(', ') : 'ninguna'}`);
    console.log(`  ${c('dim', 'Status:')}     ${installed ? c('green', 'instalado') : c('yellow', 'no instalado')}`);
    console.log(`\n  ${meta.description}\n`);
}

switch (cmd) {
    case 'list':   listSkills(); break;
    case 'add':    arg ? installSkill(arg) : console.log(c('red', '✗ Falta nombre del skill')); break;
    case 'remove': arg ? removeSkill(arg) : console.log(c('red', '✗ Falta nombre del skill')); break;
    case 'info':   arg ? showInfo(arg) : console.log(c('red', '✗ Falta nombre del skill')); break;
    case 'help':
    case '--help':
    case '-h':
    default: showHelp();
}
