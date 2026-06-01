# AzurTant PRO v1.0

**Sistema Multi-Agente para Empresas Zero Employees**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-yellow)

---

## 🎯 ¿Qué es AzurTant PRO?

AzurTant PRO es un sistema de inteligencia artificial autónomo diseñado para **empresas con cero empleados** (micro/pymes). Automatiza el 100% de las operaciones empresariales utilizando 13 departamentos de IA especializados.

### Características Principales

| Característica | Descripción |
|----------------|-------------|
| 🌐 **13 Departamentos** | IA especializada por área de negocio |
| 🎤 **Voz Multimodal** | Control por voz con STT + TTS |
| 🧠 **RAG Persistente** | GraphRAG + Mem0 para memoria de largo plazo |
| 🔬 **DeepResearch** | Búsqueda en GitHub y Reddit |
| 📊 **Excel/Word/PDF** | Generación de documentos empresariales |
| 🏢 **Zero Employees** | Automatización total sin personal |

---

## 📦 Instalación

### Requisitos
- Node.js 18+
- Ollama (para LLM local)
- Windows 10+, macOS, o Linux

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/emanuelazurcorp/azurant-pro.git
cd azurant-pro

# 2. Instalar dependencias
npm install

# 3. Asegúrate de que Ollama esté corriendo
ollama serve

# 4. Ejecutar en modo desarrollo
npm run dev

# 5. O construir para producción
npm run build
```

---

## 🏢 Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                     AZURTANT PRO                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐                                        │
│  │   CEO       │ ◄── Orquestador (auto-ruta)           │
│  └──────┬──────┘                                        │
│         │                                                │
│  ┌──────┴──────┬──────┬──────┬──────┬──────┐          │
│  │              │      │      │      │      │          │
│  01-13       FINANZAS  OPERA  LEGAL  RRHH  TECNOLOGÍA   │
│  DEPTOS                                                     │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  RAG Layer                                                │
│  ├── GraphRAG (relaciones entre entidades)             │
│  ├── Mem0 (memoria persistente)                          │
│  └── Obsidian (knowledge base)                            │
├─────────────────────────────────────────────────────────┤
│  LLM Layer                                                │
│  └── Ollama (auto-selector de modelos)                   │
│      ├── llama3.2 (general)                              │
│      ├── codellama (código)                              │
│      ├── mixtral (análisis)                              │
│      └── deepseek-r1 (razonamiento)                      │
├─────────────────────────────────────────────────────────┤
│  Voice Layer                                              │
│  └── STT + TTS (entrada/salida de voz)                  │
├─────────────────────────────────────────────────────────┤
│  Research Layer                                          │
│  └── GitHub + Reddit (deep research)                    │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura del Proyecto

```
azurant-pro/
├── src/
│   ├── agents/           # Agente orquestador
│   ├── components/       # Componentes React
│   ├── services/         # Ollama, Mem0, GraphRAG, DeepResearch, Voice
│   └── App.jsx           # Aplicación principal
├── src-tauri/           # Backend Tauri (Rust)
├── config/              # Configuración Hermes
├── scripts/             # Scripts de testing
├── skills/              # Skills de sistema
└── package.json
```

---

## 🎮 13 Departamentos

| # | Departamento | Funciones Principales |
|---|-------------|----------------------|
| 01 | CEO / Dirección | Orquestador, estrategia, decisiones |
| 02 | Finanzas | Contabilidad, nóminas, impuestos, balances |
| 03 | Operaciones | Procesos, workflows, optimización |
| 04 | Legal | Contratos, compliance, consultoría |
| 05 | RRHH | Reclutamiento, onboarding, capacitación |
| 06 | Tecnología | Soporte N1-N5, redes, sistemas |
| 07 | Marketing | Branding, CVs, páginas web, contenido |
| 08 | Ventas | CRM, prospectos, propuestas comerciales |
| 09 | Compras | Proveedores, inventarios, órdenes |
| 10 | Seguridad | Ciberseguridad, auditorías, accesos |
| 11 | Innovación | I+D, research GitHub/Reddit, prototipado |
| 12 | Redes Sociales | Contenido automático para redes |
| 13 | SysAdmin | Infraestructura, servidores, backups |

---

## 🧪 Testing

```bash
# Ejecutar los 20 casos de negocio
npm test

# Resultados esperados: 18/20 passing (90% success rate)
```

---

## 🔧 Configuración

### Ollama
```bash
# Instalar Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Descargar modelos
ollama pull llama3.2
ollama pull codellama
ollama pull mixtral
ollama pull nomic-embed-text
```

### Variables de Entorno
```env
OLLAMA_ENDPOINT=http://localhost:11434
GITHUB_TOKEN=your_github_token
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
```

---

## 📄 Licencia

MIT License - Emanuel Azur Corporativo

---

## 🌐 Contacto

- **Empresa**: Emanuel Azur Corporativo
- **Website**: https://emanuelazurcorp.com
- **Email**: info@emanuelazurcorp.com

---

**AzurTant PRO v1.0** — Automatización empresarial con IA para zero employees.