import crypto from 'crypto'
import fs from 'fs'
import FormData from 'form-data'
import axios from 'axios'
import { Buffer } from 'buffer'

/**
 * Deteksi tipe file berdasarkan signature bytes (magic numbers)
 * @param {Buffer} buffer File Buffer
 * @return {Object} Object berisi ext dan mime
 */
function detectFileType(buffer) {
  // Magic numbers untuk beberapa format file umum
  const signatures = {
    // JPEG
    'ffd8ff': { ext: 'jpg', mime: 'image/jpeg' },
    // PNG
    '89504e47': { ext: 'png', mime: 'image/png' },
    // WebP
    '52494646': { ext: 'webp', mime: 'image/webp' }, // RIFF header, perlu verifikasi tambahan
    // MP4
    '66747970': { ext: 'mp4', mime: 'video/mp4' }, // Cek offset 4 untuk 'ftyp'
    // GIF
    '474946383761': { ext: 'gif', mime: 'image/gif' }, // GIF87a
    '474946383961': { ext: 'gif', mime: 'image/gif' }, // GIF89a
    // MP3
    '494433': { ext: 'mp3', mime: 'audio/mpeg' }, // ID3 tag
    'fffb': { ext: 'mp3', mime: 'audio/mpeg' }, // MPEG frame sync
    // OGG (bisa untuk Opus)
    '4f676753': { ext: 'ogg', mime: 'audio/ogg' }, // OggS
  }

  // Periksa beberapa byte pertama file
  const hex = buffer.toString('hex', 0, 12).toLowerCase()
  
  // Periksa untuk setiap signature
  for (const [signature, fileType] of Object.entries(signatures)) {
    if (hex.startsWith(signature)) {
      // Khusus untuk WebP, perlu pemeriksaan tambahan
      if (signature === '52494646' && buffer.toString('ascii', 8, 12) === 'WEBP') {
        return { ext: 'webp', mime: 'image/webp' }
      }
      
      // Khusus untuk MP4, perlu pemeriksaan di offset 4
      if (signature === '66747970' && hex.indexOf('66747970') === 4) {
        return { ext: 'mp4', mime: 'video/mp4' }
      }
      
      // Signature lainnya
      if (signature !== '52494646' && signature !== '66747970') {
        return fileType
      }
    }
  }
  
  // Default jika tidak terdeteksi
  return { ext: 'bin', mime: 'application/octet-stream' }
}

/**
 * Upload image to catbox
 * Supported mimetype:
 * - `image/jpeg`
 * - `image/jpg`
 * - `image/png`
 * - `image/webp`
 * - `video/mp4`
 * - `video/gif`
 * - `audio/mpeg`
 * - `audio/opus`
 * - `audio/mpa`
 * @param {Buffer} buffer Image Buffer
 * @return {Promise<string>}
 */
async function uploadToCatbox(buffer) {
  const { ext, mime } = detectFileType(buffer)
  const formData = new FormData()
  const randomBytes = crypto.randomBytes(5).toString("hex")
  
  formData.append("reqtype", "fileupload")
  formData.append("fileToUpload", buffer, {
    filename: randomBytes + "." + ext,
    contentType: mime
  })

  const response = await axios.post("https://catbox.moe/user/api.php", formData, {
    headers: {
      "User-Agent": 
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36",
      ...formData.getHeaders()
    }
  })

  return response.data
}

function colors(text, color) {
    const colorCodes = {
        reset: "\x1b[0m",
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        bgBlack: "\x1b[40m",
        bgRed: "\x1b[41m",
        bgGreen: "\x1b[42m",
        bgYellow: "\x1b[43m",
        bgBlue: "\x1b[44m",
        bgMagenta: "\x1b[45m",
        bgCyan: "\x1b[46m",
        bgWhite: "\x1b[47m",
    }

    if (color === 'rainbow') {
        const rainbowColors = [
            colorCodes.red,
            colorCodes.yellow,
            colorCodes.green,
            colorCodes.cyan,
            colorCodes.blue,
            colorCodes.magenta,
        ]

        return text.split('').map((char, index) => {
            return `${rainbowColors[index % rainbowColors.length]}${char}${colorCodes.reset}`
        }).join('')
    }

    return `${colorCodes[color] || colorCodes.reset}${text}${colorCodes.reset}`
}

function formatDateInTimeZone(date, timeZone) {
    const options = {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }

    return new Intl.DateTimeFormat('en-US', options).format(date)
}

function determineFileType(buffer) {
    if (buffer.length < 4) {
        return { mime: 'application/octet-stream', ext: 'bin' }
    }

    const header = buffer.toString('hex', 0, 4)

    switch (header) {
        case '89504e47':
            return { mime: 'image/png', ext: 'png' }
        case 'ffd8ffe0':
        case 'ffd8ffe1':
        case 'ffd8ffe2':
            return { mime: 'image/jpeg', ext: 'jpg' }
        case '47494638':
            return { mime: 'image/gif', ext: 'gif' }
        case '25504446':
            return { mime: 'application/pdf', ext: 'pdf' }
        case '504b0304':
            if (buffer.toString('utf8', 30, 50).includes('AndroidManifest.xml')) {
                return { mime: 'application/vnd.android.package-archive', ext: 'apk' }
            }
            return { mime: 'application/zip', ext: 'zip' }
        default:
            return { mime: 'application/octet-stream', ext: 'bin' }
    }
}

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)]
}

const saveData = (data, path) => {
    try {
        fs.writeFileSync(path, JSON.stringify(data, null, 2))
    } catch (error) {
        console.error('Error saving data:', error)
    }
}

const getCurrentDateTime = () => {
    const d = new Date()
    return {
        date: d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'Asia/Jakarta'
        }),
        time: d.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta'
        }),
        timestamp: d.getTime()
    }
}

const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
}

function formatTime(ms) {
    const minutes = Math.floor(ms / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
        return `${hours} jam ${minutes % 60} menit`
    }
    return `${minutes} menit`
}

export { uploadToCatbox, detectFileType, colors, determineFileType, formatDateInTimeZone, getRandomElement, saveData, getCurrentDateTime, formatDate, formatTime }