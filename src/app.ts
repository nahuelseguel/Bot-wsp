import 'dotenv/config'
import { join } from 'path'
import { createBot, createProvider, createFlow, addKeyword, utils } from '@builderbot/bot';
import { MemoryDB as Database } from '@builderbot/bot';
import { MetaProvider as Provider } from '@builderbot/provider-meta';
import templates from "./templates";

const PORT = process.env.PORT ?? 3008   

const main = async () => {
    const adapterProvider = createProvider(Provider, {
        jwtToken: process.env.jwtToken as string,
        numberId: process.env.numberId,
        verifyToken: process.env.verifyToken,
        version: 'v25.0'
    })
    const adapterDB = new Database()

    const { handleCtx, httpServer } = await createBot({
        flow: templates,
        provider: adapterProvider,
        database: adapterDB,
    })

    httpServer(+PORT)
}

process.on('unhandledRejection', (err) => {
    console.error(err)
})

main()