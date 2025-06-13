import axios from 'axios'

export const cmd = {
    name: ['tiktoksearch'],
    command: ['ttsearch', 'tiktoksearch'],
    category: ['download'],
    detail: {
        desc: 'Cari video tiktok melalui query.',
        use: 'tiktoksearch [query]'
    },
    async start({ m, prefix, command, conn, text }) {
        if (!text) return m.reply(`Gunakan: \`${ prefix + command } Belajar PHP 12 Jam\``)

        try {
            const res = await ttSearch(text)
            const randomIndex = Math.floor(Math.random() * res.videos.length)
            const file = res.videos[randomIndex]
            const url = 'https://tikwm.com' + file.play

            conn.sendMessage(m.from, { video: { url: url }, caption: file.title })
        } catch (e) {
            console.error(e)
            return m.reply(`*${e.name}* : ${e}`)
        }
    }
}

async function ttSearch(query) {
    return new Promise(async (resolve) => {
        axios("https://tikwm.com/api/feed/search", {
            headers: {
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                cookie: "current_language=en",
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
            },
            data: {
                keywords: query,
                count: 12,
                cursor: 0,
                web: 1,
                hd: 1,
            },
            method: "POST",
        }).then((res) => {
            resolve(res.data.data)
        })
    })
}