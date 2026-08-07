import { createFlow } from "@builderbot/bot";
import { mainFlow } from "./mainFlow";
import { menuFlow } from "./menuFlow";
import { imageFlow } from "./imageFlow";

export default createFlow ([
    mainFlow,
    menuFlow,
    imageFlow,
])