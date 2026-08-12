import { addKeyword } from "@builderbot/bot";
import { agregarReserva, DatosReserva } from "~/services/sheets";

export const reserve = addKeyword<any, any>(["NS2706973"]).addAnswer(
        '🗓️ ¡Excelente! Vamos a registrar tu reserva.\n¿Para qué fecha querés reservar? (Formato: DD/MM, ej: 15/10)',
        { capture: true },
        async (ctx, ctxFn) => {
            const fecha = ctx.body.trim();
            const regexFecha = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])$/;
            
            if (!regexFecha.test(fecha)) {
                return ctxFn.fallBack('❌ La fecha ingresada no es válida. Por favor usá el formato DD/MM (Ej: 15/10).');
            }

            await ctxFn.state.update({ diaFecha: fecha });
        }
    )
    .addAnswer(
        '⏰ ¿En qué horario? (Formato 24hs: HH:MM, ej: 21:30)',
        { capture: true },
        async (ctx, ctxFn) => {
            const hora = ctx.body.trim();
            const regexHora = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

            if (!regexHora.test(hora)) {
                return ctxFn.fallBack('❌ El horario ingresado no es válido. Por favor usá el formato HH:MM (Ej: 21:30).');
            }

            await ctxFn.state.update({ hora: hora });
        }
    )
    .addAnswer(
        '👤 ¿A nombre de quién estará la mesa?',
        { capture: true },
        async (ctx, ctxFn) => {
            const nombre = ctx.body.trim();
            const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,50}$/;

            if (!regexNombre.test(nombre)) {
                return ctxFn.fallBack('❌ Por favor ingresá un nombre y apellido válido (solo letras, mínimo 3 caracteres).');
            }

            await ctxFn.state.update({ nombreApellido: nombre });
        }
    )
    .addAnswer(
        '👥 ¿Para cuántas personas es la reserva? (Entre 1 y 20)',
        { capture: true },
        async (ctx, ctxFn) => {
            const entrada = ctx.body.trim();
            const cantPersonas = parseInt(entrada, 10);

            if (isNaN(cantPersonas) || !/^\d+$/.test(entrada) || cantPersonas < 1 || cantPersonas > 20) {
                return ctxFn.fallBack('❌ Cantidad no válida. Por favor ingresá un número entre 1 y 20.');
            }

            await ctxFn.state.update({ cantPersonas: cantPersonas });

            // Recuperamos los datos acumulados para mostrar el resumen
            const diaFecha = ctxFn.state.get<string>('diaFecha');
            const hora = ctxFn.state.get<string>('hora');
            const nombreApellido = ctxFn.state.get<string>('nombreApellido');

            // Enviamos el resumen y pedimos la confirmación
            await ctxFn.flowDynamic(
                `📋 *Resumen de tu reserva:*\n\n` +
                `📌 *Fecha:* ${diaFecha}\n` +
                `⏰ *Hora:* ${hora} hs\n` +
                `👤 *Nombre:* ${nombreApellido}\n` +
                `👥 *Personas:* ${cantPersonas}\n\n` +
                `¿Los datos son correctos?\n` +
                `1️⃣ *Sí, confirmar reserva*\n` +
                `2️⃣ *No, cancelar*`
            );
        }
    )
    .addAnswer(
        'Por favor elegí una opción (1 o 2):',
        { capture: true },
        async (ctx, ctxFn) => {
            const opcion = ctx.body.trim();

            if (opcion === '1') {
                const nuevaReserva: DatosReserva = {
                    diaFecha: ctxFn.state.get<string>('diaFecha'),
                    hora: ctxFn.state.get<string>('hora'),
                    nombreApellido: ctxFn.state.get<string>('nombreApellido'),
                    cantPersonas: ctxFn.state.get<number>('cantPersonas'),
                    telefono: ctx.from
                };

                try {
                    // Guardamos en Google Sheets únicamente si confirmó
                    await agregarReserva(nuevaReserva);

                    await ctxFn.flowDynamic('✅ *¡Tu reserva ha sido registrada y guardada con éxito!* Te esperamos.');
                } catch (error) {
                    console.error('Error al guardar la reserva en Sheets:', error);
                    await ctxFn.flowDynamic('❌ Ocurrió un error técnico al guardar tu reserva. Por favor intenta más tarde.');
                }
            } else if (opcion === '2') {
                await ctxFn.flowDynamic('❌ La reserva fue cancelada. Podés iniciar nuevamente cuando desees.');
            } else {
                return ctxFn.fallBack('❌ Opción no válida. Por favor respondé con *1* para Confirmar o *2* para Cancelar.');
            }
        }
    );