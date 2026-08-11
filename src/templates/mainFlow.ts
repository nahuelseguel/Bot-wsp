import { addKeyword, EVENTS } from "@builderbot/bot";
import { menuFlow } from "./menuFlow";

const mainFlow = addKeyword ([
    EVENTS.WELCOME,
    EVENTS.VOICE_NOTE,
    EVENTS.DOCUMENT,
]) .addAction(async (ctx, ctxFn) => {
    if(ctx.body.includes("_event_")) {
        return ctxFn.endFlow (
            "Todavia no puedo procesar docmentos, multimedia o notas de voz"
        );
    }

    await ctxFn.flowDynamic(
        "Bienvenido al Cha-tbot el horario de atencion es: Martes a Domingo: 11hs a 23hs"
    );
    return ctxFn.gotoFlow(menuFlow);
});

export { mainFlow };