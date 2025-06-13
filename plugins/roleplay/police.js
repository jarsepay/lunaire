import { factionPoliceData, factionGovData, saveFactionUsers } from '../../lib/databases/faction.js'
import Police from '../../lib/databases/police.js'
import { getCurrentDateTime } from '../../lib/src/function.js'
import { staffData, rankHierarchy } from '../../lib/databases/staff.js'
import { idGrupBot, pajak } from '../../setting.js'

export const cmd = {
    name: ['police'],
    command: ['police'],
    category: ['roleplay'],
    detail: {
        desc: 'Fraksi Kepolisian.'
    },
    setting: {
        isRegister: true,
        isBanned: false,
        isJail: false
    },
    async start({ m, db, prefix, command, conn, text }) {
        const police = new Police()
        police.initializeFactionData()

        const isPoliceUserIndex = factionPoliceData.PoliceForce.findIndex(member => member.id === m.sender)
        const targetIndex = factionPoliceData.PoliceForce.findIndex(member => member.id === target)
        const isPoliceUser = isPoliceUserIndex !== -1 ? factionPoliceData.PoliceForce[isPoliceUserIndex] : null

        if (!text) return m.reply(`Gunakan ${prefix + command} help untuk melihat daftar perintah.`)

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
                const dutyOfficers = factionPoliceData.PoliceForce.filter(member => member.duty === true)

                if (dutyOfficers.length === 0) {
                    caption = 'Tidak ada petugas polisi yang sedang bertugas.'
                    break
                }

                caption = '🚔 *DAFTAR PETUGAS POLISI YANG SEDANG BERTUGAS*\n\n'
                dutyOfficers.forEach((member, index) => {
                    caption += `${index + 1}. ${member.nama} (${member.divisi})\n   Mulai bertugas: ${member.dutyStartTime}\n`
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
                    if (!isPoliceUser) {
                        caption = 'Kamu bukan anggota Police Department.'
                        break
                    }
                    if (!['Lieutenant', 'Captain', 'Chief of Police'].includes(isPoliceUser.divisi)) {
                        caption = 'Kamu harus memiliki pangkat Lieutenant atau lebih tinggi untuk merekrut anggota baru.'
                        break
                    }
                    if (!isPoliceUser.duty) {
                        caption = 'Kamu harus duty terlebih dahulu untuk merekrut anggota baru.'
                        break
                    }
                    permission = true
                    recruiterInfo = `${isPoliceUser.nama} (${isPoliceUser.divisi})`
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

                if (factionPoliceData.PoliceForce.findIndex(member => member.id === target) !== -1) {
                    caption = 'Orang ini sudah menjadi anggota Police Department.'
                    break
                }

                const newMember = {
                    id: target,
                    nama: userTarget.playerInfo.namaLengkap,
                    divisi: 'Cadet',
                    duty: false,
                    joinDate: dateTime.date,
                    dutyHistory: [],
                    arrestHistory: [],
                    patrolHistory: [],
                    recruitedBy: recruiterInfo,
                    commendations: 0
                }

                const newJob = [...pekerjaan, 'Police Department']
                userTarget.playerStatus.pekerjaan = newJob

                db.users.update(target, userTarget)
                db.save()

                factionPoliceData.PoliceForce.push(newMember)
                saveFactionUsers(factionPoliceData)

                try {
                    const recruiterType = isStaffRecruit ? `staff ${staffData[m.sender].name}` : recruiterInfo
                    conn.reply(target, `Selamat! Kamu telah direkrut ke dalam Police Department sebagai Cadet oleh ${recruiterType}.\n\nGunakan \`${prefix + command} help\` untuk menampilkan menu bantuan.`, null)
                } catch (err) {
                    console.log('Gagal mengirim pesan ke anggota tersebut:', err)
                }

                caption = `${userTarget.playerInfo.namaLengkap} telah berhasil direkrut ke dalam Police Department sebagai Cadet.`
                break
            case 'duty':
                if (!isPoliceUser) {
                    caption = 'Kamu bukan anggota Kepolisian.'
                    break
                }

                if (!isPoliceUser.duty) {
                    isPoliceUser.duty = true
                    isPoliceUser.dutyStartTime = `${dateTime.date} ${dateTime.time}`
                    isPoliceUser.dutyStartTimestamp = dateTime.timestamp

                    factionPoliceData.PoliceForce[isPoliceUserIndex] = isPoliceUser
                    saveFactionUsers(factionPoliceData)

                    caption = `Kamu telah memulai shift sebagai ${isPoliceUser.divisi} pada ${dateTime.date} pukul ${dateTime.time}.`
                } else {
                    isPoliceUser.duty = false
                    const shiftDuration = police.calculateShiftHours(isPoliceUser.dutyStartTimestamp, dateTime.timestamp)

                    if (!isPoliceUser.dutyHistory) isPoliceUser.dutyHistory = []
                    isPoliceUser.dutyHistory.push({
                        start: isPoliceUser.dutyStartTime,
                        end: `${dateTime.date} ${dateTime.time}`,
                        duration: shiftDuration
                    })

                    delete isPoliceUser.dutyStartTime
                    delete isPoliceUser.dutyStartTimestamp

                    factionPoliceData.PoliceForce[isPoliceUserIndex] = isPoliceUser
                    saveFactionUsers(factionPoliceData)

                    caption = `Kamu telah mengakhiri shift.\nDurasi shift: ${shiftDuration}`
                }
                break
            case 'arrest':
                if (!isPoliceUser) {
                    caption = 'Kamu bukan anggota Kepolisian.'
                    break
                }

                if (!['Officer', 'Senior Officer', 'Sergeant', 'Lieutenant', 'Captain', 'Chief of Police'].includes(isPoliceUser.divisi)) {
                    caption = 'Kamu harus memiliki pangkat Officer atau lebih tinggi untuk memenjara seseorang.'
                    break
                }

                if (!isPoliceUser.duty) {
                    caption = 'Kamu harus bertugas terlebih dahulu.'
                    break
                }

                if (!target || !cmdArgs[1]) {
                    caption = `Gunakan: \`${prefix + command} ${cmd} [target] [alasan]\`\n\nAlasan yang valid:\n• assault - Penyerangan\n• theft - Pencurian\n• vandalism - Vandalisme\n• drug_possession - Kepemilikan Narkoba\n• disturbing_peace - Mengganggu Ketertiban\n• trespassing - Masuk Tanpa Izin\n• fraud - Penipuan\n• weapon_possession - Kepemilikan Senjata\n• other - Lainnya`
                    break
                }

                if (userTarget.playerStatus.jail.status) {
                    caption = 'Orang ini sudah berada dalam penjara.'
                    break
                }

                const reason = cmdArgs[1].toLowerCase()

                if (!police.validateJailReason(reason)) {
                    caption = 'Alasan penangkapan tidak valid. Lihat daftar alasan yang tersedia dengan mengetik perintah tanpa parameter.'
                    break
                }

                const jailDuration = police.getJailDuration(reason)
                const releaseTime = dateTime.timestamp + jailDuration

                db.users.update(target, { 
                    playerStatus: { 
                        jail: { 
                            status: true, 
                            time: releaseTime
                        } 
                    } 
                })
                db.save()

                if (!isPoliceUser.arrestHistory) isPoliceUser.arrestHistory = []
                isPoliceUser.arrestHistory.push({
                    suspect: userTarget.playerInfo.namaLengkap,
                    suspectId: target,
                    reason: reason,
                    date: `${dateTime.date} ${dateTime.time}`,
                    duration: police.formatTimeRemaining(jailDuration)
                })

                factionPoliceData.JailRecords.push({
                    suspect: userTarget.playerInfo.namaLengkap,
                    suspectId: target,
                    reason: reason,
                    arrestedBy: isPoliceUser.nama,
                    arrestDate: `${dateTime.date} ${dateTime.time}`,
                    releaseTime: releaseTime,
                    status: 'imprisoned'
                })

                factionPoliceData.PoliceForce[isPoliceUserIndex] = isPoliceUser
                saveFactionUsers(factionPoliceData)

                try {
                    conn.reply(target, `Kamu telah ditangkap oleh ${isPoliceUser.nama} dengan alasan ${reason}.\nDurasi penahanan: ${police.formatTimeRemaining(jailDuration)}`, null)
                } catch (err) {
                    console.log('Gagal mengirim pesan ke tersangka:', err)
                }

                caption = `${userTarget.playerInfo.namaLengkap} telah berhasil ditangkap dengan alasan ${reason}.\nDurasi penahanan: ${police.formatTimeRemaining(jailDuration)}`
                break
            case 'release':
                if (!isPoliceUser) {
                    caption = 'Kamu bukan anggota Kepolisian.'
                    break
                }

                if (!['Sergeant', 'Lieutenant', 'Captain', 'Chief of Police'].includes(isPoliceUser.divisi)) {
                    caption = 'Kamu harus memiliki pangkat Sergeant atau lebih tinggi untuk membebaskan tahanan.'
                    break
                }

                if (!isPoliceUser.duty) {
                    caption = 'Kamu harus bertugas terlebih dahulu.'
                    break
                }

                if (!target) {
                    caption = `Gunakan: \`${prefix + command} ${cmd} [target]\``
                    break
                }

                if (!userTarget.playerStatus.jail.status) {
                    caption = 'Orang ini tidak sedang dalam penjara.'
                    break
                }

                db.users.update(target, { 
                    playerStatus: { 
                        jail: { 
                            status: false, 
                            time: 0
                        } 
                    } 
                })
                db.save()

                const jailRecordIndex = factionPoliceData.JailRecords.findIndex(record => 
                    record.suspectId === target && record.status === 'imprisoned'
                )

                if (jailRecordIndex !== -1) {
                    factionPoliceData.JailRecords[jailRecordIndex].status = 'released_early'
                    factionPoliceData.JailRecords[jailRecordIndex].releasedBy = isPoliceUser.nama
                    factionPoliceData.JailRecords[jailRecordIndex].releaseDate = `${dateTime.date} ${dateTime.time}`
                }

                saveFactionUsers(factionPoliceData)

                try {
                    conn.reply(target, `Kamu telah dibebaskan dari penjara oleh ${isPoliceUser.nama}.`, null)
                } catch (err) {
                    console.log('Gagal mengirim pesan ke tersangka:', err)
                }

                caption = `${userTarget.playerInfo.namaLengkap} telah dibebaskan dari penjara.`
                break
            case 'patrol':
                if (!isPoliceUser) {
                    caption = 'Kamu bukan anggota Kepolisian.'
                    break
                }

                if (!isPoliceUser.duty) {
                    caption = 'Kamu harus bertugas terlebih dahulu.'
                    break
                }

                const area = cmdArgs.join(' ') || 'City Center'

                if (!isPoliceUser.patrolHistory) isPoliceUser.patrolHistory = []
                isPoliceUser.patrolHistory.push({
                    area: area,
                    date: `${dateTime.date} ${dateTime.time}`,
                    officer: isPoliceUser.nama
                })

                factionPoliceData.PoliceForce[isPoliceUserIndex] = isPoliceUser
                saveFactionUsers(factionPoliceData)

                caption = `Kamu telah memulai patroli di area ${area}\nWaktu: ${dateTime.date} ${dateTime.time}`
                break
            case 'report':
                if (!isPoliceUser) {
                    caption = 'Kamu bukan anggota Kepolisian.'
                    break
                }

                if (!isPoliceUser.duty) {
                    caption = 'Kamu harus bertugas terlebih dahulu.'
                    break
                }

                const reportContent = cmdArgs.join(' ')

                if (!reportContent) {
                    caption = `Gunakan: \`${prefix + command} ${cmd} [isi laporan]\``
                    break
                }

                if (reportContent.length < 10) {
                    caption = 'Laporan terlalu pendek. Minimal 10 karakter.'
                    break
                }

                const reportId = `RPT_${Date.now()}_${Math.floor(Math.random() * 1000)}`

                factionPoliceData.PoliceReports.push({
                    id: reportId,
                    content: reportContent,
                    officer: isPoliceUser.nama,
                    rank: isPoliceUser.divisi,
                    date: `${dateTime.date} ${dateTime.time}`,
                    timestamp: dateTime.timestamp
                })

                saveFactionUsers(factionPoliceData)

                caption = `Laporan berhasil dibuat dengan ID ${reportId}\nIsi: ${reportContent}`
                break
            case 'wanted':
                if (!isPoliceUser) {
                    caption = 'Kamu bukan anggota Kepolisian.'
                    break
                }

                if (!['Lieutenant', 'Captain', 'Chief of Police'].includes(isPoliceUser.divisi)) {
                    caption = 'Kamu harus memiliki pangkat Lieutenant atau lebih tinggi.'
                    break
                }

                if (!isPoliceUser.duty) {
                    caption = 'Kamu harus bertugas terlebih dahulu.'
                    break
                }

                if (!target || !cmdArgs[1]) {
                    caption = `Gunakan: \`${prefix + command} ${cmd} [target] [alasan]\``
                    break
                }

                const wantedReason = cmdArgs.slice(1).join(' ')

                if (!factionPoliceData.WantedList) {
                    factionPoliceData.WantedList = []
                }

                const existingWanted = factionPoliceData.WantedList.findIndex(w => w.suspectId === target)
                
                if (existingWanted !== -1) {
                    caption = 'Orang ini sudah ada dalam daftar buronan.'
                    break
                }

                factionPoliceData.WantedList.push({
                    suspect: userTarget.playerInfo.namaLengkap,
                    suspectId: target,
                    reason: wantedReason,
                    issuedBy: isPoliceUser.nama,
                    issueDate: `${dateTime.date} ${dateTime.time}`,
                    status: 'active'
                })

                saveFactionUsers(factionPoliceData)

                const wantedAnnouncement = `🚨 *\`NEW WANTED!\`*\n\nNama: ${userTarget.playerInfo.namaLengkap}\nAlasan: ${wantedReason}\nDikeluarkan oleh: ${isPoliceUser.nama} (${isPoliceUser.divisi})\nTanggal: ${dateTime.date} ${dateTime.time}`

                await conn.sendMessage(idGrupBot, { text: wantedAnnouncement.trim() })
                return
            case 'setrank':
               const rankNumber = parseInt(cmdArgs[1])
    
                if (!target || isNaN(rankNumber) || rankNumber < 1 || rankNumber > 7) {
                    caption = `Gunakan: \`${prefix + command} ${cmd} [target] [nomor rank 1-7]\``
                    break
                }

               const setRankIndex = factionPoliceData.PoliceForce.findIndex(member => member.id === target)
    
                if (setRankIndex === -1) {
                    caption = 'Orang ini tidak ditemukan dalam Police Department.'
                    break
                }

                if (userTarget.playerStatus.jail.status) {
                    caption = 'Orang ini sedang dalam penjara'
                    break
                }

                let bolehGa = false
                let gaBolehKarena = ''

                if (isPoliceUser) {
                    if (!hasHighPrivilege(isPoliceUser)) {
                        gaBolehKarena = 'Hanya Captain dan Chief of Police yang dapat menggunakan perintah ini.'
                    } else if (!isPoliceUser.duty) {
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
                    gaBolehKarena = 'Kamu bukan anggota Police Department.'
                }

                if (!bolehGa) {
                    caption = gaBolehKarena
                    break
                }

                const oldRank = factionPoliceData.PoliceForce[setRankIndex].divisi
                const newRank = getRankName(rankNumber)
    
                factionPoliceData.PoliceForce[setRankIndex].divisi = newRank
                saveFactionUsers(factionPoliceData)
    
                caption = `Jabatan ${factionPoliceData.PoliceForce[setRankIndex].nama} telah diubah dari ${oldRank} menjadi ${newRank}.`
                break
            case 'payday':
                if (!isPoliceUser) {
                    caption = 'Kamu bukan anggota Kepolisian.'
                    break
                }

                if (isPoliceUser.lastPayday && isPoliceUser.lastPayday === dateTime.date) {
                    caption = 'Kamu sudah mengklaim gaji hari ini.'
                    break
                }

                const rankSalary = {
                    'Cadet': 800,
                    'Officer': 1200,
                    'Senior Officer': 2000,
                    'Sergeant': 3400,
                    'Lieutenant': 4800,
                    'Captain': 7000,
                    'Chief of Police': 12000
                }

                const salary = rankSalary[isPoliceUser.divisi]

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
                    by: isPoliceUser.nama,
                    role: isPoliceUser.divisi,
                    date: `${dateTime.date} ${dateTime.time}`,
                    timestamp: dateTime.timestamp
                })

                user.playerInventory.items.uang += salary

                db.users.update(m.sender, user)
                db.save()

                factionGovData.Storage.balance -= salary
                saveFactionUsers(factionGovData)

                isPoliceUser.lastPayday = dateTime.date

                factionPoliceData.PoliceForce[isPoliceUserIndex] = isPoliceUser
                saveFactionUsers(factionPoliceData)

                caption = `Kamu telah menerima gaji hari ini sebesar $${salary}`
                break
            case 'kick':
                if (!target) {
                    caption = `Gunakan: \`${prefix + command} ${cmd} [target]\``
                    break
                }

                const kickIndex = factionPoliceData.PoliceForce.findIndex(member => member.id === target)
    
                if (kickIndex === -1) {
                    caption = 'Target tidak ditemukan dalam Police Department.'
                    break
                }

                if (hasHighPrivilege(factionPoliceData.PoliceForce[kickIndex])) {
                    caption = 'Tidak dapat mengeluarkan Captain dan Chief of Police.'
                    break
                }

                let hasPermission = false
                let iniMessage = ''

                if (isPoliceUser) {
                    if (!hasHighPrivilege(isPoliceUser)) {
                        iniMessage = 'Hanya Captain dan Chief of Police yang dapat menggunakan perintah ini.'
                    } else if (!isPoliceUser.duty) {
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
                    iniMessage = 'Kamu bukan anggota Police Department.'
                }

                if (!hasPermission) {
                    caption = iniMessage
                    break
                }

                factionPoliceData.PoliceForce.splice(kickIndex, 1)
                userTarget.playerStatus.pekerjaan = pekerjaan.filter(p => p !== 'Police Department')
                
                db.users.update(target, pekerjaan)
                db.save()
                saveFactionUsers(factionPoliceData)
    
                caption = `${userTarget.playerInfo.namaLengkap} telah dikeluarkan dari Police Department.`
                break
            case 'history':
                if (!isPoliceUser) {
                    caption = 'Kamu bukan anggota Kepolisian.'
                    break
                }

                if (!isPoliceUser.dutyHistory || isPoliceUser.dutyHistory.length === 0) {
                    caption = 'Kamu belum memiliki riwayat shift.'
                    break
                }

                caption = `🚔 *\`RIWAYAT SHIFT ${isPoliceUser.nama}\`*\n\n`

                isPoliceUser.dutyHistory.slice(-10).forEach((duty, index) => {
                    caption += `${index + 1}. Mulai: ${duty.start}\n   Selesai: ${duty.end}\n   Durasi: ${duty.duration}\n\n`
                })
                break
            case 'arrests':
                if (!isPoliceUser) {
                    caption = 'Kamu bukan anggota Kepolisian.'
                    break
                }

                if (!isPoliceUser.arrestHistory || isPoliceUser.arrestHistory.length === 0) {
                    caption = 'Kamu belum memiliki riwayat penangkapan.'
                    break
                }

                caption = `🚔 *\`RIWAYAT PENANGKAPAN ${isPoliceUser.nama}\`*\n\n`

                isPoliceUser.arrestHistory.slice(-10).forEach((arrest, index) => {
                    caption += `${index + 1}. Tersangka: ${arrest.suspect}\n   Alasan: ${arrest.reason}\n   Tanggal: ${arrest.date}\n   Durasi: ${arrest.duration}\n\n`
                })
                break
            case 'jaillist':
                if (!isPoliceUser) {
                    caption = 'Kamu bukan anggota Kepolisian.'
                    break
                }

                const currentPrisoners = factionPoliceData.JailRecords.filter(record => 
                    record.status === 'imprisoned' && record.releaseTime > dateTime.timestamp
                )

                if (currentPrisoners.length === 0) {
                    caption = 'Tidak ada tahanan saat ini.'
                    break
                }

                caption = '🔒 *\`DAFTAR TAHANAN SAAT INI\`*\n\n'
                currentPrisoners.forEach((prisoner, index) => {
                    const timeLeft = police.formatTimeRemaining(prisoner.releaseTime - dateTime.timestamp)
                    caption += `${index + 1}. ${prisoner.suspect}\n   Alasan: ${prisoner.reason}\n   Ditangkap oleh: ${prisoner.arrestedBy}\n   Tanggal: ${prisoner.arrestDate}\n   Sisa waktu: ${timeLeft}\n\n`
                })
                break
            case 'wantedlist':
                if (!isPoliceUser) {
                    caption = 'Kamu bukan anggota Kepolisian.'
                    break
                }

                if (!factionPoliceData.WantedList || factionPoliceData.WantedList.length === 0) {
                    caption = 'Tidak ada buronan saat ini.'
                    break
                }

                const activeWanted = factionPoliceData.WantedList.filter(w => w.status === 'active')

                if (activeWanted.length === 0) {
                    caption = 'Tidak ada buronan aktif saat ini.'
                    break
                }

                caption = '🚨 *\`DAFTAR BURONAN AKTIF\`*\n\n'
                activeWanted.forEach((wanted, index) => {
                    caption += `${index + 1}. ${wanted.suspect}\n   Alasan: ${wanted.reason}\n   Dikeluarkan oleh: ${wanted.issuedBy}\n   Tanggal: ${wanted.issueDate}\n\n`
                })
                break
            case 'clearwanted':
                if (!isPoliceUser) {
                    caption = 'Kamu bukan anggota Kepolisian.'
                    break
                }

                if (!['Lieutenant', 'Captain', 'Chief of Police'].includes(isPoliceUser.divisi)) {
                    caption = 'Kamu harus memiliki pangkat Lieutenant atau lebih tinggi.'
                    break
                }

                if (!isPoliceUser.duty) {
                    caption = 'Kamu harus bertugas terlebih dahulu.'
                    break
                }

                if (!target) {
                    caption = `Gunakan: \`${prefix + command} ${cmd} [target]\``
                    break
                }

                if (!factionPoliceData.WantedList) {
                    factionPoliceData.WantedList = []
                }

                const wantedIndex = factionPoliceData.WantedList.findIndex(w => w.suspectId === target && w.status === 'active')
                
                if (wantedIndex === -1) {
                    caption = 'Orang ini tidak ada dalam daftar buronan aktif.'
                    break
                }

                factionPoliceData.WantedList[wantedIndex].status = 'cleared'
                factionPoliceData.WantedList[wantedIndex].clearedBy = isPoliceUser.nama
                factionPoliceData.WantedList[wantedIndex].clearDate = `${dateTime.date} ${dateTime.time}`

                saveFactionUsers(factionPoliceData)

                caption = `${userTarget.playerInfo.namaLengkap} telah dihapus dari daftar buronan.`
                break
            case 'fine':
                if (!isPoliceUser) {
                    caption = 'Kamu bukan anggota Kepolisian.'
                    break
                }

                if (!isPoliceUser.duty) {
                    caption = 'Kamu harus bertugas terlebih dahulu.'
                    break
                }

                const fineAmount = parseInt(cmdArgs[1])
                const fineReason = cmdArgs.slice(2).join(' ')

                if (!target || isNaN(fineAmount) || !fineReason) {
                    caption = `Gunakan: \`${prefix + command} ${cmd} [target] [jumlah] [alasan]\``
                    break
                }

                if (fineAmount < 100 || fineAmount > 50000) {
                    caption = 'Jumlah denda harus antara $100 - $50,000.'
                    break
                }

                if (userTarget.playerInventory.items.uang < fineAmount) {
                    caption = 'Target tidak memiliki uang yang cukup untuk membayar denda.'
                    break
                }

                db.users.update(target, {
                    playerInventory: {
                        items: {
                            uang: userTarget.playerInventory.items.uang - fineAmount
                        }
                    }
                })

                if (!factionGovData.Storage) {
                    factionGovData.Storage = {
                        balance: 0,
                        transactions: []
                    }
                }

                factionGovData.Storage.balance += fineAmount
                factionGovData.Storage.transactions.push({
                    type: 'fine',
                    amount: fineAmount,
                    from: userTarget.playerInfo.namaLengkap,
                    by: isPoliceUser.nama,
                    reason: fineReason,
                    date: `${dateTime.date} ${dateTime.time}`,
                    timestamp: dateTime.timestamp
                })

                saveFactionUsers(factionGovData)
                db.save()

                if (!isPoliceUser.fineHistory) isPoliceUser.fineHistory = []
                isPoliceUser.fineHistory.push({
                    target: userTarget.playerInfo.namaLengkap,
                    targetId: target,
                    amount: fineAmount,
                    reason: fineReason,
                    date: `${dateTime.date} ${dateTime.time}`
                })

                factionPoliceData.PoliceForce[isPoliceUserIndex] = isPoliceUser
                saveFactionUsers(factionPoliceData)

                try {
                    conn.reply(target, `Kamu telah didenda sebesar $${fineAmount} oleh ${isPoliceUser.nama} dengan alasan ${fineReason}`, null)
                } catch (err) {
                    console.log('Gagal mengirim pesan ke target:', err)
                }

                caption = `${userTarget.playerInfo.namaLengkap} telah didenda sebesar $${fineAmount} dengan alasan ${fineReason}`
                break
            case 'stats':
                if (!isPoliceUser) {
                    caption = 'Kamu bukan anggota Kepolisian.'
                    break
                }

                const totalShifts = isPoliceUser.dutyHistory ? isPoliceUser.dutyHistory.length : 0
                const totalArrests = isPoliceUser.arrestHistory ? isPoliceUser.arrestHistory.length : 0
                const totalPatrols = isPoliceUser.patrolHistory ? isPoliceUser.patrolHistory.length : 0
                const totalFines = isPoliceUser.fineHistory ? isPoliceUser.fineHistory.length : 0
                const commendations = isPoliceUser.commendations || 0

                caption = `👮‍♂️ *\`STATISTIK ${isPoliceUser.nama}\`*\n\n`
                caption += `Pangkat: ${isPoliceUser.divisi}\n`
                caption += `Bergabung: ${isPoliceUser.joinDate}\n`
                caption += `Status: ${isPoliceUser.duty ? 'Bertugas' : 'Tidak Bertugas'}\n\n`
                caption += `📊 *STATISTIK KINERJA:*\n`
                caption += `• Total Shift: ${totalShifts}\n`
                caption += `• Total Penangkapan: ${totalArrests}\n`
                caption += `• Total Patroli: ${totalPatrols}\n`
                caption += `• Total Denda: ${totalFines}\n`
                caption += `• Penghargaan: ${commendations}`
                break
            case 'quit':
                if (!isPoliceUser) {
                    caption = 'Kamu bukan anggota Kepolisian.'
                    break
                }

                if (isPoliceUser.duty) {
                    caption = 'Kamu harus mengakhiri shift terlebih dahulu sebelum keluar dari kepolisian.'
                    break
                }

                const quitIndex = factionPoliceData.PoliceForce.findIndex(member => member.id === m.sender)

                if (quitIndex !== -1) {
                    factionPoliceData.PoliceForce.splice(quitIndex, 1)
                }

                user.playerStatus.pekerjaan = user.playerStatus.pekerjaan.filter(p => p !== 'Police Department')
                
                db.users.update(target, user.playerStatus.pekerjaan)
                db.save()

                saveFactionUsers(factionPoliceData)

                caption = `Kamu telah keluar dari kepolisian. Terima kasih atas pengabdianmu, ${isPoliceUser.nama}.`
                break
            case 'help':
                caption = `🚔 *\`DAFTAR PERINTAH\`*\n\n`

                caption += `*Contoh:* \`${prefix + command} list\`\n`
                caption += `*Prefix:* \`${prefix}\`\n\n`

                caption += `*Non-Employee Command:*\n`
                caption += `• \`${command} list\` - Lihat petugas yang sedang bertugas\n`
                caption += `• \`${command} jaillist\` - Lihat daftar tahanan saat ini\n`
                caption += `• \`${command} wantedlist\` - Lihat daftar buronan aktif\n\n`

                if (isPoliceUser) {
                    caption += `*Basic Command:*\n`
                    caption += `• \`${command} duty\` - Mulai/akhiri shift\n`
                    caption += `• \`${command} patrol\` - Patroli area tertentu\n`
                    caption += `• \`${command} report\` - Buat laporan kepolisian\n`
                    caption += `• \`${command} stats\` - Lihat statistik pribadi\n`
                    caption += `• \`${command} history\` - Lihat riwayat shift\n`
                    caption += `• \`${command} arrests\` - Lihat riwayat penangkapan\n`
                    caption += `• \`${command} payday\` - Klaim gaji harian\n`
                    caption += `• \`${command} quit\` - Keluar dari kepolisian\n\n`

                    if (['Officer', 'Senior Officer', 'Sergeant', 'Lieutenant', 'Captain', 'Chief of Police'].includes(isPoliceUser.divisi)) {
                        caption += `*Field Command (Officer+, Requires Duty):*\n`
                        caption += `• \`${command} arrest\` - Tangkap tersangka\n`
                        caption += `• \`${command} fine\` - Berikan denda\n\n`
                    }

                    if (['Sergeant', 'Lieutenant', 'Captain', 'Chief of Police'].includes(isPoliceUser.divisi)) {
                        caption += `*Detention Command (Sergeant+):*\n`
                        caption += `• \`${command} release\` - Bebaskan tahanan\n\n`
                    }

                    if (['Lieutenant', 'Captain', 'Chief of Police'].includes(isPoliceUser.divisi)) {
                        caption += `*Warrant Command (Lieutenant+):*\n`
                        caption += `• \`${command} recruit\` - Rekrut anggota baru\n`
                        caption += `• \`${command} wanted\` - Tambah ke daftar buronan\n`
                        caption += `• \`${command} clearwanted\` - Hapus dari daftar buronan\n\n`
                    }

                    if (['Captain', 'Chief of Police'].includes(isPoliceUser.divisi)) {
                        caption += `*Management Command (Captain+):*\n`
                        caption += `• \`${command} setrank\` - Ubah pangkat anggota\n`
                        caption += `• \`${command} kick\` - Keluarkan anggota\n`
                    }
                }

                if (staffData && staffData[m.sender] && userRankLevel > 2) {
                    caption += `*Staff Command (High Staff+):*\n`
                    caption += `• \`${command} s-recruit\` - Rekrut anggota baru\n`
                    caption += `• \`${command} kick\` - Keluarkan anggota\n\n`
                }

                if (staffData && staffData[m.sender] && userRankLevel > 3) {
                    caption += `*Staff Command (Super Staff+):*\n`
                    caption += `• \`${command} setrank\` - Ubah pangkat anggota\n\n`
                }

                caption += `*Posisi Jabatan Police Department:*\n`
                caption += `1. Cadet\n2. Officer\n3. Senior Officer\n4. Sergeant\n5. Lieutenant\n6. Captain\n7. Chief of Police\n\n`

                caption += `*Arrest Reasons:*\n`
                caption += `• assault - Penyerangan (30 min)\n`
                caption += `• theft - Pencurian (45 min)\n`
                caption += `• vandalism - Vandalisme (20 min)\n`
                caption += `• drug_possession - Kepemilikan Narkoba (60 min)\n`
                caption += `• disturbing_peace - Mengganggu Ketertiban (15 min)\n`
                caption += `• trespassing - Masuk Tanpa Izin (20 min)\n`
                caption += `• fraud - Penipuan (90 min)\n`
                caption += `• weapon_possession - Kepemilikan Senjata (120 min)\n`
                caption += `• other - Lainnya (30 min)`
                break
            default:
                caption = `Perintah tidak dikenal. Gunakan: \`${prefix + command} help\` untuk melihat daftar perintah.`
        }
        conn.sendMessage(m.from, { text: caption.trim() })
    }
}