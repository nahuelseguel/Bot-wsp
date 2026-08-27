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

export interface Producto {
    id: string;
    nombre: string;
    precio: string;
    descripcion: string;
    categoria: string;
}

export interface DatosDelivery {
    nombreApellido: string;
    direccion: string;
    detallePedido: string;
    medioPago: string;
    telefono: string;
}

export async function leerProductos(): Promise<Producto[]> {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Productos!A:E',
        });

        const rows = res.data.values;
        if (!rows || rows.length === 0) return [];

        const hasHeader = rows[0][0] === 'ID' || rows[0][0] === 'id';
        const dataRows = hasHeader ? rows.slice(1) : rows;

        return dataRows.map((row) => ({
            id: row[0] || '',
            nombre: row[1] || '',
            precio: row[2] || '',
            descripcion: row[3] || '',
            categoria: row[4] || '',
        }));
    } catch (error) {
        console.error('Error al leer productos de Sheets:', error);
        return [];
    }
}

export async function agregarDelivery(datos: DatosDelivery): Promise<void> {
    const { nombreApellido, direccion, detallePedido, medioPago, telefono } = datos;

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Deliveries!A:E',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[nombreApellido, direccion, detallePedido, medioPago, telefono]],
            },
        });
    } catch (error) {
        console.error('Error al guardar delivery en Sheets:', error);
        throw new Error('No se pudo guardar el delivery');
    }
}