import { addKeyword, EVENTS } from "@builderbot/bot";
//estructura ejemplo
// 📋 Ver Carta y Promos (Ver menú / filtrar por vegetarianos, TACC)

// 🛵 Hacer Pedido (Delivery o Retiro por local)

// 📅 Reservar Mesa

// 🎊 Eventos y Cumpleaños

// 📍 Ubicación, Horarios y Medios de Pago

// 👤 Hablar con la Sucursal
const menuFlow = addKeyword(EVENTS.ACTION).addAction(
    async (ctx, { provider }) => {
        const list = {
            header: {
                type: "text",
                text: "Menu de opciones",
            },
            body: {
                text: "Te voy a dar las opciones que tengo disponibles"
            },
            footer: {
                text: ""
            },
            action: {
                button: "Opciones",
                sections: [
                    {
                        title: "Acciones",
                        rows: [
                            {
                                id: "NS2706971",
                                title: "📋 Ver Carta",
                                description: "Quieo escuchar un audio"
                            },
                            {
                                id: "NS2706972",
                                title: "🛵 Hacer Pedido",
                                description: "Quieo hacer un pedido"
                            },
                            {
                                id: "NS2706973",
                                title: "📅 Reservar Mesa",
                                description: "Quieo reservar una mesa"
                            },
                            {
                                id: "NS2706974",
                                title: "📍 Ubicación y horarios",
                                description: "Quieo ver info del local"
                            },
                            {
                                id: "NS2706975",
                                title: "👤 Hablar con Sucursal",
                                description: "Quieo hablar con el personal"
                            },
                        ],
                    },
                ],
            },
        };
        await provider.sendList(`${ctx.from}@s.whatsapp.net`, list);
    }
);

export {menuFlow};