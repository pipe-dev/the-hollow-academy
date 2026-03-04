# SOP: Flujo de Conversación del Bot

## Objetivo
Procesar mensajes entrantes de WhatsApp y devolver la respuesta correcta según la intención del usuario.

## Entradas
- `message`: texto del mensaje del usuario
- `contact`: nombre + teléfono del contacto

## Lógica de Enrutamiento

```
MENSAJE RECIBIDO
    │
    ├── Es "1" o contiene "inscrib" → FLUJO_INSCRIPCIÓN
    ├── Es "2" o contiene "info" o "programa" → FLUJO_INFO
    ├── Es "3" o contiene "precio" o "costo" o "pago" → FLUJO_PRECIO
    ├── Es "4" o contiene "asesor" o "humano" → FLUJO_ASESOR
    ├── Coincide patrón "Nombre, País" → FLUJO_REGISTRO
    └── No coincide ninguno → Gemini AI responde (manejado por AutoResponder, no por este script)
```

## Flujos

### SALUDO (primera interacción o mensaje genérico con saludo)
Trigger: mensaje contiene "hola", "buenas", "buenos días", etc.

```
Hola, bienvenido/a a The Hollow Academy.

Soy el asistente virtual. ¿En qué te puedo ayudar?

1 - Inscribirme al programa
2 - Información del programa
3 - Precios y formas de pago
4 - Hablar con un asesor

Responde con el número de tu opción.
```

### FLUJO_INSCRIPCIÓN (opción 1)
Trigger: mensaje es "1" o contiene "inscrib"

```
Para registrarte necesito dos datos:

- Tu nombre completo
- Tu país

Escríbelos en un solo mensaje, ejemplo:
María García, Colombia
```

### FLUJO_REGISTRO (captura de datos)
Trigger: mensaje coincide con patrón "Texto, Texto" (nombre, país)

Acción:
1. Parsear nombre y país
2. Extraer teléfono del campo contact
3. Guardar en Google Sheets con estado REGISTRADO
4. Detectar si el país contiene "Colombia" o "colombia"

Si es Colombia:
```
Registro recibido.

Nombre: [nombre]
País: Colombia

Para completar tu inscripción, envía 290mil COP a:
Daviplata / Nequi / cualquier banco
Llave: 3184916177

También puedes transferir desde cualquier entidad bancaria sin costo.

Cuando hagas el pago, envía tu comprobante aquí
y un asesor confirmará tu inscripción en menos de 1 hora.
```

Si NO es Colombia:
```
Registro recibido.

Nombre: [nombre]
País: [país]

Para completar tu inscripción, realiza el pago de $80 USD:
PayPal: paypal.me/TheHollowAcademy/80

Cuando hagas el pago, envía tu comprobante aquí
y un asesor confirmará tu inscripción en menos de 1 hora.
```

### FLUJO_INFO (opción 2)
Trigger: mensaje es "2" o contiene "info", "programa", "qué incluye"

```
Programa The Hollow Pianist

Es un programa progresivo y personalizado de piano
y teoría musical, 100% online en vivo.

Qué incluye cada mes:
- 4 clases de piano (1 hora cada una)
- 4 clases de teoría musical (1 hora cada una)
- 1 asesoría personalizada adicional
- Total: 8 clases + 1 asesoría al mes

3 instructores con más de 10 años de experiencia.
No necesitas conocimientos previos.
El programa se adapta a tu nivel y ritmo.

¿Quieres inscribirte? Escribe 1
¿Más preguntas? Escribe 4 para hablar con un asesor.
```

### FLUJO_PRECIO (opción 3)
Trigger: mensaje es "3" o contiene "precio", "costo", "cuánto", "pago", "pagar"

Detectar si el teléfono empieza con +57 (Colombia):

Si es Colombia:
```
Inversión mensual

Precio regular: $150 USD
Precio promocional: $80 USD/mes (290mil COP)

Incluye las 8 clases + asesoría.

Forma de pago:
Daviplata / Nequi / cualquier banco
Llave: 3184916177

Puedes transferir desde cualquier entidad bancaria sin costo.

¿Listo/a para inscribirte? Escribe 1
```

Si NO es Colombia:
```
Inversión mensual

Precio regular: $150 USD
Precio promocional: $80 USD/mes

Incluye las 8 clases + asesoría.

Forma de pago:
PayPal: paypal.me/TheHollowAcademy/80

Para otros métodos de pago, escribe 4
y un asesor te ayudará.

¿Listo/a para inscribirte? Escribe 1
```

### FLUJO_ASESOR (opción 4)
Trigger: mensaje es "4" o contiene "asesor", "humano", "persona"

Detectar hora actual (Colombia, UTC-5):

Si entre 9:00 y 22:00:
```
Un asesor te responderá pronto.
Nuestro horario de atención es de 9am a 10pm
hora Colombia, todos los días.
```

Si fuera de horario:
```
En este momento estamos fuera de horario.
Un asesor te responderá mañana a partir de las 9am
hora Colombia.

Si necesitas info inmediata:
Escribe 2 para ver el programa
Escribe 3 para ver precios
```

## Casos extremos

- Si el mensaje es solo un número (1-4): manejar como opción de menú
- Si el mensaje tiene solo una palabra sin contexto: mostrar menú principal
- Si el usuario envía una imagen: Gemini AI lo maneja (AutoResponder)
- Si el usuario envía un audio: Gemini AI lo maneja (AutoResponder)
- Si el teléfono ya existe en el Sheet: actualizar estado, no duplicar fila
