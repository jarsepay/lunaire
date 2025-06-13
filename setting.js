/**
 * Asal jadi aja ini
 * thanksto
 * kaze
 * ominous
 * jarsepay
 * 
 * kalo ini mengganggu dihapus aja
 */

import path from 'path'
import { getCurrentTax } from './lib/databases/economy.js'

const timeZone = 'Asia/Jakarta'

const tempName = 'temp'
global.tempDir = path.resolve(new URL('.', import.meta.url).pathname, tempName)

const owner = [
    ['6282148864989', 'Ominoush']
]

const idGrupBot = '120363257984232598@g.us'

const pajak = getCurrentTax()

const defaultPrefix = ['.']

const EmojiSw = ["🖤", "🤎", "💜", "💙", "💚", "💛", "🧡", "❤️", "🤍"]

const forbiddenWords = [
    'hentai', 'telanjang', 'fuck', 'naked', 'bokep', 'porn', 'nudes', 'tobrut', 'tt', 'payudara',
    'penis', 'kontol', 'kntl', 'kntol', 'puki', 'titid', 'mmk', 'memek', 'pepek', 'ppk',
    'vagina'
]

export { timeZone, owner, idGrupBot, defaultPrefix, pajak, EmojiSw, forbiddenWords }