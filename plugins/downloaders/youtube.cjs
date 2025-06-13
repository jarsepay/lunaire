const savetube = require('../../lib/src/youtube.cjs')

exports.cmd = {
    name: ['yt', 'yta', 'ytv'],
    command: ['yt', 'yta', 'ytv'],
    category: ['download'],
    detail: {
        desc: 'Download media youtube.',
        use: 'yt/yta/ytv [link]'
    },
    async start({ m, prefix, command, conn, text }) {
        switch (command.toLowerCase()) {
            case 'yt': {
                const urlPattern = /https?:\/\/[^\s]+/
                const urlMatch = text.match(urlPattern)

                if (!urlMatch) return m.reply(`*• Audio:*\nGunakan: \`${ prefix + command } https://youtu.be/abc123 mp3\`\n*• Video:*\nGunakan: \`${ prefix + command } https://youtu.be/def456 720\``)

                const url = urlMatch[0]
                const format = text.replace(url, '').trim() || '360'

                const validFormat = ['144', '240', '360', '480', '720', '1080', '1440', '2k', '3k', '4k', '5k', '8k', 'mp3', 'm4a', 'webm', 'aac', 'flac', 'opus', 'ogg', 'wav']
                if (!validFormat.includes(format)) return m.reply(`Format tidak valid! Gunakan: ${validFormat.join(', ')}.`)

                try {
                    await conn.sendMessage(m.from, { react: { text: 'Processing', key: m.key }})

                    let result = await savetube.download(url, format)
                    if (!result.status) return m.reply('Gagal mendapatkan media.')

                    let metadata = result.result
                    let captionInfo = `Judul: ${metadata.title}\nDurasi: ${metadata.duration}\nFormat: ${metadata.quality}`

                    await conn.sendMessage(m.from, { image: { url: metadata.thumbnail || '' }, caption: captionInfo })

                    await conn.sendMessage(m.from, { react: { text: 'Sending', key: m.key }})

                    let fileSize = await getFileSizeFromUrl(metadata.download)
                    let isLarge = fileSize > 25 * 1024 * 1024 // 25MB

                    await conn.sendMessage(m.from, { [isLarge ? 'document' : (format === 'mp3' ? 'audio' : 'video')]: { url: metadata.download }, mimetype: format === 'mp3' ? 'audio/mp4' : 'video/mp4', fileName: `${metadata.title}.${format}` })

                    await conn.sendMessage(m.from, { react: { text: 'Complete', key: m.key }})

                } catch (e) {
                    console.error(e)
                    return m.reply(`*${e.name}* : ${e}`)
                }
            }
            break
            case 'yta': {
                const urlPattern = /https?:\/\/[^\s]+/
                const urlMatch = text.match(urlPattern)

                if (!urlMatch) {
                    return m.reply(`Gunakan: \`${ prefix + command } https://youtu.be/ghi789\``)
                }

                const url = urlMatch[0]

                try {
                    await conn.sendMessage(m.from, { react: { text: 'Processing', key: m.key }})

                    let result = await savetube.download(url, "mp3")
                    if (!result.status) return m.reply('Gagal mendapatkan audio.')

                    let metadata = result.result
                    let captionInfo = `Judul: ${metadata.title}\nDurasi: ${metadata.duration}\nBitrate: ${metadata.quality}kbps`

                    await conn.sendMessage(m.from, { image: { url: metadata.thumbnail || '' }, caption: captionInfo })

                    await conn.sendMessage(m.from, { react: { text: 'Sending', key: m.key }})

                    let fileSize = await getFileSizeFromUrl(metadata.download)
                    let isLarge = fileSize > 25 * 1024 * 1024 // 25MB

                    await conn.sendMessage(m.from, { [isLarge ? 'document' : 'audio']: { url: metadata.download }, mimetype: 'audio/mp4', fileName: `${metadata.title}.mp3` })

                    await conn.sendMessage(m.from, { react: { text: 'Complete', key: m.key }})

                } catch (e) {
                    console.error(e)
                    return m.reply(`*${e.name}* : ${e}`)
                }
            }
            break
            case 'ytv': {
                const urlPattern = /https?:\/\/[^\s]+/
                const urlMatch = text.match(urlPattern)

                if (!urlMatch) return m.reply(`Gunakan: \`${ prefix + command } https://youtu.be/jkl012 720\``)

                const url = urlMatch[0]
                const res = text.replace(url, '').trim() || '360'

                const validRes = ['144', '240', '360', '480', '720', '1080', '1440', '2k', '3k', '4k', '5k', '8k']
                if (!validRes.includes(res)) {
                    return m.reply(`Resolusi tidak valid! Gunakan: \`${validRes.join(', ')}\``)
                }

                try {
                    await conn.sendMessage(m.from, { react: { text: 'Processing', key: m.key }})

                    let result = await savetube.download(url, res)
                    if (!result.status) return m.reply('Gagal mendapatkan video.')

                    let metadata = result.result
                    let captionInfo = `Judul: ${metadata.title}\nDurasi: ${metadata.duration}\nResolusi: ${metadata.quality}p`

                    await conn.sendMessage(m.from, { image: { url: metadata.thumbnail || '' }, caption: captionInfo })

                    await conn.sendMessage(m.from, { react: { text: 'Sending', key: m.key }})

                    let fileSize = await getFileSizeFromUrl(metadata.download)
                    let isLarge = fileSize > 25 * 1024 * 1024 // 25MB

                    await conn.sendMessage(m.from, { [isLarge ? 'document' : 'video']: { url: metadata.download }, mimetype: 'video/mp4', fileName: `${metadata.title}.mp4` })

                    await conn.sendMessage(m.from, { react: { text: 'Complete', key: m.key }})

                } catch (e) {
                    console.error(e)
                    return m.reply(`*${e.name}* : ${e}`)
                }
            }
            break

            default:
                m.reply(`Perintah tidak dikenali. Gunakan: yt, yta, atau ytv.`)
        }
    }
}