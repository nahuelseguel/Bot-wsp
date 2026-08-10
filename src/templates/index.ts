import { createFlow } from "@builderbot/bot";
import { mainFlow } from "./mainFlow";
import { menuFlow } from "./menuFlow";
import { imageFlow } from "./imageFlow";
import { sendCard } from "./list_templates/sendCard";

export default createFlow ([
    mainFlow,
    menuFlow,
    imageFlow,
    sendCard,
])