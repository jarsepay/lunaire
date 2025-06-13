import baileys from 'baileys-pro'
import axios from 'axios'
import { load } from 'cheerio'

export const cmd = {
    name: ['ig'],
    command: ['ig'],
    category: ['download'],
    detail: {
        desc: 'Download media instagram.',
        use: 'ig [link]'
    },
    async start({ m, conn, prefix, command, text }) {
        let input = findLinks(text)
        if (!input.length) return m.reply(`Gunakan: \`${ prefix + command } https://www.instagram.com/@someone/video/xxx\``)

        const ig = new instagram()
        let res = await ig.reelsVideo(input[0])
        if (!res.success) return await conn.sendMessage(m.from, { text: res.msg })
    
        try {
            let { media } = res
            if (media.length > 1) {
                await ig.sendAlbum(conn, m.from, media, { caption: 'Done', delay: 3000, quoted: m })
            } else {
                if (media[0].type === "image") {
                    await conn.sendMessage(m.from, { image: { url: media[0].url }, caption: 'Done' })
                } else {
                    await conn.sendMessage(m.from, { video: { url: media[0].url }, caption: 'Done' })
                }
            }
        } catch (error) {}
    }
}

function findLinks(text) {
    return text.match(/https?:\/\/\S+/gi) || []
}

class instagram {
    constructor() {
        this.baseUrl = 'https://ig-videos.com/api/download?url='
    }

    async sendAlbum(socket, jid, medias, options) {
        if (medias.length < 2) throw new RangeError("Minimal 2 media")

        let caption = options.caption || ""
        let delay = !isNaN(options.delay) ? options.delay : 500

        const album = baileys.generateWAMessageFromContent(jid, {
            albumMessage: {
                expectedImageCount: medias.filter(m => m.type === "image").length,
                expectedVideoCount: medias.filter(m => m.type === "video").length,
                ...(options.quoted ? { contextInfo: { quotedMessage: options.quoted.message } } : {})
            }
        }, {})

        await socket.relayMessage(jid, album.message, { messageId: album.key.id })

        for (let media of medias) {
            let msg = await baileys.generateWAMessage(jid, { [media.type]: { url: media.url }, caption }, { upload: socket.waUploadToServer })
            await socket.relayMessage(jid, msg.message, { messageId: msg.key.id })
            await baileys.delay(delay)
        }
    }

    async reelsVideo(url) {
        try {
            let { data: html } = await axios.get('https://reelsvideo.io/', { headers: { "User-Agent": "Mozilla/5.0" } })
            let element = load(html)
            let htmlData = element('#main-form').attr('data-include-vals')
            let { tt, ts } = this.extractHtml(htmlData)

            let { data: htmlRes } = await axios.post(`https://reelsvideo.io${this.extractUrl(url)}`, new URLSearchParams({ id: url, tt, ts }), { headers: { "User-Agent": "Mozilla/5.0" } })

            let $ = load(htmlRes)
            if ($('#result h2').text().trim() === 'Nothing is found...') return { success: false, msg: $('#result p.text-gray-700').text().trim() }

            let media = []
            $('#result div.grid > div').each(function () {
                let type = $(this).find('div.px-4 a').text().trim()
                let urlDown = $(this).find('div.px-4 a').attr('href')
                media.push({ type: /video/i.test(type) ? "video" : "image", url: urlDown })
            })

            return { success: true, name: $('span').text().trim(), media }
        } catch (err) {
            throw new Error(err.message)
        }
    }

    extractHtml(html) {
        try {
            let tt = html.match(/tt:\s*'([^']+)'/)?.[1]
            let ts = parseInt(html.match(/ts:\s*(\d+)/)?.[1], 10)
            return { tt, ts }
        } catch {
            return { tt: null, ts: null }
        }
    }

    extractUrl(url) {
        return url.match(/^https:\/\/www\.instagram\.com(\/.*)$/)?.[1] || null
    }
}