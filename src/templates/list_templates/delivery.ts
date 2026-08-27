import { addKeyword } from '@builderbot/bot';
import { agregarDelivery, DatosDelivery, leerProductos, Producto } from '~/services/sheets';
import { join } from 'node:path';

function normalizar(texto: string): string {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
}

function buscarProducto(termino: string, productos: Producto[]): Producto | null {
    const t = normalizar(termino);
    if (t.length < 2) return null;

    let encontrado = productos.find((p) => normalizar(p.nombre).includes(t));
    if (encontrado) return encontrado;

    encontrado = productos.find((p) => t.includes(normalizar(p.nombre)));
    if (encontrado) return encontrado;

    const palabras = t.split(/\s+/).filter((w) => w.length > 2);
    encontrado = productos.find((p) => {
        const nombreNorm = normalizar(p.nombre);
        return palabras.some((palabra) => nombreNorm.includes(palabra));
    });
    if (encontrado) return encontrado;

    let mejorScore = 0;
    let mejorProducto: Producto | null = null;
    for (const p of productos) {
        const nombreNorm = normalizar(p.nombre);
        let coincidencias = 0;
        for (const char of t) {
            if (nombreNorm.includes(char)) coincidencias++;
        }
        const score = coincidencias / Math.max(t.length, nombreNorm.length);
        if (score > mejorScore && score > 0.5) {
            mejorScore = score;
            mejorProducto = p;
        }
    }
    return mejorProducto;
}

export const delivery = addKeyword<any, any>(['NS2706972'])
    .addAnswer('Te adjunto la carta', { media: join(process.cwd(), 'assets', 'carta.png') })
    .addAnswer(
        '📝 Escribí lo que querás pedir, separado por comas.\nEjemplo: *alitas, nachos, flan*',
        { capture: true },
        async (ctx, ctxFn) => {
            const productos = await leerProductos();
            if (productos.length === 0) {
                return ctxFn.endFlow('⚠️ No se pudo cargar la carta. Intentá más tarde.');
            }

            const texto = ctx.body.trim();
            const items = texto.split(',').map((item) => item.trim()).filter((item) => item.length > 0);

            if (items.length === 0) {
                return ctxFn.fallBack('❌ Escribí al menos un producto.');
            }

            const carrito: { nombre: string; precio: string }[] = [];
            const noEncontrados: string[] = [];
            let resumen = '🛒 *Tu pedido:*\n\n';

            for (const item of items) {
                const producto = buscarProducto(item, productos);
                if (producto) {
                    carrito.push({ nombre: producto.nombre, precio: producto.precio });
                    const precioStr = producto.precio.startsWith('$') ? producto.precio : `$${producto.precio}`;
                    resumen += `✅ *${producto.nombre}* — ${precioStr}\n`;
                } else {
                    noEncontrados.push(item);
                    resumen += `❌ *${item}* — no encontrado\n`;
                }
            }

            if (carrito.length === 0) {
                return ctxFn.fallBack(
                    '❌ No pude encontrar ningún producto.\nRevisá la carta e intentá de nuevo.'
                );
            }

            if (noEncontrados.length > 0) {
                resumen += `\n⚠️ No encontré: ${noEncontrados.join(', ')}\n`;
            }

            const total = carrito.reduce((sum, item) => sum + parseFloat(item.precio.replace(/\D/g, '')), 0);
            resumen += `\n💰 *Total estimado:* $${total}\n\n¿Está todo bien? (sí/no)`;

            await ctxFn.state.update({ carrito, pedidoTexto: carrito.map((c) => c.nombre).join(', ') });
            await ctxFn.flowDynamic(resumen);
        }
    )
    .addAnswer(
        '¿Confirmás el pedido?',
        { capture: true },
        async (ctx, ctxFn) => {
            const respuesta = ctx.body.trim().toLowerCase();
            const confirmaciones = ['si', 'sí', 'yes', 'ok', 'dale', 'bien', 'todo bien', 'confirmo'];
            const negaciones = ['no', 'nope', 'cancelar', 'cancelo'];

            if (negaciones.some((n) => respuesta.includes(n))) {
                return ctxFn.endFlow('❌ Pedido cancelado. Podés volver a escribir *pedir* cuando quieras.');
            }

            if (!confirmaciones.some((c) => respuesta.includes(c))) {
                return ctxFn.fallBack('❓ Respondé *sí* para confirmar o *no* para cancelar.');
            }
        }
    )
    .addAnswer(
        '📍 ¿Cuál es tu dirección de entrega?\n(Calle, número, barrio o referencia)',
        { capture: true },
        async (ctx, ctxFn) => {
            const direccion = ctx.body.trim();
            if (direccion.length < 5) {
                return ctxFn.fallBack('❌ La dirección es muy corta. Ingresá calle, número y barrio.');
            }
            await ctxFn.state.update({ direccion });
        }
    )
    .addAnswer(
        '💳 ¿Cómo querés pagar?\n1️⃣ Efectivo\n2️⃣ Transferencia\n3️⃣ Tarjeta',
        { capture: true },
        async (ctx, ctxFn) => {
            const opcion = ctx.body.trim();
            const opciones: Record<string, string> = {
                '1': 'Efectivo',
                '2': 'Transferencia',
                '3': 'Tarjeta',
                'efectivo': 'Efectivo',
                'transferencia': 'Transferencia',
                'tarjeta': 'Tarjeta',
            };

            const medioPago = opciones[opcion.toLowerCase()];
            if (!medioPago) {
                return ctxFn.fallBack('❌ Opción no válida. Respondé 1, 2 o 3.');
            }

            await ctxFn.state.update({ medioPago });

            const nombreApellido = ctx.name || 'Cliente WhatsApp';
            const direccion = ctxFn.state.get<string>('direccion');
            const pedidoTexto = ctxFn.state.get<string>('pedidoTexto');

            const nuevoDelivery: DatosDelivery = {
                nombreApellido,
                direccion,
                detallePedido: pedidoTexto,
                medioPago,
                telefono: ctx.from,
            };

            try {
                await agregarDelivery(nuevoDelivery);
                await ctxFn.flowDynamic(
                    `✅ *¡Tu pedido fue registrado con éxito!*\n\n` +
                    `👤 *Nombre:* ${nombreApellido}\n` +
                    `📍 *Dirección:* ${direccion}\n` +
                    `🛒 *Pedido:* ${pedidoTexto}\n` +
                    `💳 *Pago:* ${medioPago}\n\n` +
                    'Ya lo estamos preparando. 🍽️'
                );
            } catch (error) {
                console.error('Error guardando el delivery:', error);
                await ctxFn.flowDynamic('❌ Ocurrió un error al guardar tu pedido. Intentá más tarde.');
            }
        }
    );
