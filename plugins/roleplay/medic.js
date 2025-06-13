import {
    getRankName,
    hasHighPrivilege,
    validateMedicalItem,
    handleGiveLic
} from '../../lib/databases/medic.js'
import { getCurrentDateTime } from '../../lib/src/function.js'
import { factionMedData, factionGovData, calculateDutyHours, saveFactionUsers } from '../../lib/databases/faction.js'
import { staffData, rankHierarchy } from '../../lib/databases/staff.js'
import { pajak } from '../../setting.js'

export const cmd = {
    name: ['medic'],
    command: ['medic'],
    category: ['roleplay'],
    detail: {
        desc: 'Fraksi Kesehatan.'
    },
    setting: {
        isRegister: true,
        isBanned: false,
        isJail: false
    },
    async start({ m, db, prefix, command, conn, text }) {

        if (!factionGovData.Government) {
            factionGovData.Government = []
        }

        if (!factionMedData.MedicalDepartment) {
            factionMedData.MedicalDepartment = []
        }

        const isMedUserIndex = factionMedData.MedicalDepartment.findIndex(member => member.id === m.sender)
        const isMedUser = isMedUserIndex !== -1 ? factionMedData.MedicalDepartment[isMedUserIndex] : null

        if (!text) return m.reply(`Gunakan: \`${prefix + command} help\` untuk melihat daftar perintah.`)

        let caption = ''
        const [cmd, ...cmdArgs] = text.split(' ')

        const user = db.users.get(m.sender)
        const target = cmdArgs[0] ? cmdArgs[0].replace(/[@ .+-]/g, '') + '@s.whatsapp.net' : ''
        const userTarget = db.users.get(target)
        const pekerjaan = userTarget.playerStatus.pekerjaan

        const userRank = staffData[m.sender]?.rank
        const userRankLevel = rankHierarchy[userRank]

        const dateTime = getCurrentDateTime()

        switch (cmd.toLowerCase()) {
            case 'list':
                const dutyMembers = factionMedData.MedicalDepartment.filter(member => member.duty === true)

                if (dutyMembers.length === 0) {
                    caption = 'Tidak ada anggota Medical Department yang sedang duty.'
                    break
                }

                caption = '👨‍⚕️ *\`DAFTAR STAFF MEDIS YANG SEDANG DUTY\`*\n\n'
                dutyMembers.forEach((member, index) => {
                    caption += `${index + 1}. ${member.nama} (${member.divisi})\n   Mulai duty: ${member.dutyStartTime}\n`
                })
                break
            case 'recruit':
            case 's-recruit':
                const isStaffRecruit = cmd === 's-recruit'
    
                let permission = false
                let recruiterInfo = ''
    
                if (isStaffRecruit) {
                    if (!staffData[m.sender]) {
                        caption = 'Kamu bukan bagian dari staff kami.'
                        break
                    }
                    if (userRankLevel < 3) {
                        caption = 'Hanya High Staff ke atas yang dapat menggunakan perintah ini.'
                        break
                    }
                    permission = true
                    recruiterInfo = `${staffData[m.sender].name} (Staff)`
                } else {
                    if (!isMedUser) {
                        caption = 'Kamu bukan anggota Medical Department.'
                        break
                    }
                    if (!['Specialist', 'Chief Physician', 'Hospital Director'].includes(isMedUser.divisi)) {
                        caption = 'Kamu harus memiliki pangkat Specialist atau lebih tinggi untuk merekrut anggota baru.'
                        break
                    }
                    if (!isMedUser.duty) {
                        caption = 'Kamu harus duty terlebih dahulu untuk merekrut anggota baru.'
                        break
                    }
                    permission = true
                    recruiterInfo = `${isMedUser.nama} (${isMedUser.divisi})`
                }

                if (!target) {
                    caption = `Gunakan: \`${prefix + command} ${cmd} [target]\``
                    break
                }

                if (!userTarget.playerInventory.sertifikatDanDokumen.idCard.imageUrl) {
                    caption = 'Orang ini belum memiliki ID Card.'
                    break
                }

                if (userTarget.playerStatus.jail.status) {
                    caption = 'Orang ini sedang dalam penjara dan tidak dapat direkrut.'
                    break
                }

                if (factionMedData.MedicalDepartment.findIndex(member => member.id === target) !== -1) {
                    caption = 'Orang ini sudah menjadi anggota Medical Department.'
                    break
                }

                const newMember = {
                    id: target,
                    nama: userTarget.playerInfo.namaLengkap,
                    divisi: 'Intern',
                    duty: false,
                    joinDate: dateTime.date,
                    dutyHistory: [],
                    treatmentHistory: [],
                    recruitedBy: recruiterInfo
                }

                const newJob = [...pekerjaan, 'Medical Department']
                userTarget.playerStatus.pekerjaan = newJob

                db.users.update(target, userTarget)
                db.save()

                factionMedData.MedicalDepartment.push(newMember)
                saveFactionUsers(factionMedData)

                try {
                    const recruiterType = isStaffRecruit ? `staff ${staffData[m.sender].name}` : recruiterInfo
                    conn.reply(target, `Selamat! Kamu telah direkrut ke dalam Medical Department sebagai Intern oleh ${recruiterType}.\n\nGunakan \`${prefix + command} help\` untuk menampilkan menu bantuan.`, null)
                } catch (err) {
                    console.log('Gagal mengirim pesan ke anggota tersebut:', err)
                }

                caption = `${userTarget.playerInfo.namaLengkap} telah berhasil direkrut ke dalam Medical Department sebagai Intern.`
                break
            case 'duty':
                if (!isMedUser) {
                    caption = 'Kamu bukan anggota Medical Department.'
                    break
                }

                if (!isMedUser.duty) {
                    isMedUser.duty = true
                    isMedUser.dutyStartTime = `${dateTime.date} ${dateTime.time}`
                    isMedUser.dutyStartTimestamp = dateTime.timestamp

                    factionMedData.MedicalDepartment[isMedUserIndex] = isMedUser
                    saveFactionUsers(factionMedData)

                    caption = `Kamu telah memulai duty sebagai ${isMedUser.divisi} pada ${dateTime.date} pukul ${dateTime.time}.`
                } else {
                    isMedUser.duty = false
                    const dutyDuration = calculateDutyHours(isMedUser.dutyStartTimestamp, dateTime.timestamp)

                    if (!isMedUser.dutyHistory) isMedUser.dutyHistory = []
                    isMedUser.dutyHistory.push({
                        start: isMedUser.dutyStartTime,
                        end: `${dateTime.date} ${dateTime.time}`,
                        duration: dutyDuration
                    })

                    delete isMedUser.dutyStartTime
                    delete isMedUser.dutyStartTimestamp

                    factionMedData.MedicalDepartment[isMedUserIndex] = isMedUser
                    saveFactionUsers(factionMedData)

                    caption = `Kamu telah mengakhiri duty.\nDurasi duty: ${dutyDuration}`
                }
                break
            case 'setrank':
               const rankNumber = parseInt(cmdArgs[1])
    
                if (!target || isNaN(rankNumber) || rankNumber < 1 || rankNumber > 7) {
                    caption = `Gunakan: \`${prefix + command} ${cmd} [target] [nomor rank 1-7]\``
                    break
                }

               const setRankIndex = factionMedData.MedicalDepartment.findIndex(member => member.id === target)
    
                if (setRankIndex === -1) {
                    caption = 'Orang ini tidak ditemukan dalam Medical Department.'
                    break
                }

                if (userTarget.playerStatus.jail.status) {
                    caption = 'Orang ini sedang dalam penjara'
                    break
                }

                let bolehGa = false
                let gaBolehKarena = ''

                if (isMedUser) {
                    if (!hasHighPrivilege(isMedUser)) {
                        gaBolehKarena = 'Hanya Chief Physician dan Hospital Director yang dapat menggunakan perintah ini.'
                    } else if (!isMedUser.duty) {
                        gaBolehKarena = 'Kamu harus duty terlebih dahulu.'
                    } else {
                        bolehGa = true
                    }
                } else if (staffData[m.sender]) {
                    if (userRankLevel < 4) {
                        gaBolehKarena = 'Hanya Super Staff ke atas yang dapat menggunakan perintah ini.'
                    } else {
                        bolehGa = true
                    }
                } else {
                    gaBolehKarena = 'Kamu bukan anggota Medical Department.'
                }

                if (!bolehGa) {
                    caption = gaBolehKarena
                    break
                }

                const oldRank = factionMedData.MedicalDepartment[setRankIndex].divisi
                const newRank = getRankName(rankNumber)
    
                factionMedData.MedicalDepartment[setRankIndex].divisi = newRank
                saveFactionUsers(factionMedData)
    
                caption = `Jabatan ${factionMedData.MedicalDepartment[setRankIndex].nama} telah diubah dari ${oldRank} menjadi ${newRank}.`
                break
            case 'payday':
                if (!isMedUser) {
                    caption = 'Kamu bukan anggota Medical Department.'
                    break
                }

                if (isMedUser.lastPayday && isMedUser.lastPayday === dateTime.date) {
                    caption = 'Kamu sudah mengklaim gaji hari ini.'
                    break
                }

                const rankSalary = {
                    'Intern': 700,
                    'Nurse': 1000,
                    'Paramedic': 2000,
                    'General Physician': 3000,
                    'Specialist': 5000,
                    'Chief Physician': 9000,
                    'Hospital Director': 12000
                }

                const salary = rankSalary[isMedUser.divisi]

                if (!factionGovData.Storage) {
                    factionGovData.Storage = {
                        balance: 0,
                        transactions: []
                    }
                }

                if (!factionGovData.Storage || factionGovData.Storage.balance < salary) {
                    caption = 'Saldo di storage government tidak mencukupi.'
                    break
                }

                factionGovData.Storage.transactions.push({
                    type: 'salary',
                    amount: salary,
                    by: isMedUser.nama,
                    role: isMedUser.divisi,
                    date: `${dateTime.date} ${dateTime.time}`,
                    timestamp: dateTime.timestamp
                })

                user.playerInventory.items.uang += salary

                db.users.update(m.sender, user)
                db.save()

                factionGovData.Storage.balance -= salary
                saveFactionUsers(factionGovData)

                isMedUser.lastPayday = dateTime.date

                factionMedData.MedicalDepartment[isMedUserIndex] = isMedUser
                saveFactionUsers(factionMedData)

                caption = `Kamu telah menerima gaji hari ini sebesar $${salary}`
                break
            case 'give':
                if (!isMedUser) {
                    caption = 'Kamu bukan anggota Medical Department.'
                    break
                }

                if (!['Nurse', 'Paramedic', 'General Physician', 'Specialist', 'Chief Physician', 'Hospital Director'].includes(isMedUser.divisi)) {
                    caption = 'Kamu harus memiliki pangkat Nurse atau lebih tinggi.'
                    break
                }

                if (!isMedUser.duty) {
                    caption = 'Kamu harus duty terlebih dahulu.'
                    break
                }

                const quantity = parseInt(cmdArgs[1])
                const itemType = cmdArgs[2]?.toLowerCase()

                if (!target || isNaN(quantity) || quantity <= 0 || !itemType || !validateMedicalItem(itemType)) {
                    caption = `Gunakan: \`${ prefix + command } ${cmd} @user [jumlah] [painkiller/bandage/obat]\``
                    break
                }

                if (itemType === 'obat') {
                    db.users.update(target, {
                        playerInventory: {
                            items: {
                                obat: (userTarget.playerInventory.items.obat) + quantity
                            }
                        }
                    })
                    db.save()
                } else if (itemType === 'painkiller') {
                    db.users.update(target, {
                        playerInventory: {
                            items: {
                                painkiller: (userTarget.playerInventory.items.painkiller) + quantity
                            }
                        }
                    })
                    db.save()
                } else if (itemType === 'bandage') {
                    db.users.update(target, {
                        playerInventory: {
                            items: {
                                bandage: (userTarget.playerInventory.items.bandage) + quantity
                            }
                        }
                    })
                    db.save()
                }

                if (!isMedUser.treatmentHistory) isMedUser.treatmentHistory = []
                isMedUser.treatmentHistory.push({
                    patient: userTarget.playerInfo.namalengkap,
                    date: `${dateTime.date} ${dateTime.time}`,
                    treatment: `Gave ${quantity} ${itemType}`
                })

                factionMedData.MedicalDepartment[isMedUserIndex] = isMedUser
                saveFactionUsers(factionMedData)

                caption = `${quantity} ${itemType} telah diberikan kepada ${userTarget.playerInfo.namalengkap}.`
                break
            case 'givelic':
                if (!isMedUser) {
                    caption = 'Kamu bukan anggota Medical Department.'
                    break
                }

                if (!['General Physician', 'Specialist', 'Chief Physician', 'Hospital Director'].includes(isMedUser.divisi)) {
                    caption = 'Kamu harus memiliki pangkat General Physician atau lebih tinggi.'
                    break
                }

                if (!isMedUser.duty) {
                    caption = 'Kamu harus duty terlebih dahulu.'
                    break
                }

                const licenseType = cmdArgs[0]?.toLowerCase()
                const licenseTarget = cmdArgs[1] ? cmdArgs[1].replace(/[@ .+-]/g, '') + '@s.whatsapp.net' : ''
                const licenseArgs = cmdArgs.slice(2)

                if (!licenseType || !licenseTarget || (licenseType !== 'bpjs' && licenseType !== 'hc')) {
                    caption = `Gunakan:\n- ${ prefix + command } ${cmd} bpjs @user [tanggal lahir]\n- ${ prefix + command } ${cmd} hc <user>`
                    break
                }

                const targetUser = db.users.get(licenseTarget)

                if (!targetUser.playerInventory.sertifikatDanDokumen.idCard.imageUrl) {
                    caption = 'Orang ini tidak memiliki ID Card.'
                    break
                }

                await handleGiveLic(conn, m, db, licenseType, licenseTarget, licenseArgs)

                if (!isMedUser.treatmentHistory) isMedUser.treatmentHistory = []
                isMedUser.treatmentHistory.push({
                    patient: targetUser.playerInfo.namaLengkap,
                    date: `${dateTime.date} ${dateTime.time}`,
                    treatment: `Issued ${licenseType === 'bpjs' ? 'BPJS Card' : 'Health Certificate'}`
                })

                factionMedData.MedicalDepartment[isMedUserIndex] = isMedUser
                saveFactionUsers(factionMedData)
                break
            case 'cure':
                if (!isMedUser) {
                    caption = 'Kamu bukan anggota Medical Department.'
                    break
                }

                if (!['General Physician', 'Specialist', 'Chief Physician', 'Hospital Director'].includes(isMedUser.divisi)) {
                    caption = 'Kamu harus memiliki pangkat General Physician atau lebih tinggi.'
                    break
                }

                if (!isMedUser.duty) {
                    caption = 'Kamu harus duty terlebih dahulu.'
                    break
                }

                if (!target) {
                    caption = `Gunakan: \`${ prefix + command } ${cmd} @user\``
                    break
                }

                if (userTarget.playerInfo.health >= 100) {
                    caption = 'Orang ini tidak memerlukan perawatan medis.'
                    break
                }

                const previousHealth = userTarget.playerInfo.health
                db.users.update(target, {
                    playerInfo: {
                        health: 100,
                        energy: 100
                    },
                    playerStatus: {
                        pingsan: false,
                        sakit: false
                    }
                })
                db.save()

                if (!isMedUser.treatmentHistory) isMedUser.treatmentHistory = []
                isMedUser.treatmentHistory.push({
                    patient: userTarget.playerInfo.namaLengkap,
                    date: `${dateTime.date} ${dateTime.time}`,
                    treatment: `Healed from ${previousHealth} to 100 health`
                })

                factionMedData.MedicalDepartment[isMedUserIndex] = isMedUser
                saveFactionUsers(factionMedData)

                caption = `Berhasil melakukan perawatan kepada ${userTarget.playerInfo.namaLengkap}.`
                break
            case 'kick':
                if (!target) {
                    caption = `Gunakan: \`${prefix + command} ${cmd} [target]\``
                    break
                }

                const kickIndex = factionMedData.MedicalDepartment.findIndex(member => member.id === target)
    
                if (kickIndex === -1) {
                    caption = 'Target tidak ditemukan dalam Medical Department.'
                    break
                }

                if (hasHighPrivilege(factionMedData.MedicalDepartment[kickIndex])) {
                    caption = 'Tidak dapat mengeluarkan Chief Physician dan Hospital Director.'
                    break
                }

                let hasPermission = false
                let iniMessage = ''

                if (isMedUser) {
                    if (!hasHighPrivilege(isMedUser)) {
                        iniMessage = 'Hanya Chief Physician dan Hospital Director yang dapat menggunakan perintah ini.'
                    } else if (!isMedUser.duty) {
                        iniMessage = 'Kamu harus duty terlebih dahulu.'
                    } else {
                        hasPermission = true
                    }
                } else if (staffData[m.sender]) {
                    if (userRankLevel < 3) {
                        iniMessage = 'Hanya High Staff ke atas yang dapat menggunakan perintah ini.'
                    } else {
                        hasPermission = true
                    }
                } else {
                    iniMessage = 'Kamu bukan anggota Medical Department.'
                }

                if (!hasPermission) {
                    caption = iniMessage
                    break
                }

                factionMedData.MedicalDepartment.splice(kickIndex, 1)
                userTarget.playerStatus.pekerjaan = pekerjaan.filter(p => p !== 'Medical Department')
                
                db.users.update(target, pekerjaan)
                db.save()
                saveFactionUsers(factionMedData)
    
                caption = `${userTarget.playerInfo.namaLengkap} telah dikeluarkan dari Medical Department.`
                break
            case 'history':
                if (!isMedUser) {
                    caption = 'Kamu bukan anggota Medical Department.'
                    break
                }

                if (!isMedUser.dutyHistory || isMedUser.dutyHistory.length === 0) {
                    caption = 'Kamu belum memiliki riwayat duty.'
                    break
                }

                caption = `👨‍⚕️ *\`RIWAYAT DUTY ${isMedUser.nama}\`*\n\n`

                isMedUser.dutyHistory.slice(-10).forEach((duty, index) => {
                    caption += `${index + 1}. Mulai: ${duty.start}\n   Selesai: ${duty.end}\n   Durasi: ${duty.duration}\n\n`
                })
                break
            case 'patients':
                if (!isMedUser) {
                    caption = 'Kamu bukan anggota Medical Department.'
                    break
                }

                if (!isMedUser.treatmentHistory || isMedUser.treatmentHistory.length === 0) {
                    caption = 'Kamu belum memiliki riwayat pasien.'
                    break
                }

                caption = `👨‍⚕️ *\`RIWAYAT PASIEN ${isMedUser.nama}\`*\n\n`

                isMedUser.treatmentHistory.slice(-10).forEach((treatment, index) => {
                    caption += `${index + 1}. Pasien: ${treatment.patient}\n   Tanggal: ${treatment.date}\n   Perawatan: ${treatment.treatment}\n\n`
                })
                break
            case 'help':
                caption = `👨‍⚕️ *\`DAFTAR PERINTAH\`*\n\n`

                caption += `*Contoh:* \`${prefix + command} list\`\n`
                caption += `*Prefix:* \`${prefix}\`\n\n`

                caption += `*Non-Employee Command:*\n`
                caption += `• \`${command} list\` - Lihat daftar staff medis yang sedang duty\n\n`

                if (isMedUser) {
                    caption += `*Basic Command:*\n`
                    caption += `• \`${command} duty\` - Mulai/akhiri duty\n`
                    caption += `• \`${command} history\` - Lihat riwayat duty\n`
                    caption += `• \`${command} payday\` - Klaim gaji harian\n`
                    caption += `• \`${command} patients\` - Lihat riwayat pasien\n\n`

                    if (['Nurse', 'Para\`${command}', 'General Physician', 'Specialist', 'Chief Physician', 'Hospital Director'].includes(isMedUser.divisi)) {
                        caption += `*\`Medical Command (Nurse+):*\n`
                        caption += `• \`${command} give\` [target] [jumlah] [jenis item] - Berikan item medis\n\n`
                    }

                    if (['General Physician', 'Specialist', 'Chief Physician', 'Hospital Director'].includes(isMedUser.divisi)) {
                        caption += `*Treatment Command (General Physician+):*\n`
                        caption += `• \`${command} cure\` - Obati seseorang\n`
                        caption += `• \`${command} givelic\` - Berikan lisensi\n\n`
                    }

                    if (['Specialist', 'Chief Physician', 'Hospital Director'].includes(isMedUser.divisi)) {
                        caption += `*Recruitment Command (Specialist+):*\n`
                        caption += `• \`${command} recruit\` - Rekrut anggota baru\n\n`
                    }

                    if (['Chief Physician', 'Hospital Director'].includes(isMedUser.divisi)) {
                        caption += `*Management Command (Chief Physician+):*\n`
                        caption += `• \`${command} setrank\` - Ubah pangkat anggota\n`
                        caption += `• \`${command} kick\` - Keluarkan anggota\n\n`
                    }
                }
                if (staffData[m.sender] && userRankLevel > 2) {
                    caption += `*Staff Command (High Staff+):*\n`
                    caption += `• \`${command} s-recruit\` - Rekrut anggota baru\n`
                    caption += `• \`${command} kick\` - Keluarkan anggota\n\n`
                }
                if (staffData[m.sender] && userRankLevel > 3) {
                    caption += `*Staff Command (Super Staff+):*\n`
                    caption += `• \`${command} setrank\` - Ubah pangkat anggota\n\n`
                }

                caption += `*Posisi Jabatan Medical Department:*\n`
                caption += `1. Intern\n2. Nurse\n3. Paramedic\n4. General Physician\n5. Specialist\n6. Chief Physician\n7. Hospital Director`
                break
            default:
                if (isMedUser) {
                    caption = `Perintah tidak dikenali. Gunakan: \`${ prefix + command } help\` untuk melihat daftar perintah.`
                } else {
                    caption = `Gunakan: \`${ prefix + command } help\` untuk melihat daftar perintah.`
                }
        }
        conn.sendMessage(m.from, { text: caption.trim() })
    }
}