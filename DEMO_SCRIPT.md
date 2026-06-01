# 🎬 Script de Demo en Vivo — AzurTant PRO (30 min)

**Para:** Manuel (CEO Emanuel Azur) ejecutando la demo
**A:** Prospectos PyME en México (1-50 empleados)
**Stack:** `azurant-pro.exe` + Ollama local

---

## ⏱️ Minuto 0-2 · Apertura (NO mostrar producto todavía)

> "Antes de mostrarte el producto, déjame preguntarte: **¿cuántas horas a la semana se te van en tareas que un实习生 podría hacer?** Facturas, contratos, posts de Instagram, responder leads, conciliaciones..."

Deja que hable. Anota 2-3 dolores. Vas a usar esto en el minuto 25 cuando preguntes el precio.

> "Te voy a mostrar una app que tengo en mi laptop — se llama **AzurTant PRO** — y que reemplaza 13 departamentos completos con IA. Corre local, en tu máquina, sin mandar tus datos a la nube. ¿Te parece si arrancamos con un caso real?"

---

## ⏱️ Minuto 2-5 · Cold Open: el chat global

**Acción:** Abre `azurant-pro.exe` (la ventana tarda ~3 seg). Muestra el dashboard.

> "Aquí está. Una sola ventana. Arriba tengo 13 departamentos. Cada uno es un agente IA con skills, KPIs y compliance específicos. Lo que voy a hacer es hablarle como si fuera un CEO, y el orchestrator decide a qué departamento le toca."

**Acción:** Click en el chat global (abajo). Escribe LITERALMENTE:

```
Necesito una factura CFDI para Acme Corp por $50,000 MXN 
por consultoría multi-agente
```

**Pulsa Enter.** Espera. La respuesta tarda ~25-35 seg con LLM real.

> "Mientras piensa, mira este detalle: el orchestrator está decidiendo a qué depto mandarlo. Ya lo mandé a **finanzas**. Y la factura que va a salir tiene folio del SAT."

Cuando llegue la respuesta, lee la primera línea en voz alta.

---

## ⏱️ Minuto 5-8 · El "wow" técnico: el hub inter-agente

> "Ahora mira esto, que es lo que me enamoró del sistema."

**Acción:** Click en "Enterprise Dashboard" (botón de navegación).

> "Aquí ves los 13 departamentos. Fíjate en la columna 'Conexiones': cada agente sabe a quién le puede pedir ayuda. Finanzas le pregunta a Legal por temas fiscales. Marketing le pide datos a Ventas. Es como un equipo de verdad."

**Acción:** Click en cualquier departamento (ej. `marketing`).

> "Cada depto tiene su propio chat, su historial y sus KPIs. **Esto no son chatbots aislados** — es una red."

---

## ⏱️ Minuto 8-12 · Caso 2: lead nuevo (cross-department workflow)

> "Ahora un caso típico: llega un lead a mi empresa. ¿Qué pasa?"

**Acción:** Regresa al chat global. Escribe:

```
Llegó un lead: Juan Pérez de Innovatech SA, presupuesto $250,000, 
interesado en Plan Enterprise. ¿Qué hacemos?
```

**Espera ~30 seg.**

> "Lo que acaba de pasar: el CEO le pasó el lead a Marketing para cualificarlo, Marketing lo calificó y se lo pasó a Ventas, y Ventas ya tiene un primer outreach armado. Todo sin que yo moviera un dedo. Eso normalmente son 3 personas y 4 horas."

---

## ⏱️ Minuto 12-16 · Caso 3: voz + RAG

> "Y esto ya está en español con voz."

**Acción:** Click en el ícono de micrófono (si tu máquina tiene mic). Si no:

> "Te lo enseño con texto para que no haya problema de audio, pero el botón de micrófono está aquí y funciona con STT+TTS local. Tú le dices 'oye AzurTant, dime cuánto facturé este mes' y te contesta hablando."

**Acción:** Escribe:

```
¿Qué te acuerdas del cliente Acme Corp? 
```

> "Esta pregunta está usando la memoria de largo plazo. Mem0 + GraphRAG. El sistema recuerda clientes, decisiones, contexto. La próxima vez que llame Acme, ya sabe quién es."

---

## ⏱️ Minuto 16-20 · Las features que matan objeciones

> "Antes de pasar al precio, déjame cubrir las 3 objeciones que me han dicho todos:"

### Objeción 1: "Mis datos a la nube"

> "Mira la barra de título. Es **Windows nativo**, Tauri. No hay Electron, no hay Chromium. Todo corre local. Lo único que sale de tu máquina es si tú lo decides."

Abre terminal (sutil) y muestra:
```bash
netstat -an | findstr ESTABLISHED | findstr 11434
```
> "Solo una conexión: a Ollama local en localhost. Punto."

### Objeción 2: "¿Y si me equivoco de modelo de IA?"

> "Tú corres el LLM. Literal. Si mañana sale Llama 4 mejor que Nemotron, lo bajas y AzurTant lo usa. No dependes de OpenAI ni de Anthropic ni de nadie."

### Objeción 3: "¿Y la facturación CFDI es real?"

> "Sí. El módulo de finanzas habla CFDI 4.0 con el SAT. Timbra, cancela, hace complementos de pago, nómina — todo el flujo real. No es demo, es producción."

---

## ⏱️ Minuto 20-25 · Pricing transparente

> "OK, hablemos de plata."

Muestra la pantalla de pricing (o el README):

> | Plan | Precio | Incluye |
> |---|---|---|
> | **Starter** | $4,999 MXN/mes | 5 deptos, 1K msgs, CFDI |
> | **Pro** (popular) | $14,999 MXN/mes | 13 deptos, voz, SOPs, GraphRAG |
> | **Enterprise** | $39,999 MXN/mes | Multi-sucursal, API, SLA |

> "El Pro te deja reemplazar **un coordinador administrativo + un asistente de ventas**. Esos dos te cuestan $30-40K al mes. **Te ahorras $180-200K al año.**"

---

## ⏱️ Minuto 25-30 · El cierre

> "¿Cuál es la siguiente pregunta que te tengo que contestar para que digas 'sí, lo quiero'?"

**CALLES DE CIERRE:**

1. **"¿Lo puedo probar 14 días?"** → Sí, 14 días sin tarjeta. Te paso un instalador.

2. **"¿Cuánto tarda en estar funcionando?"** → 24-48 horas. Te lo dejo configurado con tus colores, tus clientes, tu SAT.

3. **"¿Y si no funciona para mi caso?"** → Te devuelvo el 100% del primer mes. Sin preguntas.

4. **"¿Necesito traer a mi contador?"** → No. El módulo de finanzas ya hace CFDI 4.0, conciliación, nóminas. Tu contador solo supervisa.

5. **"¿Lo puedo rentar o tengo que comprar?"** → Solo renta mensual. Sin contratos forzosos. Cancelas cuando quieras.

**CIERRE FIRME:**

> "Te voy a mandar ahorita el contrato y un link para agendar el setup. ¿Mañana a las 10am o pasado mañana a las 4pm?"

---

## 🆘 Plan B (si algo falla)

| Falla | Recovery |
|---|---|
| Ollama no responde en 60s | "Esto es por el LLM. Mira, déjame correr el demo E2E desde terminal que ya tengo pregrabado — es lo mismo" → `node demo-e2e.mjs` |
| Ventana no abre | Reinicia el .exe. Si vuelve a fallar, "Te muestro el backend funcionando — los 13 deptos responden, mira la salida" |
| Cliente no tiene web | Saltar la parte de OG tags, decir "Ya tenemos dominio propio" |
| Cliente pregunta algo técnico fuera de tu scope | "Déjame traer a mi CTO a la siguiente call. Es mejor que te lo explique él" |

## 📋 Checklist pre-demo (5 min antes)

- [ ] `azurant-pro.exe` abre sin errores
- [ ] Ollama corriendo (`ollama list` muestra modelos)
- [ ] `node smoke-test.mjs` → 50/50 verde
- [ ] Internet estable (por si necesitas mostrar landing)
- [ ] Landing abierta en pestaña de Chrome: `http://127.0.0.1:5193/landing.html`
- [ ] Contrato PDF listo para enviar
- [ ] Calendly / link de setup abierto
