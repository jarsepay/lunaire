import axios from 'axios'
import * as cheerio from 'cheerio'

const TTSAVE_API = {
    BASE_URL: "https://ttsave.app",
    DOWNLOAD_ENDPOINT: "/download",
    HEADERS: {
        authority: "ttsave.app",
        accept: "application/json, text/plain, */*",
        origin: "https://ttsave.app",
        "user-agent": "Postify/1.0.0"
    }
}

class TikTokDownloader {
    static async submit(url, referer) {
        const headers = {
            ...TTSAVE_API.HEADERS,
            referer
        }

        const data = {
            query: url,
            language_id: "1"
        }

        return axios.post(`${TTSAVE_API.BASE_URL}${TTSAVE_API.DOWNLOAD_ENDPOINT}`, data, {
            headers
        })
    }

    static parseHTML($) {
        const parseStats = () => {
            const stats = {
                plays: "0",
                likes: "0",
                comments: "0",
                shares: "0"
            }

            $('.flex.flex-row.items-center.justify-center').each((_, element) => {
                const $element = $(element);
                const svgPath = $element.find('svg path').attr('d')
                const value = $element.find('span.text-gray-500').text().trim()

                if (svgPath?.startsWith("M10 18a8 8 0 100-16")) stats.plays = value;
                else if (svgPath?.startsWith("M3.172 5.172a4 4 0 015.656")) stats.likes = value
                else if (svgPath?.startsWith("M18 10c0 3.866-3.582")) stats.comments = value
                else if (svgPath?.startsWith("M17.593 3.322c1.1.128")) stats.shares = value
            })

            return stats
        }

        const parseSlides = () => {
            return $('a[type="slide"]')
                .map((i, el) => ({
                    number: i + 1,
                    url: $(el).attr('href')
                }))
                .get()
        }

        return {
            uniqueId: $('#unique-id').val(),
            nickname: $('h2.font-extrabold').text(),
            profilePic: $('img.rounded-full').attr('src'),
            username: $('a.font-extrabold.text-blue-400').text(),
            description: $('p.text-gray-600').text(),
            downloadLinks: {
                noWatermark: $('a.w-full.text-white.font-bold').first().attr('href'),
                withWatermark: $('a.w-full.text-white.font-bold').eq(1).attr('href'),
                audio: $('a[type="audio"]').attr('href'),
                profilePic: $('a[type="profile"]').attr('href'),
                cover: $('a[type="cover"]').attr('href')
            },
            stats: parseStats(),
            songTitle: $('.flex.flex-row.items-center.justify-center.gap-1.mt-5')
                .find('span.text-gray-500')
                .text()
                .trim(),
            slides: parseSlides()
        }
    }

    static async download(url) {
        try {
            const response = await this.submit(url, `${TTSAVE_API.BASE_URL}/en`)
            const parsedData = this.parseHTML(cheerio.load(response.data))

            return {
                type: parsedData.slides.length > 0 ? 'slide' : 'video',
                ...parsedData,
                videoInfo: parsedData.slides.length > 0 ? null : {
                    nowm: parsedData.downloadLinks.noWatermark,
                    wm: parsedData.downloadLinks.withWatermark
                }
            }
        } catch (error) {
            console.error('Tidak dapat mengunduh:', error)
            throw new Error(msg.error)
        }
    }
}

export const cmd = {
    name: ['tiktok'],
    command: ['tt', 'tiktok'],
    category: ['download'],
    detail: {
        desc: 'Download media tiktok.',
        use: 'tiktok [link]'
    },
    async start({ m, prefix, command, conn, text }) {
        if (!text) return m.reply(`Gunakan: \`${ prefix + command } https://www.tiktok.com/@someone/video/xxx\``)

        try {
            const result = await TikTokDownloader.download(text)
            const message = formatResponseMessage(result)

            await sendContent(conn, m.from, result, message, m)
        } catch (e) {
            console.error(e)
            return m.reply(`*${e.name}* : ${e}`)
        }
    }
}

function formatResponseMessage(result) {
    const baseMessage = `• Nickname: ${result.nickname || "-"}
  • Username: ${result.username || "-"}
  • Deskripsi: ${result.description || "-"}
  `.trim()

    return `${baseMessage}\n${result.type === 'slide' ? '📷 Tipe: Slide (Images)' : '🎥 Tipe: Video'}`
}

async function sendContent(conn, chat, result, message, m) {
    if (result.type === 'slide') {
        await conn.reply(chat, message, m)
        for (const slide of result.slides) {
            await await conn.sendMessage(m.from, { image: { url: slide.url }, caption: null })
        }
    } else if (result.type === 'video' && result.videoInfo?.nowm) {
        await conn.sendMessage(m.from, { video: { url: result.videoInfo.nowm }, caption: message })
    } else {
        conn.reply(chat, 'Gagal mendapat video tanpa watermark', m)
    }

    if (result.downloadLinks.audio) {
        await conn.sendMessage(m.from, { audio: { url: result.downloadLinks.audio, }, mimetype: "audio/mpeg" })
    }
}