import { createFlow } from "@builderbot/bot";
import { mainFlow } from "./mainFlow";
import { menuFlow } from "./menuFlow";
import { imageFlow } from "./imageFlow";
import { sendCard } from "./list_templates/sendCard";
import { sendInfo } from "./list_templates/sendInfo";
import { reserve } from "./list_templates/reserve";
import { delivery } from "./list_templates/delivery";

export default createFlow ([
    mainFlow,
    menuFlow,
    imageFlow,
    sendCard,
    sendInfo,
    reserve,
    delivery,
]);