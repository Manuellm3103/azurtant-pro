#!/usr/bin/env python3
"""
Genera stubs INTELIGENTES con los métodos REALES que server.mjs llama.
"""
import os
import re

SERVER_MJS = r'C:\Users\Manu\azurant-app\AzurTantPRO_v7_Package\server.mjs'
SERVICES_DIR = r'C:\Users\Manu\azurant-app\AzurTantPRO_v7_Package\src\services'

with open(SERVER_MJS, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Extraer todos los aliases de services
imports = re.findall(r'const\s*\{\s*(\w+)\s*\}\s*=\s*await\s+import\(', content)
imports = list(set(imports))

# Mapeo: alias -> nombre de archivo
# La mayoría: alias = shortName del nombre (sin Service/Server)
# Pero hay excepciones: 'oracle' = oraclePredictiveService, 'shield' = cyberShieldService, etc.
ALIAS_TO_FILE = {}
for alias in imports:
    # Buscar el archivo que coincida con este alias
    candidates = [
        f'{alias}Service.js',
        f'{alias}Server.js',
        f'{alias.lower()}Service.js',
    ]
    for c in candidates:
        if os.path.exists(os.path.join(SERVICES_DIR, c)):
            ALIAS_TO_FILE[alias] = c
            break
    else:
        # No encontrado, generar nombre por convención
        ALIAS_TO_FILE[alias] = f'{alias}Service.js'

# Extraer métodos por alias
service_methods = {}
for alias in imports:
    pattern = re.escape(alias) + r'\.(\w+)\('
    methods = re.findall(pattern, content)
    # Métodos críticos comunes
    methods += ['start', 'stop', 'init', 'initialize', 'getStatus', 'status', 'stats', 'ping']
    service_methods[alias] = list(set(methods))

TEMPLATE = '''/**
 * {filename} - Service (STUB FUNCIONAL)
 * =====================================
 * Stub generado automáticamente. Métodos que server.mjs espera.
 * Aliases exportados: {aliases}
 */
class {class_name} {{
  constructor() {{
    this.name = '{name}';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
  }}

{methods_impl}
}}

const instance = new {class_name}();
{aliases_exports}
// method exports for direct namespace access
{methods_exports}
export default instance;
export {{ instance }};
'''

def to_class_name(s):
    parts = re.findall(r'[A-Z][a-z]*|[a-z]+', s)
    return ''.join(p.capitalize() for p in parts) if parts else s[0].upper() + s[1:]

def gen_method(method_name):
    # Decide el return según heurística
    if method_name in ('start', 'stop', 'init', 'initialize', 'enable', 'disable', 'isReady'):
        return_val = 'true'
    elif method_name in ('list', 'getAll', 'search', 'getTrending', 'getTrendingResources', 'searchResources', 'browse', 'listCredentials', 'listDocuments', 'listRecipes', 'listClones', 'listAnalyses', 'listTickets', 'listProjects', 'listTemplates', 'listShifts', 'listAllPrompts', 'getAllBlueprintSummaries', 'getCategories', 'getStats', 'getMetrics', 'getCacheStats', 'getMemoryStats', 'stats', 'getOpenAPISpec', 'getDashboard', 'getHistory', 'getRun', 'getActiveAlerts', 'getAlerts', 'getPipeline', 'getConversation', 'getContext', 'getRun', 'getRun'):
        return_val = '{ items: [], total: 0, stub: true }'
    elif method_name in ('get', 'getById', 'getTicket', 'getRun', 'getThreats', 'getHighPriority', 'getOpportunities', 'getNodeHistory', 'getSLAReport', 'getTicketDetails', 'getAgent', 'getAgentSummaries', 'getAgentActivity', 'getDailyStats', 'getDepartmentKPIs', 'getTokenStats', 'getAnomalies', 'getReport', 'getComplianceReport', 'getBalanceGeneral', 'getBalanza', 'getCalculoIVA', 'getEstadoResultados', 'getWorkflows', 'getAuditTrail', 'getShifts', 'getBarData', 'getGaugeData', 'getPieData', 'getFullDashboard', 'getLiveFeed', 'getLearningStats', 'getPendingGates', 'getPendingApprovals', 'getBlueprints', 'getStatus', 'getState', 'getCached', 'getContext', 'getPrisms', 'getRules', 'getRun', 'getRun'):
        return_val = '{ id: null, stub: true }'
    elif method_name in ('analyze', 'analyzeLogs', 'analyzeContract', 'analyzeABTest', 'analyzeCompetitors', 'analyzeCodebase', 'analyzeDirectory', 'analyzeBatch', 'analyzeImage', 'analyzeVideo', 'predict', 'predictFailures', 'predictFuture', 'findCausalEffects', 'getTimeline', 'getNodeHistory', 'detectAnomalies', 'forecast', 'classify', 'scan', 'scanDevices', 'fullScan', 'diagnose', 'diagnoseWiFi', 'diagnosePrinter', 'assessNOM035', 'assessVulnerabilities', 'validate', 'validateContract', 'validateClone', 'validateOutput', 'checkStack', 'checkSlop', 'evaluateCodeQuality', 'research', 'extract', 'process', 'processEmail', 'processBatch', 'processAgentResponse', 'remember', 'recall', 'addEdge', 'addNode', 'add', 'addToKB', 'addContact', 'addDeal', 'addShift', 'applyLearning', 'applyPrism', 'autoResolve', 'autoResolveN1', 'autoBuild', 'autoRemediate', 'autoFix', 'format', 'observe', 'answerQuery', 'route', 'abTest', 'fusion', 'deploy', 'deployHoneypot', 'respondToIncident'):
        return_val = '{ result: null, confidence: 0, stub: true, timestamp: new Date().toISOString() }'
    elif method_name in ('create', 'createTicket', 'createTeam', 'createGate', 'createTable', 'createAgent', 'createCompany', 'createVoiceWSServer'):
        return_val = '{ id: "stub-" + Date.now(), created: true, stub: true, timestamp: new Date().toISOString() }'
    elif method_name in ('update', 'updateAgent', 'updateTicket', 'upsert', 'upsertNode', 'bulkSchedule'):
        return_val = '{ updated: true, stub: true, timestamp: new Date().toISOString() }'
    elif method_name in ('delete', 'deleteWorkflow', 'forget', 'remove'):
        return_val = '{ deleted: true, stub: true, timestamp: new Date().toISOString() }'
    elif method_name in ('run', 'execute', 'executeRecipe', 'executeAgent', 'executeStep', 'runCommand', 'runOnboarding', 'startOnboarding', 'runNightShift', 'writeFile', 'makeDir', 'openFolder', 'openApp', 'speak', 'play', 'storeCredential', 'schedulePost', 'registerPoliza'):
        return_val = '{ executed: true, stub: true, output: null, timestamp: new Date().toISOString() }'
    elif method_name in ('calculateFiniquito', 'generateClone', 'generateSuggestions', 'generateContent', 'generateCampaign', 'generateCalendar', 'generateVideo', 'generateScript', 'generateComplianceReport', 'compress', 'convert', 'transcribe', 'screenshot', 'takeControl', 'getActiveWindow', 'listWindows', 'rdpConnect', 'rustdeskConnect', 'typeText', 'buildCompany', 'buildNomina', 'searchKB', 'searchAll', 'ingestDocument', 'approve', 'approvePipeline', 'insert', 'query', 'indexDocument', 'wakeOnLan', 'traceroute', 'ping', 'dnsLookup', 'discoverPrinters', 'mapTopology', 'repairPrinter', 'recommendTeam', 'recommend', 'install', 'consolidate', 'getSharedBrain', 'navigate', 'conversation', 'preResolve', 'summarize', 'scoreInvestment', 'registerPoliza', 'getBudgetStatus', 'startABTest'):
        return_val = '{ result: null, stub: true, timestamp: new Date().toISOString() }'
    else:
        return_val = '{ success: true, service: this.name, method: "' + method_name + '", stub: true, timestamp: new Date().toISOString() }'
    return f'  async {method_name}(...args) {{ return {return_val}; }}\n\n'

# Para cada archivo, generar el stub con TODOS los métodos de los aliases que apuntan a él
file_methods = {}
for alias, methods in service_methods.items():
    fname = ALIAS_TO_FILE[alias]
    if fname not in file_methods:
        file_methods[fname] = {'methods': set(), 'aliases': []}
    file_methods[fname]['methods'].update(methods)
    file_methods[fname]['aliases'].append(alias)

# Generar cada stub
for fname, info in file_methods.items():
    path = os.path.join(SERVICES_DIR, fname)
    name = fname.replace('.js', '')
    class_name = to_class_name(name)
    methods = sorted(info['methods'])
    methods_impl = ''.join(gen_method(m) for m in methods)
    aliases = info['aliases']

    # Construir exports para los aliases
    aliases_exports = '\n'.join(f'export const {a} = instance;' for a in sorted(set(aliases)))

    # Construir exports para cada método (para acceso directo al namespace)
    methods_exports = '\n'.join(f'export const {m} = (...args) => instance.{m}(...args);' for m in methods)

    content_stub = TEMPLATE.format(
        filename=name,
        name=name,
        class_name=class_name,
        aliases=', '.join(sorted(set(aliases))),
        methods_impl=methods_impl,
        aliases_exports=aliases_exports,
        methods_exports=methods_exports,
    )

    with open(path, 'w') as f:
        f.write(content_stub)

print(f'Stubs regenerados: {len(file_methods)} archivos')
print(f'Aliases totales: {len(imports)}')
