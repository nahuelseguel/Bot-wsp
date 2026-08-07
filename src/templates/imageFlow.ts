import { addKeyword, EVENTS} from "@builderbot/bot";

const imageFlow = addKeyword([
    EVENTS.MEDIA,
]) .addAction(async (ctx, ctxFn) => {
    await ctxFn.flowDynamic("Este es el flow media");
});

export { imageFlow };