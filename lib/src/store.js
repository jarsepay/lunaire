import { makeInMemoryStore } from 'baileys-pro'
import pino from 'pino'

const store = makeInMemoryStore({ logger: pino().child({ level: 'fatal', stream: 'store' }) })

export default store