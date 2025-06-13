import { getCurrentDateTime } from '../../lib/src/function.js'
import { factionGovData, calculateDutyHours, saveFactionUsers } from '../../lib/databases/faction.js'
import { staffData, rankHierarchy } from '../../lib/databases/staff.js'
import { idGrupBot, pajak } from '../../setting.js'
import {
    getRankName,
    hasHighPrivilege,
    handleIdCard,
    marriageLicense
} from '../../lib/databases/government.js'

export const cmd = {
    name: ['gov'],
    command: ['gov'],
    category: ['roleplay'],
    detail: {
        desc: 'Fraksi Pemerintahan.'
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

        const isGovUserIndex = factionGovData.Government.findIndex(member => member.id === m.sender)
        const isGovUser = isGovUserIndex !== -1 ? factionGovData.Government[isGovUserIndex] : null

        const userRank = staffData[m.sender]?.rank
        const userRankLevel = rankHierarchy[userRank]

        if (!text) return m.reply(`Gunakan \`${ prefix + command } help\` untuk melihat daftar perintah.`)

        let caption = ''
        const [cmd, ...cmdArgs] = text.split(' ')

        const user = db.users.get(m.sender)
        const target = cmdArgs[0] ? cmdArgs[0].replace(/[@ .+-]/g, '') + '@s.whatsapp.net' : ''
        const userTarget = db.users.get(target)
        const pekerjaan = userTarget.playerStatus.pekerjaan

        const dateTime = getCurrentDateTime()
        
        const dutyMembers = factionGovData.Government.filter(member => member.duty === true)

        switch (cmd.toLowerCase()) {
            case 'list':
                if (dutyMembers.length === 0) {
                    caption = 'Tidak ada anggota Government yang sedang duty.'
                    break
                }

                caption = '📋 *\`DAFTAR PETUGAS GOVERNMENT YANG SEDANG DUTY\`*\n\n'
                dutyMembers.forEach((member, index) => {
                    caption += `${index + 1}. ${member.nama} (${member.divisi})\n   Mulai duty: ${member.dutyStartTime}\n`.trim()
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
                    if (userRankLevel < 4) {
                        caption = 'Hanya Super Staff ke atas yang dapat menggunakan perintah ini.'
                        break
                    }
                    permission = true
                    recruiterInfo = `${staffData[m.sender].name} (Staff)`
                } else {
                    if (!isGovUser) {
                        caption = 'Kamu bukan anggota Government States.'
                        break
                    }
                    if (!['Public Relations', 'Vice President', 'President'].includes(isGovUser.divisi)) {
                        caption = 'Kamu harus memiliki pangkat Public Relations atau lebih tinggi untuk merekrut anggota baru.'
                        break
                    }
                    if (!isGovUser.duty) {
                        caption = 'Kamu harus duty terlebih dahulu untuk merekrut anggota baru.'
                        break
                    }
                    permission = true
                    recruiterInfo = `${isGovUser.nama} (${isGovUser.divisi})`
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

                if (factionGovData.Government.findIndex(member => member.id === target) !== -1) {
                    caption = 'Orang ini sudah menjadi anggota Government States.'
                    break
                }

                const newMember = {
                    id: target,
                    nama: userTarget.playerInfo.namaLengkap,
                    divisi: 'Internship',
                    duty: false,
                    joinDate: dateTime.date,
                    dutyHistory: [],
                    recruitedBy: recruiterInfo
                }

                const newJob = [...pekerjaan, 'Government States']
                userTarget.playerStatus.pekerjaan = newJob

                db.users.update(target, userTarget)
                db.save()

                factionGovData.Government.push(newMember)
                saveFactionUsers(factionGovData)

                try {
                    const recruiterType = isStaffRecruit ? `staff ${staffData[m.sender].name}` : recruiterInfo
                    conn.reply(target, `Selamat! Kamu telah direkrut ke dalam Government States sebagai Internship oleh ${recruiterType}.\n\nGunakan \`${prefix + command} help\` untuk menampilkan menu bantuan.`, null)
                } catch (err) {
                    console.log('Gagal mengirim pesan ke anggota tersebut:', err)
                }

                caption = `${userTarget.playerInfo.namaLengkap} telah berhasil direkrut ke dalam Government States sebagai Internship.`
                break
            case 'duty':
                if (!isGovUser) {
                    caption = 'Kamu bukan anggota Government States.'
                    break
                }

                if (!isGovUser.duty) {
                    isGovUser.duty = true
                    isGovUser.dutyStartTime = `${dateTime.date} ${dateTime.time}`
                    isGovUser.dutyStartTimestamp = dateTime.timestamp

                    factionGovData.Government[isGovUserIndex] = isGovUser
                    saveFactionUsers(factionGovData)

                    caption = `Kamu telah memulai duty sebagai ${isGovUser.divisi} pada ${dateTime.date} pukul ${dateTime.time}.`
                } else {
                    isGovUser.duty = false
                    const dutyDuration = calculateDutyHours(isGovUser.dutyStartTimestamp, dateTime.timestamp)

                    if (!isGovUser.dutyHistory) isGovUser.dutyHistory = []
                    isGovUser.dutyHistory.push({
                        start: isGovUser.dutyStartTime,
                        end: `${dateTime.date} ${dateTime.time}`,
                        duration: dutyDuration
                    })

                    delete isGovUser.dutyStartTime
                    delete isGovUser.dutyStartTimestamp

                    factionGovData.Government[isGovUserIndex] = isGovUser
                    saveFactionUsers(factionGovData)

                    caption = `Kamu telah mengakhiri duty.\nDurasi duty: ${dutyDuration}`
                }
                break
            case 'setrank':
               const rankNumber = parseInt(cmdArgs[1])
    
                if (!target || isNaN(rankNumber) || rankNumber < 1 || rankNumber > 7) {
                    caption = `Gunakan: \`${prefix + command} ${cmd} [target] [nomor rank 1-7]\``
                    break
                }

               const setRankIndex = factionGovData.Government.findIndex(member => member.id === target)
    
                if (setRankIndex === -1) {
                    caption = 'Orang ini tidak ditemukan dalam Government States.'
                    break
                }

                if (userTarget.playerStatus.jail.status) {
                    caption = 'Orang ini sedang dalam penjara'
                    break
                }

                let bolehGa = false
                let gaBolehKarena = ''

                if (isGovUser) {
                    if (!hasHighPrivilege(isGovUser)) {
                        gaBolehKarena = 'Hanya Presiden dan Wakil Presiden yang dapat menggunakan perintah ini.'
                    } else if (!isGovUser.duty) {
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
                    gaBolehKarena = 'Kamu bukan anggota Government States.'
                }

                if (!bolehGa) {
                    caption = gaBolehKarena
                    break
                }

                const oldRank = factionGovData.Government[setRankIndex].divisi
                const newRank = getRankName(rankNumber)
    
                factionGovData.Government[setRankIndex].divisi = newRank
                saveFactionUsers(factionGovData)
    
                caption = `Jabatan ${factionGovData.Government[setRankIndex].nama} telah diubah dari ${oldRank} menjadi ${newRank}.`
                break
            case 'license':
                const licenseTypes = {
                    idcard: { cost: 125, transactionType: 'new_idcard' },
                    nikah: { cost: 350, transactionType: 'new_marriage' }
                }

                if (!factionGovData.Storage) {
                    factionGovData.Storage = {
                        balance: 0,
                        transactions: []
                    }
                }

                if (!isGovUser) {
                    // Non-employee
                    if (dutyMembers.length !== 0) {
                        caption = 'Ada anggota Government yang sedang bertugas! Perintah ini hanya dapat digunakan jika tidak ada anggota Government yang sedang bertugas.'
                        break
                    }

                    const type = cmdArgs[0]?.toLowerCase()
        
                    if (!type || !licenseTypes[type]) {
                        caption = `Gunakan: \`${prefix + command} ${cmd} [nikah/idcard]\``
                        break
                    }

                    const { cost, transactionType } = licenseTypes[type]
                    const totalCost = cost + (pajak * cost)
                    const taxAmount = cost * pajak

                    if (user.playerInventory.items.uang < totalCost) {
                        caption = `Uang tidak cukup. Kamu butuh $${totalCost}`
                        break
                    }

                    factionGovData.Storage.transactions.push({
                        type: transactionType,
                        amount: taxAmount,
                        by: user.playerInfo.namaLengkap,
                        role: user.playerStatus.pekerjaan[0] || 'None',
                        date: `${dateTime.date} ${dateTime.time}`,
                        timestamp: dateTime.timestamp
                    })

                    factionGovData.Storage.balance += taxAmount
                    user.playerInventory.items.uang -= totalCost
        
                    db.users.update(m.sender, user)
                    saveFactionUsers(factionGovData)
                    db.save()

                    if (type === 'idcard') {
                        await handleIdCard(conn, m, db, m.sender)
                    } else if (type === 'nikah') {
                        await marriageLicense(conn, m, db, licenseType2, m.sender, user.playerStatus.perkawinan)
                    }
        
                    return

                } else if (isGovUser && isGovUser.duty) {
                    // Employee
                    const type = cmdArgs[1]?.toLowerCase()

                    if (!target || !type || !licenseTypes[type]) {
                        caption = `Gunakan: \`${prefix + command} ${cmd} [target] [nikah/idcard]\``
                        break
                    }

                    if (type === 'idcard') {
                        await handleIdCard(conn, m, db, target)
                    } else if (type === 'nikah') {
                        await marriageLicense(conn, m, db, target, userTarget.playerStatus.perkawinan)
                    }
        
                    return
                }
                break
            case 'info':
                if (!isGovUser) {
                    caption = 'Kamu bukan anggota Government States.'
                    break
                }

                let totalDutyHours = 0
                let totalDutyMinutes = 0

                if (isGovUser.dutyHistory) {
                    isGovUser.dutyHistory.forEach(duty => {
                        const match = duty.duration.match(/(\d+) jam (\d+) menit/)
                        if (match) {
                            totalDutyHours += parseInt(match[1])
                            totalDutyMinutes += parseInt(match[2])
                        }
                    })

                    totalDutyHours += Math.floor(totalDutyMinutes / 60)
                    totalDutyMinutes = totalDutyMinutes % 60
                }

                caption = `📑 *\`INFORMASI ANGGOTA GOVERNMENT\`*\n\n`
                caption += `• Nama: ${isGovUser.nama}\n`
                caption += `• Divisi: ${isGovUser.divisi}\n`
                caption += `• Status: ${isGovUser.duty ? 'Sedang Duty' : 'Tidak Duty'}\n`
                caption += `• Tanggal Bergabung: ${isGovUser.joinDate}\n`
                caption += `• Total Waktu Duty: ${totalDutyHours} jam ${totalDutyMinutes} menit\n`
                caption += `• Jumlah Duty: ${isGovUser.dutyHistory ? isGovUser.dutyHistory.length : 0} kali`
                break
            case 'announcement':
                if (!isGovUser) {
                    caption = 'Kamu bukan anggota Government States.'
                    break
                }

                if (!['Public Relations', 'Vice President', 'President'].includes(isGovUser.divisi)) {
                    caption = 'Kamu harus memiliki pangkat Public Relations atau lebih tinggi.'
                    break
                }

                if (!isGovUser.duty) {
                    caption = 'Kamu harus duty terlebih dahulu.'
                    break
                }

                const announcementText = cmdArgs.join(' ')

                if (!announcementText) {
                    caption = 'Mohon masukkan teks pengumuman.'
                    break
                }

                const announcement = `📢 *\`PENGUMUMAN RESMI GOVERNMENT STATES\`*\n\n${announcementText}\n\nDiumumkan oleh: ${isGovUser.nama} (${isGovUser.divisi})\nTanggal: ${dateTime.date} ${dateTime.time}`

                if (!factionGovData.Announcements) {
                    factionGovData.Announcements = []
                }

                factionGovData.Announcements.push({
                    text: announcementText,
                    by: isGovUser.nama,
                    role: isGovUser.divisi,
                    date: `${dateTime.date} ${dateTime.time}`
                })

                saveFactionUsers(factionGovData)

                await conn.sendMessage(idGrupBot, { text: announcement.trim() })
                return
            case 'stats':
                let permisi = false
                let iniPesan = ''

                if (staffData[m.sender]) {
                    if (userRankLevel < 3) {
                        iniPesan = 'Hanya High Staff ke atas yang dapat menggunakan perintah ini.'
                    } else {
                        permisi = true
                    }
                } else if (isGovUser) {
                    if (!['Vice President', 'President'].includes(isGovUser.divisi)) {
                        iniPesan = 'Hanya Presiden dan Wakil Presiden yang dapat menggunakan perintah ini.'
                    } else if (!isGovUser.duty) {
                        iniPesan = 'Kamu harus duty terlebih dahulu.'
                    } else {
                        permisi = true
                    }
                } else {
                    iniPesan = 'Kamu bukan anggota Government States.'
                }

                if (!permisi) {
                    caption = iniPesan
                    break
                }

                const totalMembers = factionGovData.Government.length
                const activeMembers = factionGovData.Government.filter(member => member.duty).length
                const rankDistribution = factionGovData.Government.reduce((acc, member) => {
                    acc[member.divisi] = (acc[member.divisi] || 0) + 1
                    return acc
                }, {})

                caption = `📊 *\`STATISTIK GOVERNMENT STATES\`*\n\n`
                caption += `• Total Anggota: ${totalMembers}\n`
                caption += `• Anggota Aktif: ${activeMembers}\n\n`
                caption += `*Distribusi Pangkat:*\n`

                Object.entries(rankDistribution).forEach(([rank, count]) => {
                    caption += `${rank}: ${count} orang\n`
                })
    
                break
            case 'kick':
                if (!target) {
                    caption = `Gunakan: \`${prefix + command} ${cmd} [target]\``
                    break
                }

                const kickIndex = factionGovData.Government.findIndex(member => member.id === target)
    
                if (kickIndex === -1) {
                    caption = 'Target tidak ditemukan dalam Government States.'
                    break
                }

                if (hasHighPrivilege(factionGovData.Government[kickIndex])) {
                    caption = 'Tidak dapat mengeluarkan Presiden atau Wakil Presiden.'
                    break
                }

                let hasPermission = false
                let iniMessage = ''

                if (isGovUser) {
                    if (!hasHighPrivilege(isGovUser)) {
                        iniMessage = 'Hanya Presiden dan Wakil Presiden yang dapat menggunakan perintah ini.'
                    } else if (!isGovUser.duty) {
                        iniMessage = 'Kamu harus duty terlebih dahulu.'
                    } else {
                        hasPermission = true
                    }
                } else if (staffData[m.sender]) {
                    if (userRankLevel < 4) {
                        iniMessage = 'Hanya Super Staff ke atas yang dapat menggunakan perintah ini.'
                    } else {
                        hasPermission = true
                    }
                } else {
                    iniMessage = 'Kamu bukan anggota Government States.'
                }

                if (!hasPermission) {
                    caption = iniMessage
                    break
                }

                factionGovData.Government.splice(kickIndex, 1)
                userTarget.playerStatus.pekerjaan = pekerjaan.filter(p => p !== 'Government States')
                
                db.users.update(target, pekerjaan)
                db.save()
                saveFactionUsers(factionGovData)
    
                caption = `${userTarget.playerInfo.namaLengkap} telah dikeluarkan dari Government States.`
                break
            case 'history':
                if (!isGovUser) {
                    caption = 'Kamu bukan anggota Government States.'
                    break
                }

                if (!isGovUser.dutyHistory || isGovUser.dutyHistory.length === 0) {
                    caption = 'Kamu belum memiliki riwayat duty.'
                    break
                }

                caption = `📜 *\`RIWAYAT DUTY GOVERNMENT\`*\n\n`

                const recentDuties = isGovUser.dutyHistory.slice(-5)
                recentDuties.forEach((duty, index) => {
                    caption += `${index + 1}. Mulai: ${duty.start}\n`
                    caption += `   Selesai: ${duty.end}\n`
                    caption += `   Durasi: ${duty.duration}\n\n`
                })

                caption += `Total Duty: ${isGovUser.dutyHistory.length} kali`
                break
            case 'payday':
                if (!isGovUser) {
                    caption = 'Kamu bukan anggota Government States.'
                    break
                }

                if (isGovUser.lastPayday && isGovUser.lastPayday === dateTime.date) {
                    caption = 'Kamu sudah mengklaim gaji hari ini.'
                    break
                }

                const rankSalary = {
                    'Internship': 1000,
                    'Civil Service': 2500,
                    'Tax Service': 3000,
                    'Document & Certificate': 2000,
                    'Public Relations': 4000,
                    'Vice President': 10000,
                    'President': 20000
                }

                const salary = rankSalary[isGovUser.divisi]

                if (!factionGovData.Storage) {
                    factionGovData.Storage = {
                        balance: 0,
                        transactions: []
                    }
                }

                if (!factionGovData.Storage || factionGovData.Storage.balance < salary) {
                    caption = 'Saldo di storage tidak mencukupi.'
                    break
                }

                factionGovData.Storage.transactions.push({
                    type: 'salary',
                    amount: salary,
                    by: isGovUser.nama,
                    role: isGovUser.divisi,
                    date: `${dateTime.date} ${dateTime.time}`,
                    timestamp: dateTime.timestamp
                })

                user.playerInventory.items.uang += salary

                db.users.update(m.sender, user)
                db.save()

                isGovUser.lastPayday = dateTime.date
                factionGovData.Storage.balance -= salary

                factionGovData.Government[isGovUserIndex] = isGovUser
                saveFactionUsers(factionGovData)

                caption = `Kamu telah menerima gaji hari ini sebesar $${salary}`
                break
            case 'taketax':
                if (!isGovUser) {
                    caption = 'Kamu bukan anggota Government States.'
                    break
                }

                if (!['Tax Service', 'Document & Certificate', 'Public Relations', 'Vice President', 'President'].includes(isGovUser.divisi)) {
                    caption = 'Kamu harus memiliki pangkat Tax Service atau lebih tinggi.'
                    break
                }

                if (!isGovUser.duty) {
                    caption = 'Kamu harus duty terlebih dahulu.'
                    break
                }

                const taxAmount = parseInt(cmdArgs[1])

                if (isNaN(taxAmount) || taxAmount <= 0 || !target) {
                    caption = `Gunakan: \`${ prefix + command } ${cmd} [target] [jumlah]\``
                    break
                }

                if (userTarget.playerInventory.items.uang < taxAmount) {
                    caption = 'Orang ini tidak memiliki cukup uang.'
                    break
                }

                userTarget.playerInventory.items.uang -= taxAmount
                
                db.users.update(target, userTarget)
                db.save()

                if (!factionGovData.Storage) {
                    factionGovData.Storage = {
                        balance: 0,
                        transactions: []
                    }
                }

                factionGovData.Storage.transactions.push({
                    type: 'tax bill',
                    amount: taxAmount,
                    by: isGovUser.nama,
                    role: isGovUser.divisi,
                    date: `${dateTime.date} ${dateTime.time}`,
                    timestamp: dateTime.timestamp
                })

                factionGovData.Storage.balance += taxAmount

                saveFactionUsers(factionGovData)

                caption = `Pajak sebesar $${taxAmount} telah berhasil dikumpulkan dari ${userTarget.playerInfo.namaLengkap}.`
                break
            case 'deposit':
                if (!isGovUser) {
                    caption = 'Kamu bukan anggota Government States.'
                    break
                }

                if (!isGovUser.duty) {
                    caption = 'Kamu harus duty terlebih dahulu untuk melakukan deposit.'
                    break
                }

                const depositAmount = parseInt(cmdArgs[0])

                if (isNaN(depositAmount) || depositAmount <= 0) {
                    caption = `Gunakan: \`${ prefix + command } ${cmd} [jumlah]\``
                    break
                }

                if (user.playerInventory.items.uang < depositAmount) {
                    caption = 'Uang kamu tidak cukup.'
                    break
                }

                if (!factionGovData.Storage) {
                    factionGovData.Storage = {
                        balance: 0,
                        transactions: []
                    }
                }

                user.playerInventory.items.uang -= depositAmount

                db.users.update(m.sender, user)
                db.save()

                factionGovData.Storage.balance += depositAmount

                factionGovData.Storage.transactions.push({
                    type: 'deposit',
                    amount: depositAmount,
                    by: isGovUser.nama,
                    role: isGovUser.divisi,
                    date: `${dateTime.date} ${dateTime.time}`,
                    timestamp: dateTime.timestamp
                })

                saveFactionUsers(factionGovData)

                caption = `Berhasil menyimpan $${depositAmount} uang ke dalam storage Government States.`
                break
            case 'withdraw':
                if (!isGovUser) {
                    caption = 'Kamu bukan anggota Government States.'
                    break
                }

                if (!hasHighPrivilege(isGovUser)) {
                    caption = 'Hanya Presiden dan Wakil Presiden yang dapat menarik uang dari storage.'
                    break
                }

                if (!isGovUser.duty) {
                    caption = 'Kamu harus duty terlebih dahulu untuk melakukan withdraw.'
                    break
                }

                const withdrawAmount = parseInt(cmdArgs[0])

                if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
                    caption = `Gunakan: \`${ prefix + command } ${cmd} [jumlah]\``
                    break
                }

                if (!factionGovData.Storage || factionGovData.Storage.balance < withdrawAmount) {
                    caption = 'Saldo di storage tidak mencukupi.'
                    break
                }

                user.playerInventory.items.uang += withdrawAmount

                db.users.update(m.sender, user)
                db.save()

                factionGovData.Storage.balance -= withdrawAmount

                factionGovData.Storage.transactions.push({
                    type: 'withdraw',
                    amount: withdrawAmount,
                    by: isGovUser.nama,
                    role: isGovUser.divisi,
                    date: `${dateTime.date} ${dateTime.time}`,
                    timestamp: dateTime.timestamp
                })

                saveFactionUsers(factionGovData)

                caption = `Berhasil menarik $${withdrawAmount} uang dari storage Government States.`
                break
            case 'storage':
                if (!isGovUser) {
                    caption = 'Kamu bukan anggota Government States.'
                    break
                }

                if (!isGovUser.duty) {
                    caption = 'Kamu harus duty terlebih dahulu untuk melihat storage.'
                    break
                }

                if (!factionGovData.Storage) {
                    factionGovData.Storage = {
                        balance: 0,
                        transactions: []
                    }
                }

                caption = `🏦 *\`GOVERNMENT STATES STORAGE\`*\n\n`
                caption += `Saldo: $${factionGovData.Storage.balance}\n\n`

                if (factionGovData.Storage.transactions && factionGovData.Storage.transactions.length > 0) {
                    caption += `*10 Transaksi Terakhir:*\n`

                    const latestTransactions = factionGovData.Storage.transactions
                        .slice(-10)
                        .reverse()

                    latestTransactions.forEach((tx, index) => {
                        let transactionType
                        switch (tx.type) {
                            case 'deposit':
                            case 'withdraw':
                            case 'new_business_and_license':
                            case 'renew_license':
                            case 'business_sold':
                            case 'business_ads':
                            case 'new_idcard':
                            case 'new_marriage':
                            case 'salary':
                            case 'tax_bill':
                            case 'passport':
                            case 'fine':
                                transactionType = tx.type;
                                break
                            default:
                                transactionType = 'unknown'
                        }
                        caption += `${index + 1}. ${transactionType}: $${tx.amount}\n`
                        caption += `   Oleh: ${tx.by} (${tx.role})\n`
                        caption += `   Tanggal: ${tx.date}\n`
                    })
                } else {
                    caption += `Belum ada transaksi.`
                }
                break
            case 'report':
                if (!isGovUser) {
                    caption = 'Kamu bukan anggota Government States.'
                    break
                }

                const reportDate = cmdArgs[0] || dateTime.date

                let dutyReports = []

                factionGovData.Government.forEach(member => {
                    if (member.dutyHistory) {
                        const dateDuties = member.dutyHistory.filter(duty => duty.start.includes(reportDate))
                        if (dateDuties.length > 0) {
                            dutyReports.push({
                                name: member.nama,
                                rank: member.divisi,
                                duties: dateDuties
                            })
                        }
                    }
                })

                if (dutyReports.length === 0) {
                    caption = `Tidak ada laporan duty untuk tanggal ${reportDate}.`
                    break
                }

                caption = `📊 *\`LAPORAN DUTY GOVERNMENT\`*\n`
                caption += `Tanggal: ${reportDate}\n\n`

                dutyReports.forEach((report, index) => {
                    caption += `${index + 1}. ${report.name} (${report.rank})\n`
                    report.duties.forEach(duty => {
                        caption += `• ${duty.start.split(' ')[1]} - ${duty.end.split(' ')[1]} (${duty.duration})\n`
                    })
                    caption += '\n'
                })
                break
            case 'help':
                caption = `🏛️ *\`DAFTAR PERINTAH\`*\n\n`

                caption += `*Contoh:* \`${prefix + command} list\`\n`
                caption += `*Prefix:* \`${prefix}\`\n\n`

                caption += `*Non-Employee Command:*\n`
                caption += `• \`${command} list\` - Lihat daftar anggota government yang sedang duty\n`
                caption += `• \`${command} license\` - Beli lisensi\n\n`

                if (isGovUser) {
                    caption += `*Basic Command:*\n`
                    caption += `• \`${command} duty\` - Mulai/akhiri duty\n`
                    caption += `• \`${command} info\` - Lihat informasi tentang diri Anda di Government\n`
                    caption += `• \`${command} history\` - Lihat riwayat duty Anda\n`
                    caption += `• \`${command} payday\` - Klaim gaji harian\n`
                    caption += `• \`${command} report\` - Buat laporan duty untuk tanggal tertentu\n\n`

                    caption += `*Storage Command:*\n`
                    caption += `• \`${command} deposit\` - Simpan uang ke storage Government\n`
                    caption += `• \`${command} storage\` - Lihat informasi storage Government\n\n`

                    if (['Document & Certificate', 'Public Relations', 'Vice President', 'President'].includes(isGovUser.divisi)) {
                        caption += `*License Command (Document & Certificate+):*\n`
                        caption += `• \`${command} license\` - Berikan lisensi\n\n`
                    }

                    if (['Tax Service', 'Document & Certificate', 'Public Relations', 'Vice President', 'President'].includes(isGovUser.divisi)) {
                        caption += `*Tax Command (Tax Service+):*\n`
                        caption += `• \`${command} taketax\` - Kumpulkan pajak\n\n`
                    }

                    if (['Public Relations', 'Vice President', 'President'].includes(isGovUser.divisi)) {
                        caption += `*Public Command (Public Relations+):*\n`
                        caption += `• \`${command} recruit\` - Rekrut anggota baru\n`
                        caption += `• \`${command} announcement\` - Buat pengumuman resmi\n\n`
                    }

                    if (['Vice President', 'President'].includes(isGovUser.divisi)) {
                        caption += `*Management Command (Vice President+):*\n`
                        caption += `• \`${command} setrank\` - Ubah pangkat anggota\n`
                        caption += `• \`${command} kick\` - Keluarkan anggota\n`
                        caption += `• \`${command} stats\` - Lihat statistik Government\n`
                        caption += `• \`${command} withdraw\` - Tarik uang dari storage Government\n\n`
                    }
                }

                if (staffData[m.sender] && userRankLevel > 2) {
                    caption += `*Staff Command (High Staff+):*\n`
                    caption += `• \`${command} kick\` - Keluarkan anggota\n`
                    caption += `• \`${command} stats\` - Lihat statistik Government\n\n`
                }
                if (staffData[m.sender] && userRankLevel > 3) {
                    caption += `*Staff Command (Super Staff+):*\n`
                    caption += `• \`${command} s-recruit\` - Rekrut anggota baru\n`
                    caption += `• \`${command} setrank\` [nomor rank 1-7] - Ubah pangkat anggota\n\n`
                }

                caption += `*Posisi Jabatan Government:*\n`
                caption += `1. Internship\n2. Civil Service\n3. Tax Service\n4. Document & Certificate\n5. Public Relations\n6. Vice President\n7. President`
                break
            default:
                if (isGovUser) {
                    caption = `Perintah tidak dikenali. Gunakan \`${ prefix + command } help\` untuk melihat daftar perintah.`
                } else {
                    caption = `Gunakan \`${ prefix + command } help\` untuk melihat daftar perintah.`
                }
        }
        conn.sendMessage(m.from, { text: caption.trim() })
    }
}