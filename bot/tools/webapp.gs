const CONFIG = {
  SHEET_NAME: 'CRM',
  // INTELIGENCIA ARTIFICIAL (GROQ)
  GROQ_API_KEY: 'TU_API_KEY_AQUI', // REEMPLAZAR CON TU API KEY REAL EN APPS SCRIPT
  GROQ_MODEL: 'llama-3.1-8b-instant', // Modelo actualizado a 8B instant para maximizar la cuota gratuita.
  
  // PAGOS
  PAYMENT_COLOMBIA: 'Llave Bre-B para Colombia 3184916177', 
  PAYMENT_INTERNACIONAL: 'Link de pago internacional paypal.me/TheHollowAcademy/80',
  
  // OTRAS CONFIGURACIONES
  CACHE_TIME_AI: 0, // ¡CACHÉ APAGADO PARA PRUEBAS!
  CACHE_TIME_STATE: 600 // 10 minutos para esperar datos de registro
};

function doPost(e) {
  let message = '';
  let contact = '';
  let phone = '';

  try {
    let body = {};
    try {
      if (e.postData && e.postData.contents) {
        body = JSON.parse(e.postData.contents);
      }
    } catch (jsonErr) {}

    // EXTRACTOR
    if (body.query) {
       if (typeof body.query === 'object') {
          message = body.query.message || '';
          contact = body.query.sender || '';
       } else {
          message = String(body.query);
          contact = body.sender || '';
       }
    } else if (body.message) {
       message = (typeof body.message === 'object') ? (body.message.message || JSON.stringify(body.message)) : body.message;
       contact = body.contact || body.sender || '';
    } else if (e.parameter && (e.parameter.query || e.parameter.message)) {
       message = e.parameter.query || e.parameter.message;
       contact = e.parameter.sender || e.parameter.contact || '';
    }

    message = String(message || '').trim();
    phone = extractPhone(contact);

    // GESTIÓN DE ESTADO (MEMORIA A CORTO PLAZO)
    const scriptCache = CacheService.getScriptCache();
    const currentState = scriptCache.get("state_" + phone);

    // ROUTER MAESTRO (V9 - CON ESTADO)
    let replyText = routeMasterMessage(message, phone, currentState, scriptCache);
    if (!replyText) return ContentService.createTextOutput("");

    return ContentService.createTextOutput(JSON.stringify({ 
      "replies": [
        { "message": replyText }
      ] 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      "replies": [
        { "message": 'Error técnico en Bot Maestro V9.' }
      ]
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Bot Maestro V9 Activo (State Machine + Optimization).');
}

// --- ROUTER MAESTRO (ESTADO + INTENCIÓN) ---

function routeMasterMessage(message, phone, currentState, scriptCache) {
  const msg = message.toLowerCase().trim();

  // 0. REVISAR ESTADO ACTIVO (MÁXIMA PRIORIDAD)
  if (currentState === "ESPERANDO_DATOS_REGISTRO") {
    if (containsAny(msg, ['cancelar', 'salir', 'menu', 'inicio', 'hola'])) {
      scriptCache.remove("state_" + phone);
      return flowSaludo();
    }
    
    // Guardamos temporalmente el mensaje y cambiamos estado a CONFIRMACIÓN
    scriptCache.put("state_" + phone, "ESPERANDO_CONFIRMACION", CONFIG.CACHE_TIME_STATE);
    scriptCache.put("temp_data_" + phone, message, CONFIG.CACHE_TIME_STATE);
    
    let parts = message.split(/,| y /i);
    let nombre = parts[0].trim();
    let pais = (parts.length > 1) ? parts[1].trim() : "No especificado";

    return [
      `⏳ *Verifica tus datos:*`,
      `👤 Nombre: *${nombre}*`,
      `🌎 País: *${pais}*`,
      ``,
      `✅ Escribe *CONFIRMAR* para guardar y continuar.`,
      `✏️ Escribe *CORREGIR* para ingresarlos de nuevo.`
    ].join('\n');
  }

  if (currentState === "ESPERANDO_CONFIRMACION") {
    let tempData = scriptCache.get("temp_data_" + phone) || message; // Fallback
    
    if (containsAny(msg, ['corre', 'editar', 'cambiar', 'no', 'cancel', 'mal'])) {
      scriptCache.put("state_" + phone, "ESPERANDO_DATOS_REGISTRO", CONFIG.CACHE_TIME_STATE);
      return "✏️ De acuerdo, escríbeme de nuevo tu *Nombre Completo* y tu *País* (Ejemplo: Carlos, México).";
    }
    
    if (containsAny(msg, ['confirma', 'si', 'sí', 'correcto', 'esta bien', 'está bien', 'ok', 'vale', 'listo', 'dale', '1'])) {
      scriptCache.remove("state_" + phone);
      scriptCache.remove("temp_data_" + phone);
      return flowRegistroConfirmacion(tempData, phone);
    }
    
    // Fallback si no dice confirmar ni corregir
    return "⚠️ Por favor responde *CONFIRMAR* si los datos están bien, o *CORREGIR* si te equivocaste.";
  }

  // 1. CORTAFUEGOS #1: CIERRE DE VENTA
  if (containsAny(msg, ['ya pague', 'ya pagué', 'listo el pago', 'pago realizado', 'transferencia', 'foto', 'comprobante', 'adjunto', 'capture', 'screen'])) {
    return flowPagoRecibido();
  }

  // 2. CORTAFUEGOS #2: COMANDOS FIJOS
  if (msg === '1' || containsAny(msg, ['inscrib', 'quiero inscribirme', 'registrar', 'como me inscribo', 'que necesito', 'entrar al curso'])) {
    return flowInscripcion(phone, scriptCache); // Activa el Estado
  }
  if (msg === '2' || containsAny(msg, ['info', 'programa', 'qué incluye', 'que incluye', 'detalles'])) {
    return flowInfo();
  }
  if (msg === '3') { 
    return flowPrecio(phone);
  }
  if (msg === '4' || containsAny(msg, ['asesor', 'humano', 'persona', 'hablar con'])) {
    return flowAsesor();
  }

  // 3. CORTAFUEGOS #3: PALABRAS CLAVE DE VENTA (Red de Seguridad)
  if (containsAny(msg, ['precio', 'costo', 'cuánto', 'cuanto', 'pagar', 'pago', 'valor', 'cuesta'])) {
    return flowPrecio(phone);
  }

  // ELIMINADA LA SECCIÓN DE SALUDOS REDUNDANTES (Líneas 119-122 del código anterior)
  // AutoResponder ya ataja los saludos simples, si llegan aquí pueden ser frases
  // compuestas ("Hola, ¿el piano es negro?") y la IA debe manejarlas.

  // 4. INTELIGENCIA ARTIFICIAL (Fallback)
  return callGroqAI(message);
}

// --- INTELIGENCIA ARTIFICIAL (OPTIMIZADA) ---

function callGroqAI(userMessage) {
  // CACHÉ DE RESPUESTAS (Ahorra Dinero y Tiempo)
  // CAMBIADO A V4 PARA INVALIDAR CUALQUIER CACHÉ ANTERIOR (ALUCINACIONES VIEJAS)
  const cacheKey = "groq_v4_" + Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, userMessage.toLowerCase().trim()));
  const cache = CacheService.getScriptCache();
  const cachedResponse = cache.get(cacheKey);

  if (cachedResponse) return cachedResponse;

  // Validación eliminada porque ya pusiste la llave real

  const url = "https://api.groq.com/openai/v1/chat/completions";
  
  // PROMPT BLINDADO ANTI-ALUCINACIONES (V5 - MAESTRO)
  const systemPrompt = `
<rol>
Eres el Asistente de Admisiones y Ventas oficial de "The Hollow Academy", academia élite de piano online.
Tu objetivo ÚNICO es resolver dudas rápidas, derribar objeciones y presionar a la venta.
NO eres una IA conversacional genérica. NUNCA admitas que eres un bot o Inteligencia Artificial de Groq/OpenAI. Hablas de "USTED" con respeto y autoridad.
</rol>

<informacion_oficial>
- Academia: The Hollow Academy.
- Formato: 100% Online vía Google Meet (no hay que instalar software raro).
- Fecha de inicio de clases: ¡ESTE 16 DE MARZO! 
- Edades: 14 años en adelante (excluyente).
- Requisito: Piano acústico o teclado de 5 octavas mínimo en casa.
- Precios (CERO REBAJAS): 
   * Colombia: $290.000 COP/mes o plan Trimestral $790.000 COP.
   * Resto del mundo: $80 USD/mes o plan Trimestral $220 USD.
- Profesores Elite: Hollow Pianist, Felipe Fernández, Ángel Nicolás.
- Qué incluye el mes: 4 clases de Piano 1 a 1 (Horario a convenir), 4 clases Grupales de Teoría (Horario fijo mar-jue-vie-sab), 1 asesoría técnica extra y Material.
- Garantía: Cero devoluciones o reembolsos bajo ninguna circunstancia. Si falta, pierde la clase salvo que avise 2 horas antes.
</informacion_oficial>

<reglas_inquebrantables>
1. BREVEDAD EXTREMA: WhatsApp es rápido. Tus respuestas NUNCA deben superar los 3 renglones físicos. (Máximo 40 palabras).
2. NO LISTAS: Jamás respondas con puntos (bullets) largos. Condensa la info.
3. CERO ALUCINACIÓN: Si preguntan por clases presenciales, guitarra, o cantar, responde: "Solo enseñamos Piano de alta élite online."
4. CALL TO ACTION SIEMPRE: Absolutamente TODOS tus mensajes DEBEN terminar con una instrucción clara hacia las opciones numéricas maestras.
</reglas_inquebrantables>

<manejo_objeciones>
- "Muy caro": "Nuestra formación es élite con profesores especialistas. El nivel de resultados justifica la inversión."
- "No tengo tiempo" / "Estoy midiendo mis tiempos": "¡El tiempo no se recupera, futuro pianista! ⏳ Y apremia: iniciamos OFICIALMENTE este 16 de marzo. Mientras mides tus tiempos, otros ya aseguran su silla en la élite. ¿Te guardo el cupo o dejamos pasar el tren? Escribe 1."
- "Nunca he tocado": "El programa arranca desde cero. Adaptamos la pedagogía a su nivel inicial."
- "Tengo artritis / Otra discapacidad": (NUNCA DIAGNOSTIQUES). "Ese es un caso especial y admirable. Por favor, escriba 4 para que nuestro director atienda su caso."
</manejo_objeciones>

<ejemplos_respuesta>
Usuario: "hola, a qué edad reciben niños?"
Tú: "Recibimos estudiantes a partir de los 14 años en adelante. ¿El estudiante cumple con la edad requerida? Escriba 1 para iniciar inscripción o 4 para hablar con un humano."

Usuario: "si no me gusta me devuelven la plata?"
Tú: "Al mantener estándares de educación superior y cupos muy limitados, no realizamos reembolsos bajo ninguna circunstancia. Escriba 2 para ver qué incluye el programa."

Usuario: "es que quiero aprender a cantar"
Tú: "En The Hollow Academy somos puristas; nos enfocamos exclusiva y magistralmente en el Piano. Escriba 4 si desea que un humano le aclare detalles."
</ejemplos_respuesta>
`;

  const payload = {
    model: CONFIG.GROQ_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    temperature: 0.2,
    max_tokens: 400
  };
  
  const options = {
    method: "post",
    headers: {
      "Authorization": "Bearer " + CONFIG.GROQ_API_KEY,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    
    if (code === 200) {
      const json = JSON.parse(response.getContentText());
      if (json.choices && json.choices.length > 0) {
        let aiReply = json.choices[0].message.content;
        try { cache.put(cacheKey, aiReply, CONFIG.CACHE_TIME_AI); } catch(e) {}
        return aiReply;
      }
    }
    
    // Si la API no falló con excepción pero dio código no-200, mostrar error de IA real
    const errorBody = response.getContentText();
    return `*[Error de IA]* La API de Groq respondió con código ${code}: ${errorBody.substring(0, 50)}... Responde "4" para hablar con nuestro equipo.`;
    
  } catch (e) {
    // AHORA MOSTRAMOS EL ERROR EXPLÍCITO DE CONEXIÓN, NO EL SALUDO.
    return `*[Error de IA]* Hubo un fallo de conexión temporal con nuestro cerebro artificial (${e.message.substring(0, 50)}). Por favor intenta de nuevo en unos minutos o responde "4" para hablar con el equipo humano.`;
  }
}

// --- FLUJOS FIJOS ---

function flowPagoRecibido() {
  return [
    '👏 *¡Excelente! Hemos recibido tu confirmación.*',
    '',
    '📸 Nuestro equipo validará el comprobante manualmente.',
    '🕒 Te daremos confirmación y acceso lo más pronto posible.',
    '',
    '🎹 *¡Bienvenido/a a la familia The Hollow Academy!*'
  ].join('\n');
}

function flowSaludo() {
  return [
    '🎹 *Hola, bienvenido/a a The Hollow Academy.*',
    '',
    'Soy tu asistente virtual. Elige una opción:',
    '',
    '1️⃣ Inscribirme al programa',
    '2️⃣ Información del programa',
    '3️⃣ Precios y formas de pago',
    '4️⃣ Hablar con un asesor',
    '',
    '👇 Responde con el *número* de tu opción.'
  ].join('\n');
}

function flowInfo() {
  return [
    '🎓 *Programa The Hollow Pianist*',
    'Aprende piano desde casa en Google Meet.',
    '',
    '*¿Qué incluye el mes?*',
    '🎹 4 clases de piano (Personalizadas 1 a 1, horaro flexible)',
    '🎼 4 clases de teoría musical (Grupales, horarios fijos)',
    '👨🏫 1 asesoría personalizada (Resolución de dudas)',
    '📚 Material de estudio continuo',
    '',
    '✅ Para mayores de 14 años. Requiere tener teclado en casa.',
    '', 
    '👇 *¿Se anima a iniciar? Escriba "1" para inscribirse.*'
  ].join('\n');
}

function flowPrecio(phone) {
  // SE REFUERZA LA REGLA ABSOLUTA DE PRECIOS POR PREFIJO +57
  let esCol = isColombiaByPhone(phone);
  let texto = ['💰 *Precios y Planes Oficiales*', ''];

  if (esCol) {
    texto.push('🇨🇴 *Mensualidad Colombia:* $290.000 COP/mes');
    texto.push('🇨🇴 *Plan Trimestral:* $790.000 COP (Ahorras $80.000)');
    texto.push('');
    texto.push('👇 *Medio de pago (Directo a la Academia):*');
    texto.push(CONFIG.PAYMENT_COLOMBIA); 
    texto.push('');
    texto.push('📝 *¿Listo para empezar su proceso?*');
    texto.push('Escriba *1* o diga *"Quiero inscribirme"* para tomar sus datos.');
  } else {
    texto.push('🌎 *Mensualidad Internacional:* $80 USD/mes');
    texto.push('🌎 *Plan Trimestral:* $220 USD (Ahorras $20 USD)');
    texto.push('');
    texto.push('👇 *Medio de pago (Directo a la Academia):*');
    texto.push(CONFIG.PAYMENT_INTERNACIONAL); 
    texto.push('');
    texto.push('📝 *¿Listo para empezar su proceso?*');
    texto.push('Escriba *1* o diga *"Quiero inscribirme"* para tomar sus datos.');
  }
  return texto.join('\n');
}

// INICIA EL ESTADO DE REGISTRO
function flowInscripcion(phone, scriptCache) { 
  // ACTIVAMOS MODO REGISTRO POR 10 MINUTOS
  scriptCache.put("state_" + phone, "ESPERANDO_DATOS_REGISTRO", CONFIG.CACHE_TIME_STATE);

  return [
    '📝 *¡Excelente decisión!*',
    '',
    'Para completar su registro, necesito que me envíe su *Nombre Completo* y su *País*.',
    '',
    '👇 *Por favor, escríbalo ahora mismo:*',
    '(Ejemplo: Juan Pérez, Colombia)'
  ].join('\n'); 
}

// CONFIRMA EL REGISTRO (Ya no valida formato estricto, confiamos en el Estado)
function flowRegistroConfirmacion(message, phone) {
  // Intentamos separar nombre y país, pero si no hay coma, guardamos todo el mensaje
  let parts = message.split(/,| y /i); 
  let nombre = parts[0].trim();
  let pais = (parts.length > 1) ? parts[1].trim() : "No especificado";
  
  // REGISTRAMOS EN SHEETS (Solo conversiones reales)
  registerStudent(phone, nombre, pais);

  // AQUÍ ELIMINAMOS isColombia(pais) PORQUE LA REGLA AHORA ES ESTRICTA
  // "Si el número de WhatsApp tiene el prefijo +57... Si NO tiene +57 es Internacional"
  let esCol = isColombiaByPhone(phone); 
  
  let respuesta = [
    `🎉 ¡Gracias *${nombre}*! Datos recibidos exitosamente.`,
    '',
    'Para finalizar y asegurar su cupo, realice el pago correspondiente a la academia (No transferir a terceros):'
  ];
  
  if (esCol) {
    respuesta.push('');
    respuesta.push('🇨🇴 *Colombia: $290.000 COP*');
    respuesta.push(CONFIG.PAYMENT_COLOMBIA);
    respuesta.push('');
    respuesta.push('📸 *Envía FOTO del comprobante aquí mismo para confirmar tu cupo.*');
  } else {
    respuesta.push('');
    respuesta.push('🌎 *Internacional: $80 USD*');
    respuesta.push(CONFIG.PAYMENT_INTERNACIONAL);
    respuesta.push('');
    respuesta.push('📸 *Envía FOTO del comprobante aquí mismo para confirmar tu cupo.*');
  }
  return respuesta.join('\n');
}

function flowAsesor() { return '👨💻 Un asesor humano te contactará pronto para ayudarte.'; }


// --- HELPERS ---

function extractPhone(contactString) {
  if (!contactString) return '';
  let clean = contactString.replace(/[^0-9+]/g, '');
  if (clean.startsWith('+')) { return "'" + clean; }
  // Si viene sin +, y parece celular colombia (3xx), asumimos +57? Mejor no asumir mucho, solo limpiar.
  return clean;
}

function containsAny(str, substrings) { return substrings.some(s => str.includes(s)); }

function isColombia(paisStr) {
  if (!paisStr) return false;
  let p = paisStr.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const keywords = ['colombia', 'colombiano', 'bogota', 'medellin', 'cali', 'barranquilla']; // Lista corta eficiente
  return keywords.some(k => p.includes(k));
}

function isColombiaByPhone(phoneStr) {
  if (!phoneStr) return false;
  let clean = phoneStr.replace("'", "");
  return clean.includes('+57') || clean.startsWith('57');
}

// --- SHEETS (Solo Conversiones) ---

function getCRMSheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
      sheet.appendRow(['Fecha', 'Teléfono', 'Nombre', 'País', 'Estado']);
    }
    return sheet;
  } catch (e) { return null; }
}

function registerStudent(phone, nombre, pais) { 
  try { 
    var s = getCRMSheet(); 
    if(s) { 
      // Fecha Hora Colombia (GMT-5)
      var fecha = Utilities.formatDate(new Date(), "GMT-5", "dd/MM/yyyy HH:mm:ss");
      s.appendRow([fecha, phone, nombre, pais, 'REGISTRO_INICIADO']); 
    }
  } catch(e){} 
}
