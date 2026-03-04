# gemini.md — Mapa del Proyecto: Bot de Ventas WhatsApp

## Estado: FASE 3 — ARCHITECT (Construcción)

---

## 1. Descubrimiento B.L.A.S.T. (Confirmado)

### North Star
Bot de WhatsApp que atienda clientes, venda el programa de piano y guíe al pago — automáticamente, 24/7.

### Integraciones
| Servicio | Estado | Detalle |
|---|---|---|
| AutoResponder for WA Premium | ✅ | Versión híbrida: 6 reglas (texto directo + webhook) |
| Google Apps Script | ✅ | Webhook Maestro V9 (Router, Estado, IA y CRM consolidados) |
| Google Sheets | ✅ | CRM en cuenta adsf38759@gmail.com |
| Groq AI (Llama 3) | ✅ | API consumida directamente desde Apps Script (Llama3-70b/8b) |

- **Sheet URL**: https://docs.google.com/spreadsheets/d/1dXZa5SDgiEm3561quXvkjvLL9L_NCNG7FQoWCdnuytU/
- **Cuenta Google**: adsf38759@gmail.com

### Source of Truth
Google Sheets — CRM con estados: INTERESADO → REGISTRADO → PAGADO → ACTIVO

### Delivery Payload
- **Salida 1**: Respuesta automática en WhatsApp (texto devuelto a AutoResponder)
- **Salida 2**: Fila insertada/actualizada en Google Sheets CRM

### Reglas de Comportamiento
- Tono profesional, mínimo de emojis
- Lenguaje inclusivo (listo/a, bienvenido/a)
- NUNCA confirmar un pago — solo avisar que un asesor verificará
- Detectar Colombia → mostrar Daviplata/Nequi/transferencia
- No inventar información sobre el programa
- Inscripción solo requiere: nombre completo + país
- Asesores disponibles: 9am - 10pm hora Colombia, todos los días

### Datos de Pago
| Método | Detalle | Para quién |
|---|---|---|
| PayPal | paypal.me/TheHollowAcademy/80 | Internacional (NO Colombia) |
| Daviplata/Nequi/Bancolombia/Bre-B | Llave 3184916177 | Colombia (290mil COP) |
| Imagen de pago | En celular del operador | Se envía como adjunto en AutoResponder |

### Arquitectura
**Híbrida V9**: 
- **AutoResponder (Local)**: Reglas fijas (saludo, info, asesor) responden con texto plano para ahorrar coste/latencia.
- **Webhook (Apps Script)**: Recibe flujos clave (precios, inscripciones) y peticiones abiertas (fallback IA). Maneja "Memoria de Estado" (CacheService para capturar datos en 2 pasos), consulta/escribe Google Sheets, y llama a la API de **Groq (Llama 3)** internamente.

---

## 2. Esquema de Datos

### Input (POST de AutoResponder → Apps Script)

AutoResponder envía un POST JSON con estos campos:

```json
{
  "message": "texto del mensaje del usuario",
  "contact": "Nombre del contacto (+573046708255)"
}
```

### Output (Apps Script → AutoResponder)

Texto plano que AutoResponder envía como respuesta:

```
Texto de respuesta del bot
```

### Google Sheets Row (CRM)

```json
{
  "fecha": "2026-02-18",
  "telefono": "+573046708255",
  "nombre": "Juan Pérez",
  "pais": "México",
  "estado": "INTERESADO | REGISTRADO | PAGADO | ACTIVO",
  "notas": ""
}
```

---

## 3. Estructura de Archivos

```
bot/
├── gemini.md                         # Este archivo
├── architecture/
│   └── sop-conversation-flow.md      # Flujo de conversación completo
├── tools/
│   └── webapp.gs                     # Apps Script único Maestro V9 (Webhook, Groq, CRM)
└── setup-guide.md                    # Guía de configuración AutoResponder
```

---

## 4. Maintenance Log

_(Se llenará en Fase T — Trigger)_
