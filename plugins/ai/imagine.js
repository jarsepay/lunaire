import fs from 'fs'
import { GoogleGenerativeAI } from '@google/generative-ai'
import path from 'path'

const apiKey = { gemini: 'AIzaSyAnT1vW0O77ECndFyReWnm8I_SU4RFG-Cg' }
const genAI = new GoogleGenerativeAI(apiKey.gemini)

export const cmd = {
    name: ['imagine'],
    command: ['imagine'],
    category: ['ai'],
    detail: {
        desc: 'Perintah untuk membuat gambar dengan AI menggunakan Google Gemini'
    },
    async start({ m, conn, text }) {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''

        if (!text && !q.download) return m.reply('Masukkan teks atau balas gambar untuk membuat gambar.')

        try {
            let imgData = await q.download()

            const base64Image = imgData.toString('base64')

            const contents = [{ text: text },
                {
                    inlineData: {
                        mimeType: mime || 'image/png',
                        data: base64Image
                    }
                }
            ]

            const model = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash-exp-image-generation',
                generationConfig: {
                    responseModalities: ['Text', 'Image']
                },
            })

            const response = await model.generateContent(contents)

            console.log('Response structure:', JSON.stringify(response, null, 2))

            if (response && response.response &&
                response.response.candidates &&
                response.response.candidates.length > 0 &&
                response.response.candidates[0].finishReason === 'IMAGE_SAFETY') {
                return m.reply('Permintaan ditolak karena alasan keamanan konten. Coba dengan gambar atau prompt lain.')
            }

            let resultImage;
            let resultText = ''

            if (response && response.response &&
                response.response.candidates &&
                response.response.candidates.length > 0 &&
                response.response.candidates[0].content &&
                response.response.candidates[0].content.parts) {

                for (const part of response.response.candidates[0].content.parts) {
                    if (part.text) {
                        resultText += part.text
                    } else if (part.inlineData) {
                        const imageData = part.inlineData.data
                        resultImage = Buffer.from(imageData, 'base64')
                    }
                }
            } else if (response && response.candidates &&
                response.candidates.length > 0 &&
                response.candidates[0].content &&
                response.candidates[0].content.parts) {

                for (const part of response.candidates[0].content.parts) {
                    if (part.text) {
                        resultText += part.text
                    } else if (part.inlineData) {
                        const imageData = part.inlineData.data
                        resultImage = Buffer.from(imageData, 'base64')
                    }
                }
            } else if (response && response.parts) {
                for (const part of response.parts) {
                    if (part.text) {
                        resultText += part.text
                    } else if (part.inlineData) {
                        const imageData = part.inlineData.data
                        resultImage = Buffer.from(imageData, 'base64')
                    }
                }
            } else {
                console.error('Unexpected response structure:', response)
                return m.reply('Tidak dapat memproses respons dari Gemini. Format respons tidak sesuai yang diharapkan.')
            }

            if (resultImage) {
                const tempPath = path.join(process.cwd(), 'temp', `gemini_${Date.now()}.png`)
                fs.writeFileSync(tempPath, resultImage)

                await conn.sendMessage(m.from, { image: { url: tempPath }, caption: 'Selesai' })

                setTimeout(() => {
                    try {
                        fs.unlinkSync(tempPath)
                    } catch {}
                }, 30000)
            } else {
                m.reply('Tidak ada gambar yang dihasilkan. Coba dengan prompt atau gambar lain.')
            }
        } catch (error) {
            console.error('Error in imagine.js:', error)
        }
    }
}