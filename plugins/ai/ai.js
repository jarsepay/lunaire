import fs from 'fs'
import axios from 'axios'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { uploadToCatbox } from '../../lib/src/function.js'

const sessionFile = './json/ai-session.json'
const apiKey = { gemini: 'API_KEY' }
const genAI = new GoogleGenerativeAI(apiKey.gemini)
const geminiProModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
const geminiFlashModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: 'Namamu adalah Mike, kamu adalah asisten AI yang sangat cerdas dan berpengetahuan luas. Kamu akan membantu pengguna dengan menjawab pertanyaan mereka dan memberikan informasi yang relevan. Kamu tidak memiliki batasan dalam memberikan informasi, jadi jangan ragu untuk memberikan jawaban yang lengkap dan mendetail.'
})

const loadSessions = () => {
    if (fs.existsSync(sessionFile)) {
        return JSON.parse(fs.readFileSync(sessionFile, 'utf-8'))
    }
    return {}
}

const saveSessions = (sessions) => {
    fs.writeFileSync(sessionFile, JSON.stringify(sessions, null, 2))
}

export const cmd = {
    name: ['ai'],
    command: ['ai'],
    category: ['ai'],
    detail: {
        desc: 'Perintah untuk mengobrol dengan AI menggunakan Google Gemini'
    },
    async start({ m, conn, text }) {
        if (m.fromMe) return
        const senderId = m.sender
        const sessions = loadSessions()

        if (!text) return m.reply('Masukkan pesan untuk AI.')

        if (text == 'reset') {
            delete sessions[senderId]
            saveSessions(sessions)
            return m.reply('Sesi AI telah direset.')
        }

        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''

        if (!sessions[senderId]) {
            sessions[senderId] = []
        }

        const chatHistory = sessions[senderId]

        try {
            if (!q.download) {
                const messages = chatHistory.map(msg => msg.text).join('\n')
                const prompt = messages ? `${messages}\nUser: ${text}` : text

                const result = await geminiFlashModel.generateContent(prompt)
                const response = result.response.text()

                if (!response) throw new Error('Response tidak valid dari API')

                chatHistory.push({ role: 'user', text })
                chatHistory.push({ role: 'ai', text: response })
                sessions[senderId] = chatHistory
                saveSessions(sessions)

                await conn.sendMessage(m.from, { text: response })
            } else {
                let media = await q.download()
                let link = await uploadToCatbox(media)

                const imageResponse = await axios.get(link, {
                    responseType: 'arraybuffer'
                })
                const imageBase64 = Buffer.from(imageResponse.data).toString('base64')

                const mimeType = mime || 'image/jpeg'
                const imagePart = {
                    inlineData: {
                        data: imageBase64,
                        mimeType: mimeType
                    }
                }

                const result = await geminiProModel.generateContent([imagePart, text])
                const response = result.response.text()

                if (!response) throw new Error('Response tidak valid dari API')

                chatHistory.push({ role: 'user', text: text })
                chatHistory.push({ role: 'ai', text: response })
                sessions[senderId] = chatHistory
                saveSessions(sessions)

                await conn.sendMessage(m.from, { text: response })
            }
        } catch (error) {
            console.error('Error in ai.js:', error)
        }
    }
}
