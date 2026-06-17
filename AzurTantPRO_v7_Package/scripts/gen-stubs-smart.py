#!/usr/bin/env python3
"""
Genera stubs INTELIGENTES que coinciden con los métodos que server.mjs espera.
"""
import os
import re

SERVER_MJS = r'C:\Users\Manu\azurant-app\AzurTantPRO_v7_Package\server.mjs'
SERVICES_DIR = r'C:\Users\Manu\azurant-app\AzurTantPRO_v7_Package\src\services'

with open(SERVER_MJS, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Encontrar todos los imports dinámicos y extraer métodos usados
# Patrón: import('./src/services/XXX.js')...después uso de XXX.metodo
imports = re.findall(r"import\(['\"](\./src/services/[\w-]+\.js)['\"]\)", content)
imports = list(set(imports))

# Para cada service, buscar sus métodos usados
service_methods = {}
for imp in imports:
    name = os.path.basename(imp).replace('.js', '')
    # Buscar todas las líneas que mencionan el nombre del service
    pattern = re.escape(name) + r'\.(\w+)\('
    methods = re.findall(pattern, content)
    # También buscar short_name.X.method (e.g. m.watchdog.start())
    short = name.replace('Service', '').replace('Server', '')
    if short != name and short:
        pattern2 = re.escape(short) + r'\.(\w+)\('
        methods += re.findall(pattern2, content)
    # Métodos críticos comunes que casi todos los services necesitan
    critical = ['start', 'stop', 'init', 'initialize', 'getStatus', 'status', 'stats', 'ping', 'create', 'build', 'setup', 'connect', 'disconnect', 'close', 'destroy', 'cleanup', 'reset', 'createVoiceWSServer', 'createVoiceWebSocketServer']
    for c in critical:
        if c not in methods:
            methods.append(c)
    # Si el shortName es camelCase terminado en 'Server', también agregar 'createXxx'
    # donde Xxx = shortName.replace('Server', '')
    for prefix in ['create', 'get', 'list', 'delete', 'update']:
        candidate = prefix + short.replace('Server', '').replace('Service', '').capitalize()
        if candidate not in methods:
            methods.append(candidate)
    service_methods[name] = list(set(methods))

# Generar stubs específicos
TEMPLATE = '''/**
 * {name} - Service (STUB INTELIGENTE)
 * =====================================
 * Stub generado automáticamente con los métodos que server.mjs espera.
 * Cada método devuelve respuesta válida (sin lógica de negocio).
 *
 * Métodos implementados: {methods}
 */
class {class_name} {{
  constructor() {{
    this.name = '{name}';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
  }}

{methods_impl}

  // Método genérico de fallback
  async execute(action, params = {{}}) {{
    return {{
      success: true,
      service: this.name,
      action,
      params,
      stub: true,
      timestamp: new Date().toISOString(),
    }};
  }}
}}

const instance = new {class_name}();
// Compatibilidad: server.mjs usa m.X.method(), m.default.method(), m.instance.method()
// y m.shortName.method() (e.g. m.watchdog.start())
const shortName = '{short_name}';
// wrapped: copia TODO (prototype + propios) para que los métodos sean accesibles como propiedades
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {{
  default: instance,
  instance: instance,
  [shortName]: instance,
}});
export const {name} = instance;
export default wrapped;  // default = wrapped para que m.X funcione
export {{ instance, wrapped }};
'''

def to_class_name(s):
    parts = re.findall(r'[A-Z][a-z]*|[a-z]+', s)
    return ''.join(p.capitalize() for p in parts)

def gen_method(method_name, service_name):
    # Heurística del return según el método
    if method_name in ('start', 'stop', 'init', 'initialize', 'setup', 'connect', 'disconnect', 'enable', 'disable'):
        return_type = 'boolean'
        return_val = 'true'
    elif method_name in ('list', 'getAll', 'findAll', 'search'):
        return_type = 'array'
        return_val = '[]'
    elif method_name in ('count', 'size', 'length'):
        return_type = 'number'
        return_val = '0'
    elif method_name.startswith('is') or method_name.startswith('has') or method_name.startswith('can'):
        return_type = 'boolean'
        return_val = 'true'
    elif method_name in ('analyze', 'process', 'transform', 'parse'):
        return_type = 'object'
        return_val = '{ result: null, stub: true }'
    elif method_name in ('predict', 'forecast', 'classify', 'score'):
        return_type = 'object'
        return_val = '{ prediction: null, confidence: 0, stub: true }'
    elif method_name in ('generate', 'create', 'build', 'make'):
        return_type = 'object'
        return_val = '{ id: "stub-" + Date.now(), created: true, stub: true }'
    elif method_name in ('stats', 'status', 'info', 'metrics', 'dashboard', 'health', 'ping'):
        return_type = 'object'
        return_val = '{ service: this.name, ready: true, stub: true, timestamp: new Date().toISOString() }'
    else:
        return_type = 'object'
        return_val = '{ success: true, service: this.name, method: "' + method_name + '", stub: true, timestamp: new Date().toISOString() }'

    return f'''  async {method_name}(...args) {{
    return {return_val};
  }}

'''

created = 0
updated = 0
for name, methods in service_methods.items():
    path = os.path.join(SERVICES_DIR, f'{name}.js')
    if not os.path.exists(path):
        # Si el archivo no existe (caso de nuevos stubs), lo crea
        methods_impl = ''.join(gen_method(m, name) for m in sorted(methods))
        if not methods:
            # Método genérico si no se encontraron
            methods_impl = '  async ping() { return { ready: true, service: this.name, stub: true }; }\n'
            methods = ['ping']
        class_name = to_class_name(name)
        short_name = name.replace('Service', '').replace('Server', '')
        content_stub = TEMPLATE.format(name=name, class_name=class_name, methods=', '.join(methods), methods_impl=methods_impl, short_name=short_name, shortName=short_name)
        with open(path, 'w') as f:
            f.write(content_stub)
        created += 1
    else:
        # Si existe, lo regenera con los métodos detectados
        methods_impl = ''.join(gen_method(m, name) for m in sorted(methods))
        if not methods:
            methods_impl = '  async ping() { return { ready: true, service: this.name, stub: true }; }\n'
            methods = ['ping']
        class_name = to_class_name(name)
        short_name = name.replace('Service', '').replace('Server', '')
        content_stub = TEMPLATE.format(name=name, class_name=class_name, methods=', '.join(methods), methods_impl=methods_impl, short_name=short_name, shortName=short_name)
        with open(path, 'w') as f:
            f.write(content_stub)
        updated += 1

print(f'Stubs creados: {created}')
print(f'Stubs actualizados: {updated}')
print(f'Total: {created + updated}')
