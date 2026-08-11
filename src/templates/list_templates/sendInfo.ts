import { addKeyword } from "@builderbot/bot";
import { join } from "path";

const sendInfo = addKeyword("NS2706974").addAnswer(
    "Horarios del local",
    {
        media: join(process.cwd(), "assets", "horarios.jpg")
    }
);

export { sendInfo };