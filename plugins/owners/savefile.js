import fs from 'fs'
import util from 'util'

export const cmd = {
    name: ['savefile'],
    command: ['sf', 'savefile'],
    category: ['owner'],
    detail: {
        desc: 'Menyimpan teks dari pesan yang dibalas ke dalam file.'
    },
    setting: {
        isOwner: true
    },
    async start(context) {
        const { m, text } = context
        try {
            if (!text) {
                return m.reply(`Gunakan: \`${context.prefix}${context.command} <nama_file>\``)
            }
            if (!m.quoted || !m.quoted.message || !m.quoted.message.conversation) {
                return m.reply('Balas pesan yang ingin disimpan!')
            }

            let path = `${text}`
            fs.writeFileSync(path, m.quoted.message.conversation || '')
            m.reply(`Tersimpan di ${path}`)
        } catch (error) {
            m.reply(`Terjadi kesalahan: ${util.format(error)}`)
        }
    }
}