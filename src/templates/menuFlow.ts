import { addKeyword, EVENTS } from "@builderbot/bot";

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
                                title: "Audio",
                                description: "Quieo escuchar un audio"
                            },
                            {
                                id: "NS2706972",
                                title: "Imagen",
                                description: "Quieo recibir una imagen"
                            },
                            {
                                id: "NS2706973",
                                title: "PDF",
                                description: "Quieo recibir un PDF"
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