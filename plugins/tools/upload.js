import { uploadToCatbox, detectFileType } from '../../lib/src/function.js'
import util from 'util'

export const cmd = {
    name: ['upload'],
    command: ['upload'],
    category: ['tools'],
    detail: {
        desc: 'Ubah media (gambar/video/dokumen) menjadi short url.',
        usage: 'upload [caption/reply media]'
    },
    async start(context) {
        const { m, conn } = context
        try {
            let q = m.quoted ? m.quoted : m
            let mime = (q.msg || q).mimetype || ''
            
            // Jika tidak ada mimetype dari metadata, coba download dan deteksi
            if (!mime) {
                // Cek apakah pesan memiliki media
                if (!q.download) return m.reply('Balas media (gambar/video/dokumen) untuk diupload!')
                
                // Download media
                let media = await q.download()
                if (!media) return m.reply('Gagal mengunduh media!')
                
                // Deteksi MIME type menggunakan fungsi detectFileType
                const fileInfo = detectFileType(media)
                mime = fileInfo.mime
                
                if (mime === 'application/octet-stream') {
                    m.reply('Tipe file tidak terdeteksi. Mencoba upload sebagai file binary...')
                }
                
                // Upload ke hosting
                let link = await uploadToCatbox(media)
                
                // Tentukan tipe media
                let mediaType = mime.split('/')[0] || 'unknown'
                let isTele = /image\/(png|jpe?g|gif)|video\/mp4/.test(mime)
                
                // Kirim hasil
                conn.sendMessage(m.from, { 
                    text: `*「 MEDIA UPLOADED 」*\n\n` +
                          `• *Tipe:* ${mediaType}\n` +
                          `• *Ukuran:* ${media.length} bytes\n` + 
                          `• *MIME:* ${mime}\n` +
                          `• *Ekstensi:* ${fileInfo.ext}\n` +
                          `• *Masa Berlaku:* ${isTele ? 'Permanen' : 'Tidak permanen'}\n` +
                          `• *Link:* ${link}`
                })
            } else {
                // Download media
                let media = await q.download()
                if (!media) return m.reply('Gagal mengunduh media!')
                
                // Determine media type
                let mediaType = mime.split('/')[0] || 'unknown'
                let isTele = /image\/(png|jpe?g|gif)|video\/mp4/.test(mime)
                
                // Konfirmasi dengan detectFileType
                const fileInfo = detectFileType(media)
                
                // Upload to hosting service
                let link = await uploadToCatbox(media)
                
                // Send result
                conn.sendMessage(m.from, { 
                    text: `*「 MEDIA UPLOADED 」*\n` +
                          `• *Tipe:* ${mediaType}\n` +
                          `• *Ukuran:* ${media.length} bytes\n` + 
                          `• *MIME:* ${mime}\n` +
                          `• *Terdeteksi:* ${fileInfo.mime} (${fileInfo.ext})\n` +
                          `• *Masa Berlaku:* ${isTele ? 'Permanen' : 'Tidak permanen'}\n` +
                          `• *Link:* ${link}`
                })
            }
        } catch (error) {
            console.error('Upload error:', error)
            m.reply(`Terjadi kesalahan saat mengupload: ${util.format(error)}`)
        }
    }
}