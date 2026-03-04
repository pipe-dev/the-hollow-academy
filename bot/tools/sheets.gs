/**
 * sheets.gs — Operaciones CRM en Google Sheets
 * 
 * Maneja lectura/escritura de datos de estudiantes.
 * Sheet: "CRM" con columnas: Fecha | Teléfono | Nombre | País | Estado | Notas
 */

const SHEET_NAME = 'CRM';

/**
 * Obtiene o crea la hoja CRM con headers
 */
function getCRMSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Fecha', 'Teléfono', 'Nombre', 'País', 'Estado', 'Notas']);
    sheet.getRange('A1:F1').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

/**
 * Busca un contacto por teléfono.
 * Retorna { row: número_de_fila, data: {fecha, telefono, nombre, pais, estado, notas} } o null
 */
function findContact(phone) {
  const sheet = getCRMSheet();
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === phone) {
      return {
        row: i + 1,
        data: {
          fecha: data[i][0],
          telefono: data[i][1],
          nombre: data[i][2],
          pais: data[i][3],
          estado: data[i][4],
          notas: data[i][5]
        }
      };
    }
  }
  
  return null;
}

/**
 * Registra un nuevo contacto como INTERESADO (si no existe)
 */
function registerInterested(phone) {
  const existing = findContact(phone);
  if (existing) return existing;
  
  const sheet = getCRMSheet();
  const fecha = Utilities.formatDate(new Date(), 'America/Bogota', 'yyyy-MM-dd HH:mm');
  
  sheet.appendRow([fecha, phone, '', '', 'INTERESADO', '']);
  
  return findContact(phone);
}

/**
 * Registra inscripción: actualiza nombre, país y estado a REGISTRADO
 */
function registerStudent(phone, nombre, pais) {
  let contact = findContact(phone);
  const sheet = getCRMSheet();
  
  if (!contact) {
    const fecha = Utilities.formatDate(new Date(), 'America/Bogota', 'yyyy-MM-dd HH:mm');
    sheet.appendRow([fecha, phone, nombre, pais, 'REGISTRADO', '']);
  } else {
    const row = contact.row;
    sheet.getRange(row, 3).setValue(nombre);
    sheet.getRange(row, 4).setValue(pais);
    sheet.getRange(row, 5).setValue('REGISTRADO');
  }
  
  return findContact(phone);
}

/**
 * Actualiza el estado de un contacto
 */
function updateStatus(phone, newStatus) {
  const contact = findContact(phone);
  if (!contact) return null;
  
  const sheet = getCRMSheet();
  sheet.getRange(contact.row, 5).setValue(newStatus);
  
  return findContact(phone);
}

/**
 * Agrega una nota a un contacto
 */
function addNote(phone, note) {
  const contact = findContact(phone);
  if (!contact) return null;
  
  const sheet = getCRMSheet();
  const existing = contact.data.notas || '';
  const updated = existing ? existing + ' | ' + note : note;
  sheet.getRange(contact.row, 6).setValue(updated);
  
  return findContact(phone);
}
