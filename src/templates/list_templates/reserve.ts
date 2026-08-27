import { addKeyword } from "@builderbot/bot";
import { agregarReserva, DatosReserva } from "~/services/sheets";

function normalizar(texto: string): string {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
}

const DIAS: Record<string, number> = {
    lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 0,
};

function buscarDia(texto: string): number | null {
    const t = normalizar(texto);

    // Match exacto
    for (const [nombre, num] of Object.entries(DIAS)) {
        if (t.includes(nombre)) return num;
    }

    // Match por prefijo (ej: "sab" → sabado, "jue" → jueves)
    for (const [nombre, num] of Object.entries(DIAS)) {
        if (t.length >= 3 && nombre.startsWith(t)) return num;
    }

    // Fuzzy: comparar caracter por caracter
    let mejorScore = 0;
    let mejorDia: number | null = null;
    for (const [nombre, num] of Object.entries(DIAS)) {
        let coincidencias = 0;
        for (const char of t) {
            if (nombre.includes(char)) coincidencias++;
        }
        const score = coincidencias / Math.max(t.length, nombre.length);
        if (score > mejorScore && score > 0.6) {
            mejorScore = score;
            mejorDia = num;
        }
    }
    return mejorDia;
}

function calcularProximoDia(diaSemana: number): Date {
    const hoy = new Date();
    const diaActual = hoy.getDay();
    let diasAdelante = diaSemana - diaActual;
    if (diasAdelante <= 0) diasAdelante += 7;
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + diasAdelante);
    return fecha;
}

function buscarHora(texto: string): string | null {
    const t = normalizar(texto);

    // Formato HH:MM
    const match24 = t.match(/(\d{1,2})\s*[:\.]\s*(\d{2})/);
    if (match24) {
        const h = parseInt(match24[1], 10);
        const m = parseInt(match24[2], 10);
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
    }

    // Formato HHhs o HH hs
    const matchHs = t.match(/(\d{1,2})\s*hs/);
    if (matchHs) {
        const h = parseInt(matchHs[1], 10);
        if (h >= 0 && h <= 23) return `${String(h).padStart(2, '0')}:00`;
    }

    // Formato "a las HH" o "las HH"
    const matchLas = t.match(/(?:a\s+)?las?\s+(\d{1,2})(?:\s*(?:de\s+la\s+)?(noche|tarde|amanecer|medio.?dia))?/);
    if (matchLas) {
        let h = parseInt(matchLas[1], 10);
        const periodo = matchLas[2];
        if (periodo === 'noche' || periodo === 'tarde') {
            if (h >= 1 && h <= 12) h += 12;
        }
        if (h >= 0 && h <= 23) return `${String(h).padStart(2, '0')}:00`;
    }

    // Formato HHpm
    const matchPm = t.match(/(\d{1,2})\s*(pm|p\.m)/);
    if (matchPm) {
        let h = parseInt(matchPm[1], 10);
        if (h >= 1 && h <= 12) h += 12;
        if (h >= 0 && h <= 23) return `${String(h).padStart(2, '0')}:00`;
    }

    const matchAm = t.match(/(\d{1,2})\s*(am|a\.m)/);
    if (matchAm) {
        const h = parseInt(matchAm[1], 10);
        if (h >= 0 && h <= 12) return `${String(h).padStart(2, '0')}:00`;
    }

    // Solo un número (1-23) como hora
    const matchNum = t.match(/^(\d{1,2})$/);
    if (matchNum) {
        const h = parseInt(matchNum[1], 10);
        if (h >= 10 && h <= 23) return `${String(h).padStart(2, '0')}:00`;
    }

    return null;
}

function parsearFechaHora(texto: string): { fecha: string; hora: string } | null {
    const t = normalizar(texto);

    // 1. Intentar DD/MM + hora
    const matchFecha = t.match(/(\d{1,2})\s*\/\s*(\d{1,2})/);
    if (matchFecha) {
        const dia = matchFecha[1].padStart(2, '0');
        const mes = matchFecha[2].padStart(2, '0');
        const resto = t.replace(matchFecha[0], '');
        const hora = buscarHora(resto);
        if (hora) return { fecha: `${dia}/${mes}`, hora };
    }

    // 2. Intentar "DD de MES" + hora
    const MESES: Record<string, string> = {
        enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
        julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
    };
    const matchMes = t.match(/(\d{1,2})\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/);
    if (matchMes) {
        const dia = matchMes[1].padStart(2, '0');
        const mes = MESES[matchMes[2]];
        const resto = t.replace(matchMes[0], '');
        const hora = buscarHora(resto);
        if (hora) return { fecha: `${dia}/${mes}`, hora };
    }

    // 3. Intentar día de la semana + hora
    const diaSemana = buscarDia(t);
    if (diaSemana !== null) {
        const hora = buscarHora(t);
        if (hora) {
            const fechaCalc = calcularProximoDia(diaSemana);
            const dia = String(fechaCalc.getDate()).padStart(2, '0');
            const mes = String(fechaCalc.getMonth() + 1).padStart(2, '0');
            return { fecha: `${dia}/${mes}`, hora };
        }
    }

    return null;
}

export const reserve = addKeyword<any, any>(["NS2706973"])
    .addAnswer(
        '🗓️ ¡Perfecto! Vamos a reservar.\n\n¿Para cuándo querés reservar?\nEjemplos:\n• *15/10 21:30*\n• *viernes 21hs*\n• *sabado a las 9 de la noche*',
        { capture: true },
        async (ctx, ctxFn) => {
            const texto = ctx.body.trim();
            const resultado = parsearFechaHora(texto);

            if (!resultado) {
                return ctxFn.fallBack(
                    '❌ No pude entender la fecha y hora.\n\n' +
                    'Probá con:\n• *15/10 21:30*\n• *viernes 21hs*\n• *sabado a las 9 de la noche*'
                );
            }

            await ctxFn.state.update({ diaFecha: resultado.fecha, hora: resultado.hora });
        }
    )
    .addAnswer(
        '👤 ¿A nombre de quién?',
        { capture: true },
        async (ctx, ctxFn) => {
            const nombre = ctx.body.trim();

            if (nombre.length < 3) {
                return ctxFn.fallBack('❌ Nombre muy corto. Escribí nombre y apellido.');
            }

            await ctxFn.state.update({ nombreApellido: nombre });
        }
    )
    .addAnswer(
        '👥 ¿Para cuántas personas? (Del 1 al 20)',
        { capture: true },
        async (ctx, ctxFn) => {
            const entrada = ctx.body.trim();
            const cantPersonas = parseInt(entrada, 10);

            if (isNaN(cantPersonas) || cantPersonas < 1 || cantPersonas > 20) {
                return ctxFn.fallBack('❌ Número no válido. Ingresá un número del 1 al 20.');
            }

            await ctxFn.state.update({ cantPersonas });

            const diaFecha = ctxFn.state.get<string>('diaFecha');
            const hora = ctxFn.state.get<string>('hora');
            const nombreApellido = ctxFn.state.get<string>('nombreApellido');

            await ctxFn.flowDynamic(
                `📋 *Resumen de tu reserva:*\n\n` +
                `📌 *Fecha:* ${diaFecha}\n` +
                `⏰ *Hora:* ${hora} hs\n` +
                `👤 *Nombre:* ${nombreApellido}\n` +
                `👥 *Personas:* ${cantPersonas}\n\n` +
                `¿Está todo bien? (sí/no)`
            );
        }
    )
    .addAnswer(
        '¿Confirmás la reserva?',
        { capture: true },
        async (ctx, ctxFn) => {
            const respuesta = ctx.body.trim().toLowerCase();
            const confirmaciones = ['si', 'sí', 'ok', 'dale', 'bien', 'confirmo'];
            const negaciones = ['no', 'cancelar', 'cancelo'];

            if (negaciones.some((n) => respuesta.includes(n))) {
                return ctxFn.endFlow('❌ Reserva cancelada. Podés iniciar una nueva cuando quieras.');
            }

            if (!confirmaciones.some((c) => respuesta.includes(c))) {
                return ctxFn.fallBack('❓ Respondé *sí* para confirmar o *no* para cancelar.');
            }

            const nuevaReserva: DatosReserva = {
                diaFecha: ctxFn.state.get<string>('diaFecha'),
                hora: ctxFn.state.get<string>('hora'),
                nombreApellido: ctxFn.state.get<string>('nombreApellido'),
                cantPersonas: ctxFn.state.get<number>('cantPersonas'),
                telefono: ctx.from,
            };

            try {
                await agregarReserva(nuevaReserva);
                await ctxFn.flowDynamic(
                    `✅ *¡Reserva registrada con éxito!*\n\n` +
                    `📌 *Fecha:* ${nuevaReserva.diaFecha}\n` +
                    `⏰ *Hora:* ${nuevaReserva.hora} hs\n` +
                    `👤 *Nombre:* ${nuevaReserva.nombreApellido}\n` +
                    `👥 *Personas:* ${nuevaReserva.cantPersonas}\n\n` +
                    'Te esperamos. 🍽️'
                );
            } catch (error) {
                console.error('Error al guardar la reserva:', error);
                await ctxFn.flowDynamic('❌ Ocurrió un error al guardar tu reserva. Intentá más tarde.');
            }
        }
    );
