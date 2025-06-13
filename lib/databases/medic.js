import axios from 'axios'
import FormData from 'form-data'
import { createCanvas, loadImage } from 'canvas'
import { formatDate } from '../../lib/src/function.js'

const getRankName = (rankNumber) => {
    const ranks = {
        1: 'Intern',
        2: 'Nurse',
        3: 'Paramedic',
        4: 'General Physician',
        5: 'Specialist',
        6: 'Chief Physician',
        7: 'Hospital Director'
    }

    return ranks[rankNumber]
}

const hasHighPrivilege = (user) => {
    const highRanks = ['Chief Physician', 'Hospital Director']
    return highRanks.includes(user.divisi)
}

const validateMedicalItem = (itemType) => {
    const validItems = ['painkiller', 'bandage', 'obat']
    return validItems.includes(itemType.toLowerCase())
}

const handleGiveLic = async (conn, m, db, type, targetUser, args) => {
    const canvas = createCanvas(600, 400)
    const ctx = canvas.getContext('2d')

    const users = db.users.get(targetUser)

    const idNumber = Math.floor(10000 + Math.random() * 90000)

    const currentDate = new Date()
    const expiryDate = new Date(currentDate.getTime() + (14 * 24 * 60 * 60 * 1000))
    const formattedExpiryDate = formatDate(expiryDate)
    const formattedCreationDate = formatDate(currentDate)

    if (type === 'bpjs') {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, '#ffffff')
        gradient.addColorStop(1, '#e0f7e0')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        ctx.shadowBlur = 10
        ctx.strokeStyle = '#28a745'
        ctx.lineWidth = 5
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)
        ctx.shadowColor = 'transparent'

        ctx.fillStyle = '#28a745'
        ctx.font = '24px Arial'
        ctx.textAlign = 'center'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
        ctx.shadowBlur = 5
        ctx.fillText('Kartu BPJS', canvas.width / 2, 70)
        ctx.shadowColor = 'transparent'

        ctx.fillStyle = '#000000'
        ctx.font = '18px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`Nama: ${users.playerInfo.namaLengkap}`, canvas.width / 2, 130)
        ctx.fillText(`No. Kartu: ${idNumber}`, canvas.width / 2, 160)
        ctx.fillText(`Tanggal Lahir: ${args[0]}`, canvas.width / 2, 190)
        ctx.fillText(`Masa Berlaku: ${formattedExpiryDate}`, canvas.width / 2, 220)

        try {
            const logoBPJS = await loadImage('https://i.ibb.co.com/3Y8Byn5v/hospital.png')
            const logoWidth = 80
            const logoHeight = 80
            ctx.drawImage(logoBPJS, canvas.width - logoWidth - 10, canvas.height - logoHeight - 10, logoWidth, logoHeight)
        } catch (error) {
            console.error('Error loading logo:', error)
        }

        ctx.font = '16px cursive'
        ctx.fillText('Hospital', canvas.width / 2, 350)

    } else if (type === 'hc') {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, '#ffffff')
        gradient.addColorStop(1, '#ffc0cb')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        ctx.shadowBlur = 10
        ctx.strokeStyle = '#c00'
        ctx.lineWidth = 5
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)
        ctx.shadowColor = 'transparent'

        ctx.fillStyle = '#c00'
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
        ctx.shadowBlur = 5
        ctx.fillText('Health Certificate', canvas.width / 2, 60)
        ctx.shadowColor = 'transparent'

        ctx.fillStyle = '#000000'
        ctx.font = '18px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Ini untuk menyatakan bahwa:', canvas.width / 2, 100)
        ctx.fillText(users.playerInfo.namaLengkap, canvas.width / 2, 130)
        ctx.fillText('Telah divaksinasi terhadap B-Virus', canvas.width / 2, 160)
        ctx.fillText(`Tanggal Vaksinasi: ${formattedCreationDate}`, canvas.width / 2, 190)
        ctx.fillText(`Certificate ID: ${idNumber}`, canvas.width / 2, 220)
        try {
            const logoHC = await loadImage('https://i.ibb.co.com/3Y8Byn5v/hospital.png')
            ctx.drawImage(logoHC, (canvas.width - 100) / 2, 250, 100, 100)
        } catch (error) {
            console.error('Error loading logo:', error)
        }

        ctx.font = '16px cursive'
        ctx.fillText('Hospital', canvas.width / 2, 350)
    }

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

        if (type === 'bpjs') {
            db.users.update(targetUser, {
                playerInventory: {
                    sertifikatDanDokumen: {
                        bpjs: {
                            imageUrl: link.url,
                            expiryDate: expiryDate.getTime()
                        }
                    }
                }
            })
            db.save()
            await conn.sendMessage(targetUser, {
                image: link.url,
                caption: `Ini adalah lisensi bisnis untuk ${users.playerInfo.namaLengkap}!`
            })
        } else if (type === 'hc') {
            db.users.update(targetUser, {
                playerInventory: {
                    sertifikatDanDokumen: {
                        sertifikatKesehatan: {
                            imageUrl: link.url,
                            expiryDate: expiryDate.getTime()
                        }
                    }
                }
            })
            db.save()
            await conn.sendMessage(targetUser, {
                image: link.url,
                caption: `Ini adalah lisensi pernikahan untuk ${users.playerInfo.namaLengkap}!`
            })
        }
    } catch (e) {
        console.error(e)
        return m.reply('Proses pembuatan gagal, mungkin mesin cetaknya agak rusak. Coba lagi.')
    }
}

export {
    getRankName,
    hasHighPrivilege,
    validateMedicalItem,
    handleGiveLic
}