import pkg from 'baileys-pro'
const { 
    makeWASocket, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    DisconnectReason,
    Browsers,
} = pkg
import { Boom } from '@hapi/boom'
import pino from 'pino'
import readline from 'readline'
import { colors } from './src/function.js'
import { groupParticipantsUpdate } from './event/group.js'
import { decodeJid } from './src/func.js'
import store from './src/store.js'
import { EmojiSw } from '../setting.js'
import serialize from './serialize.js'
import handler from '../handler.js'
import db from './database.js'

const processedMessages = new Set()
const usePairingCode = !process.argv.includes('--use-pairing-code')
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

async function connectSock() {
    const { state, saveCreds } = await useMultiFileAuthState('session', pino({ level: 'fatal' }))
    const { version, isLatest } = await fetchLatestBaileysVersion()
    console.log(colors(`Using WA v${version.join('.')}, isLatest: ${isLatest}`, 'cyan'))

    const conn = makeWASocket({
        version,
        printQRInTerminal: !usePairingCode,
        logger: pino({ level: 'fatal' }),
        browser: Browsers.ubuntu('Chrome'),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
        },
        generateHighQualityLinkPreview: true,
        defaultQueryTimeoutMs: 0,
        markOnlineOnConnect: true,
        getMessage: async (key) =>
            (await store.loadMessage(key.remoteJid, key.id) ||
                (await store.loadMessage(key.id)) || {}).message || undefined,
    })

    if (usePairingCode && !conn.authState.creds.registered) {
        setTimeout(async () => {
            rl.question(`${colors('\nMasukkan nomor telepon diawali dengan kode negara, contoh: 628xxxxxxxxx.', 'cyan')}\n${colors('Nomor', 'rainbow')}: `,
                async function (phoneNumber) {
                    console.log(`\n${colors('Mengirim kode pairing, harap bersabar dan tunggu sebentar...', 'green')}`)
                    await conn.waitForConnectionUpdate((update) => !!update.qr)
                    let code = await conn.requestPairingCode(phoneNumber.replace(/\D/g, ''))
                    console.log(`\n${colors('Kode Pairing', 'green')} : ${code.match(/.{1,4}/g)?.join('-')}\n`)
                    rl.close()
                }
            )
        }, 3000)
    }

    conn.ev.on('creds.update', await saveCreds)

    conn.ev.on('messages.upsert', async ({ messages }) => {
        let m = messages[messages.length - 1]
        if (!m.message) return

        try {
            if (processedMessages.has(m.key.id)) return
            processedMessages.add(m.key.id)
            
            const msg = serialize(m, conn)
            handler(msg, conn)

            if (
                m.key.remoteJid === 'status@broadcast' &&
                m.type !== 'protocolMessage' &&
                m.sender !== conn.user.jid
            ) {
                await conn.readMessages([m.key])
                const randomEmoji = EmojiSw[Math.floor(Math.random() * EmojiSw.length)]

                await conn.sendMessage(m.key.remoteJid, {
                    react: {
                        text: randomEmoji,
                        key: m.key
                    }
                })
            }

            setTimeout(() => processedMessages.delete(m.key.id), 420000)
        } catch (e) {
            console.error(e)
        }
    })

    store.bind(conn.ev)

    conn.ev.on('connection.update', async (update) => {
        const { lastDisconnect, connection } = update

        if (!usePairingCode && update.qr) {
            console.log('Scan QR, kedaluwarsa dalam 60 detik.')
        }

        if (connection === 'open') {
            console.log(colors(`Terhubung`, 'green'))
            conn.user.jid = decodeJid(conn.user.id)

            if (!db.settings.exist(conn.user.jid)) {
                await db.settings.add(conn.user.jid)
                await db.save()
            }
        }
       
        if (connection === 'close') {
            console.log(colors(`Disconnecting`, 'red'))
            const shouldReconnect =
                lastDisconnect.error instanceof Boom
                    ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                    : true

            if (shouldReconnect) {
                console.log(colors(`Disconnecting`, 'cyan'))
                connectSock()
            }
        }
    })

    conn.ev.on('group-participants.update', async (data) => {
        const lastMessage = Array.from(processedMessages).pop()
        const m = await store.loadMessage(data.groupId, lastMessage) || {}
        await groupParticipantsUpdate(data, conn, m.message)
    })

    return conn
}

export default connectSock