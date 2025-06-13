import { timeZone } from '../../setting.js'
import { formatDateInTimeZone } from '../../lib/src/function.js'

const tags = {
    'admin': { name: 'Admin Menu' },
    'ai': { name: 'AI Menu' },
    'customization': { name: 'Customization Menu' },
    'download': { name: 'Downloaders Menu' },
    'main': { name: 'Utama Menu' },
    'owner': { name: 'Owner Menu' },
    'roleplay': { name: 'Roleplay Menu' },
    'searching': { name: 'Search Menu' },
    'tools': { name: 'Tools Menu' }
}

export const cmd = {
    name: ['help'],
    command: ['help'],
    category: ['main'],
    detail: {
        desc: 'Menampilkan daftar semua perintah yang tersedia.'
    },
    setting: {
        isRegister: true,
        isBanned: false,
        isJail: false,
        membershipStatus: true
    },
    async start({ m, prefix, plugins }) {
        const currentDate = new Date()
        const ucapans = ucapan()
        let teks = `\`${ucapans}\`\n`
            + `Saya adalah sebuah bot yang dapat mengirim pesan secara otomatis.\n\n`
            + `◦  *Waktu* · ${formatDateInTimeZone(currentDate, timeZone)}\n`
        
        let totalFitur = 0
        
        for (const tag in tags) {
            teks += `\n*${tags[tag].name.toUpperCase()}*\n`
            const filteredCommands = plugins.commands.filter(cmd => {
                return cmd[Object.keys(cmd)[0]].category.includes(tag)
            })
            
            let commandCounter = 1
            filteredCommands.forEach((cmd) => {
                const commandDetails = cmd[Object.keys(cmd)[0]]
                
                commandDetails.name.forEach((cmdName) => {
                    teks += `${commandCounter}. ${prefix + cmdName}${commandDetails.detail?.use ? ` < *${commandDetails.detail.use}* >` : ''}${commandDetails.setting?.isNsfw ? `  (*+18*)` : ''}\n`
                    commandCounter++
                    totalFitur++
                })
            })
        }

        teks += `\n◦  *Total Fitur* · ${totalFitur}\n\n`

        if (teks.trim() === '') {
            teks = 'Tidak ada perintah yang ditemukan untuk kategori ini.'
        }

        await m.reply(teks.trim())
    }
}

function ucapan() {
    const time = new Date()
    const greetings = {
        midnight: 'Selamat malam 🌌',
        morning: 'Selamat pagi 🌄',
        noon: 'Selamat siang 🌤',
        afternoon: 'Selamat sore 🌇',
        night: 'Selamat malam 🎑'
    }

    const hour = formatDateInTimeZone(time, timeZone).split(',')[1].split(':')[0]

    if (hour == 0) return greetings.midnight
    if (hour >= 6 && hour < 12) return greetings.morning
    if (hour == 12) return greetings.noon
    if (hour >= 13 && hour < 19) return greetings.afternoon
    return greetings.night
}