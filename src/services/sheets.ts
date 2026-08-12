import { google, sheets_v4 } from 'googleapis';
import * as path from 'path';

// 1. Estrutura adaptada a tus columnas: Dia/Fecha (A), Hora (B), Nombre y apellido (C), Cant. Personas (D), Teléfono (E)
export interface DatosReserva {
    diaFecha: string;
    hora: string;
    nombreApellido: string;
    cantPersonas: string | number;
    telefono: string;
}

const SPREADSHEET_ID = '1_H58PaNvhyeSSfvUs3lEs4VTwipSBcnMD7Tbb7RfH0k';

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), 'src/services/google-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets: sheets_v4.Sheets = google.sheets({ version: 'v4', auth });

/**
 * Inserta la reserva respetando el orden A:E de tu planilla
 */
export async function agregarReserva(datos: DatosReserva): Promise<void> {
    const { diaFecha, hora, nombreApellido, cantPersonas, telefono } = datos;

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Reservas!A:E', // Cubre desde la columna A (Dia/Fecha) hasta la E (Teléfono)
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[
                diaFecha, 
                hora, 
                nombreApellido, 
                cantPersonas.toString(), 
                telefono
            ]],
        },
    });
}