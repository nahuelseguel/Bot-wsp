import { addKeyword } from "@builderbot/bot";
import { join } from "path";

const sendCard = addKeyword("NS2706972").addAnswer(
    "Te adjunto la carta",
    {
        media: join(process.cwd(), "assets", "carta.png")
    }
);

export { sendCard };