// government.js
import axios from 'axios'
import FormData from 'form-data'
import { createCanvas, loadImage } from 'canvas'
import {  formatDate } from '../../lib/src/function.js'

const getRankName = (rankNumber) => {
    const ranks = {
        1: 'Internship',
        2: 'Civil Service',
        3: 'Tax Service',
        4: 'Document & Certificate',
        5: 'Public Relations',
        6: 'Vice President',
        7: 'President'
    }

    return ranks[rankNumber]
}

const hasHighPrivilege = (user) => {
    const highRanks = ['Vice President', 'President']
    return highRanks.includes(user.divisi)
}

const generateRandomBirthdate = () => {
    const year = Math.floor(Math.random() * (2010 - 1980 + 1)) + 1980
    const month = Math.floor(Math.random() * 12) + 1
    const maxDays = new Date(year, month, 0).getDate()
    const day = Math.floor(Math.random() * maxDays) + 1
    return `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}`
}

const handleIdCard = async (conn, m, db, targetUser) => {
    const users = db.users.get(targetUser)
    const profile = users.playerInfo

    const name = users.playerInfo.namaLengkap || 'Tidak Ada'
    const birthdate = generateRandomBirthdate()
    const gender = users.playerInfo.jenisKelamin || 'Sesuai Kepercayaan'
    const address = `${users.playerLocation.city}, ${users.playerLocation.country}`
    const marital = users.playerStatus.perkawinan ? 'Telah Kawin' : 'Belum Kawin'
    const occupation = users.playerStatus.pekerjaan[0] || 'Tidak/Belum Bekerja'
            
    const idNumber = Math.floor(10000 + Math.random() * 90000)
            
    const currentDate = new Date()
    const expiryDate = new Date(currentDate.getTime() + (14 * 24 * 60 * 60 * 1000))
    const formattedExpiryDate = formatDate(expiryDate)
            
    const formattedCreationDate = formatDate(currentDate)
            
    const canvas = createCanvas(800, 500)
    const ctx = canvas.getContext('2d')
            
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#f8f9fa')
    gradient.addColorStop(1, '#e9ecef')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
            
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 15
    ctx.shadowOffsetX = 5
    ctx.shadowOffsetY = 5
            
    const borderRadius = 20
    roundRect(ctx, 10, 10, canvas.width - 20, canvas.height - 20, borderRadius, '#1a5fb4')
            
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
            
    const headerGradient = ctx.createLinearGradient(10, 10, canvas.width - 20, 70)
    headerGradient.addColorStop(0, '#1a5fb4')
    headerGradient.addColorStop(1, '#3584e4')
    ctx.fillStyle = headerGradient
            
    roundRect(ctx, 10, 10, canvas.width - 20, 70, { tl: borderRadius, tr: borderRadius, bl: 0, br: 0 }, headerGradient, true)
            
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 3
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.font = 'bold 32px Arial'
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.fillText('Kartu Kependudukan', canvas.width / 2, 55)
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
            
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.beginPath()
    ctx.arc(70, 70, 100, 0, Math.PI * 2)
    ctx.fill()
          
    ctx.font = 'bold 36px Arial'
    ctx.fillStyle = '#1a5fb4'
    ctx.textAlign = 'left'
    ctx.fillText(`ID: ${profile.id ? profile.id : idNumber}`, 40, 120)
            
    ctx.strokeStyle = '#dde1e6'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(40, 135)
    ctx.lineTo(canvas.width - 250, 135)
    ctx.stroke()
            
    ctx.font = 'bold 20px Arial'
    ctx.fillStyle = '#333333'
            
    let yPosition = 170
    const labelX = 40
    const valueX = 220
            
    const infoFields = [
        { label: 'Nama', value: name },
        { label: 'Tanggal Lahir', value: birthdate },
        { label: 'Jenis Kelamin', value: gender },
        { label: 'Alamat', value: address },
        { label: 'Status', value: marital },
        { label: 'Pekerjaan',  value: occupation },
        { label: 'Masa Berlaku', value: formattedExpiryDate }
    ]
            
    infoFields.forEach(field => {
        ctx.font = 'bold 20px Arial'
        ctx.fillStyle = '#1a5fb4'
        ctx.textAlign = 'left'
        ctx.fillText(`${field.label}:`, labelX, yPosition)
            
        ctx.font = '20px Arial'
        ctx.fillStyle = '#333333'
        ctx.fillText(field.value, valueX, yPosition)
            
        yPosition += 40
    })
            
    const imgWidth = 200
    const imgHeight = 267
    const imgX = canvas.width - imgWidth - 40
    const imgY = 120
        
    ctx.save()
            
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 3
    ctx.shadowOffsetY = 3
            
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, imgX - 10, imgY - 10, imgWidth + 20, imgHeight + 20, 10, '#1a5fb4')
            
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
            
    const logo = await loadImage('https://i.ibb.co.com/fjWn9p8/gov.png')
    const logoWidth = 80
    const logoHeight = 80
            
    ctx.save()
    ctx.globalAlpha = 0.7
    ctx.drawImage(logo, 10, canvas.height - logoHeight - 10, logoWidth, logoHeight)
    ctx.restore()
            
    ctx.beginPath()
    roundedRectPath(ctx, imgX, imgY, imgWidth, imgHeight, 5)
    ctx.clip()
            
    try {
        const image = await loadImage('https://i.postimg.cc/gkyW5hsW-/hu-tao.jpg')
        ctx.drawImage(image, imgX, imgY, imgWidth, imgHeight)
    } catch (error) {
    drawPhotoPlaceholder(ctx, imgX, imgY, imgWidth, imgHeight)
    }
            
    ctx.restore()
            
    ctx.globalAlpha = 0.1
    ctx.fillStyle = '#1a5fb4'
    ctx.beginPath()
    ctx.arc(canvas.width / 2, canvas.height / 2, 150, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1.0
            
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 3
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    ctx.font = 'bold 24px Arial'
    ctx.fillStyle = '#1a5fb4'
    ctx.textAlign = 'center'
    ctx.fillText('Gov. States', imgX + imgWidth / 2, imgY + imgHeight + 35)
            
    ctx.shadowColor = 'transparent'
    ctx.font = '18px Arial'
    ctx.fillStyle = '#555555'
    ctx.textAlign = 'center'
    ctx.fillText(formattedCreationDate, imgX + imgWidth / 2, imgY + imgHeight + 65)
            
    const buffer = canvas.toBuffer('image/png')
    const form = new FormData()
    form.append('image', buffer, {
        filename: 'idcard.png',
        contentType: 'image/png'
    })
    
    try {
        const response = await axios.post('https://api.imgbb.com/1/upload?key=7ed0f8d9257ac0d96d908e2935a1d224', form, {
            headers: form.getHeaders()
        })
            
        const link = response.data.data
            
        db.users.update(targetUser, {
            playerInfo: { id: idNumber },
            playerStatus: { registered: true },
            playerInventory: {
                sertifikatDanDokumen: {
                    idCard: {
                        imageUrl: link.url,
                        expiryDate: expiryDate.getTime()
                    }
                }
            }
        })
        db.save()
            
        await conn.sendMessage(targetUser, {
            image: { url: link.url },
            caption: 'Registrasi berhasil! Ini adalah ID Card baru kamu.'
        })
    } catch (e) {
        console.error(e)
        return m.reply('Proses pembuatan gagal, mungkin mesin cetaknya agak rusak. Coba lagi.')
    }
}

const marriageLicense = async (conn, m, db, targetUser, namaPasangan) => {
    const canvas = createCanvas(600, 400)
    const ctx = canvas.getContext('2d')

    const users = db.users.get(targetUser)

    const idNumber = Math.floor(10000 + Math.random() * 90000)

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#000000')
    gradient.addColorStop(1, '#ffa500')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 10
    ctx.strokeStyle = '#ff4500'
    ctx.lineWidth = 5
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)
    ctx.shadowColor = 'transparent'

    ctx.fillStyle = '#e67600'
    ctx.font = '24px Arial'
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 5
    ctx.fillText('Lisensi Pernikahan', canvas.width / 2, 70)
    ctx.shadowColor = 'transparent'

    ctx.fillStyle = '#ffffff'
    ctx.font = '18px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`Nama: ${users.playerInfo.namaLengkap}`, canvas.width / 2, 130)
    ctx.fillText(`Pasangan: ${namaPasangan}`, canvas.width / 2, 160)
    ctx.fillText(`No. Lisensi: ${idNumber}`, canvas.width / 2, 190)

    try {
        const logoAPD = await loadImage('https://i.ibb.co.com/fjWn9p8/gov.png')
        ctx.drawImage(logoAPD, (canvas.width - 100) / 2, 240, 100, 100)
    } catch (error) {
        console.error('Error loading logo:', error)
    }

    ctx.font = '16px cursive'
    ctx.fillText('Government States', canvas.width / 2, 350)

    const buffer = canvas.toBuffer('image/png')
    const form = new FormData()
    form.append('image', buffer, {
        filename: 'anycard.png',
        contentType: 'image/png'
    })

    try {
        const response = await axios.post('https://api.imgbb.com/1/upload?key=7ed0f8d9257ac0d96d908e2935a1d224', form, {
            headers: form.getHeaders()
        })

        const link = response.data.data

        db.users.update(targetUser, {
            playerInventory: {
                sertifikatDanDokumen: {
                    bukuNikah: link.url
                }
            }
        })
        db.save()
        await conn.sendMessage(targetUser, {
            image: link.url,
            caption: `Ini adalah buku pernikahan untuk ${users.playerInfo.namaLengkap}!`
        })
    } catch (e) {
        console.error(e)
        return m.reply('Proses pembuatan gagal, mungkin mesin cetaknya agak rusak. Coba lagi.')
    }
}

export {
    getRankName,
    hasHighPrivilege,
    handleIdCard,
    marriageLicense
}

function roundRect(ctx, x, y, width, height, radius, strokeColor, fill = false) {
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius }
    }

    ctx.beginPath()
    ctx.moveTo(x + radius.tl, y)
    ctx.lineTo(x + width - radius.tr, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr)
    ctx.lineTo(x + width, y + height - radius.br)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height)
    ctx.lineTo(x + radius.bl, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl)
    ctx.lineTo(x, y + radius.tl)
    ctx.quadraticCurveTo(x, y, x + radius.tl, y)
    ctx.closePath()

    if (fill) {
        ctx.fill()
    }

    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 3
    ctx.stroke()
}

function roundedRectPath(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
}

function drawPhotoPlaceholder(ctx, x, y, width, height) {
    const placeholderGradient = ctx.createLinearGradient(x, y, x + width, y + height)
    placeholderGradient.addColorStop(0, '#e9ecef')
    placeholderGradient.addColorStop(1, '#dee2e6')
    ctx.fillStyle = placeholderGradient
    ctx.fillRect(x, y, width, height)

    ctx.fillStyle = '#adb5bd'

    ctx.beginPath()
    ctx.arc(x + width / 2, y + height / 3, width / 5, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(x + width / 2, y + height / 3 + width / 5)
    ctx.lineTo(x + width / 2, y + height / 3 + height / 2)
    ctx.lineTo(x + width / 3, y + height)
    ctx.lineTo(x + width * 2 / 3, y + height)
    ctx.lineTo(x + width / 2, y + height / 3 + height / 2)
    ctx.fill()

    ctx.font = '16px Arial'
    ctx.fillStyle = '#495057'
    ctx.textAlign = 'center'
    ctx.fillText('Photo', x + width / 2, y + height - 20)
}