# Guía de Configuración — Bot WhatsApp

## Paso 1: Configurar Google Sheets + Apps Script

### 1.1 Abrir el Sheet
Abre tu Google Sheet:
https://docs.google.com/spreadsheets/d/1dXZa5SDgiEm3561quXvkjvLL9L_NCNG7FQoWCdnuytU/

### 1.2 Crear el Apps Script
1. En el Sheet, ve a **Extensiones > Apps Script**
2. Se abre el editor de Apps Script
3. Borra todo el contenido del archivo `Código.gs` que aparece por defecto

### 1.3 Pegar el código
1. Renombra el archivo `Código.gs` a `webapp.gs`
2. Copia y pega TODO el contenido de `bot/tools/webapp.gs` (Bot Maestro V9).
3. Este script único ya incluye el manejo de Google Sheets (CRM) y de IA (Groq). No necesitas más archivos.

### 1.4 Desplegar como Web App
1. Click en **Implementar** (Deploy) > **Nueva implementación**
2. Tipo: selecciona **Aplicación web**
3. Configuración:
   - Descripción: `Bot WhatsApp v1`
   - Ejecutar como: **Yo** (tu cuenta)
   - Quién tiene acceso: **Cualquier persona**
4. Click en **Implementar**
5. Te dará una URL — **copia esa URL**, la necesitas para AutoResponder

La URL se ve así:
```
https://script.google.com/macros/s/AKfycbx.../exec
```

### 1.5 Probar que funciona
Abre esa URL en tu navegador. Deberías ver el texto:
```
Bot activo.
```

Si lo ves, el webhook está listo.

---

## Paso 2: Configurar AutoResponder for WA

### 2.1 Reglas Híbridas (Texto + Web Server)

AutoResponder v9 utiliza 6 reglas híbridas. Algunas responden directo con texto (ahorra tiempo y recursos) y otras conectan al Webhook (Apps Script) para la lógica avanzada y la IA.

Abre AutoResponder for WA y crea las siguientes 6 reglas:

| # | Propósito | Coincidencia (Patrón) | Respuesta Automática | Connect Web Server |
|---|---|---|---|---|
| 1 | Saludo / Menú | `hola*//ola*//hello*//*menu*...` | Texto ("Hola, te damos la bienvenida...") | ❌ Inactivo |
| 2 | Info Programa | `2, dos, two...` | Texto ("Programa The Hollow Pianist...") | ❌ Inactivo |
| 3 | Asesor | `4*//asesor*//humano*...` | Texto ("Nuestro equipo humano...") | ❌ Inactivo |
| 4 | Precios | `3*//*precio*//*costo*...` | Vacío | ✅ Activo (URL Script) |
| 5 | Inscribirse | `1*//*quiero inscribirme*...` | Vacío | ✅ Activo (URL Script) |
| 6 | IA / Catch-all | `*` (Todas o regex para el resto) | Vacío | ✅ Activo (URL Script) |

Para las reglas 4, 5 y 6:
1. Asegúrate de marcar **Connect your web server** en la parte inferior.
2. Pega la URL del Apps Script (Paso 1.4).

### 2.2 Inteligencia Artificial (Integrada en V9)

Ya NO es necesario configurar el nodo "OpenAI (ChatGPT)" dentro de AutoResponder. 
La configuración de la API Key de **Groq** y el *System Prompt* de ventas ya viven dentro de `webapp.gs`. El script V9 gestiona internamente la IA y la respuesta.

### 3.2 Revisa el Sheet
Después de las pruebas, abre tu Google Sheet.
Debería haber una pestaña "CRM" con los registros de prueba.

### 3.3 Solución de Problemas
- **El bot no responde:** Verifica que pusiste bien el Host de Groq (`https://api.groq.com/openai/v1`).
- **Responde cosas raras:** Revisa que el Prompt tenga las variables de historial al final.
