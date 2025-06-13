import {
    factionNewsData,
    factionGovData,
    calculateDutyHours,
    saveFactionUsers
} from '../../lib/databases/faction.js'
import {
    getRankName,
    hasHighPrivilege,
    validateAdsCategory,
    formatTimeRemaining
} from '../../lib/databases/news.js'
import { getCurrentDateTime } from '../../lib/src/function.js'
import { staffData, rankHierarchy } from '../../lib/databases/staff.js'
import { idGrupBot, pajak } from '../../setting.js'

export const cmd = {
    name: ['news'],
    command: ['news'],
    category: ['roleplay'],
    detail: {
        desc: 'Fraksi Pembawa Berita.'
    },
    setting: {
        isRegister: true,
        isBanned: false,
        isJail: false
    },
    async start({ m, db, prefix, command, conn, text }) {

        conn.newsAds = conn.newsAds ? conn.newsAds : {}

        if (!factionGovData.Government) {
            factionGovData.Government = []
        }

        if (!factionNewsData.NewsNetwork) {
            factionNewsData.NewsNetwork = []
        }

        const isNewsUserIndex = factionNewsData.NewsNetwork.findIndex(member => member.id === m.sender)
        const isNewsUser = isNewsUserIndex !== -1 ? factionNewsData.NewsNetwork[isNewsUserIndex] : null

        if (!text) return m.reply(`Gunakan ${ prefix + command } help untuk melihat daftar perintah.`)

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
                if (conn.newsAds && Object.keys(conn.newsAds).length > 0) {
                    caption = '📰 *\`DAFTAR IKLAN AKTIF\`*\n\n'
                    let index = 1

                    for (const adId in conn.newsAds) {
                        const ad = conn.newsAds[adId]
                        caption += `${index}. [${ad.category.toUpperCase()}] ${ad.message}\n`
                        caption += `   • Kontak: ${ad.contactName} (${ad.contactNumber})\n`
                        caption += `   • Berakhir: ${formatTimeRemaining(ad.expiry - Date.now())}\n\n`
                        index++
                    }
                } else {
                    const dutyMembers = factionNewsData.NewsNetwork.filter(member => member.duty === true)

                    if (dutyMembers.length === 0) {
                        caption = 'Tidak ada anggota News Network yang sedang bertugas.'
                        break
                    }

                    caption = '📰 *\`DAFTAR STAFF NEWS NETWORK YANG SEDANG BERTUGAS\`*\n\n'
                    dutyMembers.forEach((member, index) => {
                        caption += `${index + 1}. ${member.nama} (${member.divisi})\n   Mulai bertugas: ${member.dutyStartTime}\n`
                    })
                }
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
                    if (!isNewsUser) {
                        caption = 'Kamu bukan anggota News Network.'
                        break
                    }
                    if (!['News Anchor', 'News Director', 'Network CEO'].includes(isNewsUser.divisi)) {
                        caption = 'Kamu harus memiliki pangkat News Anchor atau lebih tinggi untuk merekrut anggota baru.'
                        break
                    }
                    if (!isNewsUser.duty) {
                        caption = 'Kamu harus duty terlebih dahulu untuk merekrut anggota baru.'
                        break
                    }
                    permission = true
                    recruiterInfo = `${isNewsUser.nama} (${isNewsUser.divisi})`
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

                if (factionNewsData.NewsNetwork.findIndex(member => member.id === target) !== -1) {
                    caption = 'Orang ini sudah menjadi anggota News Network.'
                    break
                }

                const newMember = {
                    id: target,
                    nama: userTarget.playerInfo.namaLengkap,
                    divisi: 'Intern',
                    duty: false,
                    joinDate: dateTime.date,
                    dutyHistory: [],
                    storiesPublished: [],
                    recruitedBy: recruiterInfo,
                    hasAdsAccess: false
                }

                const newJob = [...pekerjaan, 'News Network']
                userTarget.playerStatus.pekerjaan = newJob

                db.users.update(target, userTarget)
                db.save()

                factionNewsData.NewsNetwork.push(newMember)
                saveFactionUsers(factionNewsData)

                try {
                    const recruiterType = isStaffRecruit ? `staff ${staffData[m.sender].name}` : recruiterInfo
                    conn.reply(target, `Selamat! Kamu telah direkrut ke dalam News Network sebagai Intern oleh ${recruiterType}.\n\nGunakan \`${prefix + command} help\` untuk menampilkan menu bantuan.`, null)
                } catch (err) {
                    console.log('Gagal mengirim pesan ke anggota tersebut:', err)
                }

                caption = `${userTarget.playerInfo.namaLengkap} telah berhasil direkrut ke dalam News Network sebagai Intern.`
                break
            case 'duty':
                if (!isNewsUser) {
                    caption = 'Kamu bukan anggota News Network.'
                    break
                }

                if (!isNewsUser.duty) {
                    isNewsUser.duty = true
                    isNewsUser.dutyStartTime = `${dateTime.date} ${dateTime.time}`
                    isNewsUser.dutyStartTimestamp = dateTime.timestamp

                    factionNewsData.NewsNetwork[isNewsUserIndex] = isNewsUser
                    saveFactionUsers(factionNewsData)

                    caption = `Kamu telah memulai shift sebagai ${isNewsUser.divisi} pada ${dateTime.date} pukul ${dateTime.time}.`
                } else {
                    isNewsUser.duty = false
                    const shiftDuration = calculateDutyHours(isNewsUser.dutyStartTimestamp, dateTime.timestamp)

                    if (!isNewsUser.dutyHistory) isNewsUser.dutyHistory = []
                    isNewsUser.dutyHistory.push({
                        start: isNewsUser.dutyStartTime,
                        end: `${dateTime.date} ${dateTime.time}`,
                        duration: shiftDuration
                    })

                    delete isNewsUser.dutyStartTime
                    delete isNewsUser.dutyStartTimestamp

                    factionNewsData.NewsNetwork[isNewsUserIndex] = isNewsUser
                    saveFactionUsers(factionNewsData)

                    caption = `Kamu telah mengakhiri shift.\nDurasi shift: ${shiftDuration}`
                }
                break
            case 'setrank':
               const rankNumber = parseInt(cmdArgs[1])
    
                if (!target || isNaN(rankNumber) || rankNumber < 1 || rankNumber > 7) {
                    caption = `Gunakan: \`${prefix + command} ${cmd} [target] [nomor rank 1-7]\``
                    break
                }

               const setRankIndex = factionNewsData.NewsNetwork.findIndex(member => member.id === target)
    
                if (setRankIndex === -1) {
                    caption = 'Orang ini tidak ditemukan dalam News Network.'
                    break
                }

                if (userTarget.playerStatus.jail.status) {
                    caption = 'Orang ini sedang dalam penjara'
                    break
                }

                let bolehGa = false
                let gaBolehKarena = ''

                if (isNewsUser) {
                    if (!hasHighPrivilege(isNewsUser)) {
                        gaBolehKarena = 'Hanya News Director dan Network CEO yang dapat menggunakan perintah ini.'
                    } else if (!isNewsUser.duty) {
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
                    gaBolehKarena = 'Kamu bukan anggota News Network.'
                }

                if (!bolehGa) {
                    caption = gaBolehKarena
                    break
                }

                const oldRank = factionNewsData.NewsNetwork[setRankIndex].divisi
                const newRank = getRankName(rankNumber)
    
                factionNewsData.NewsNetwork[setRankIndex].divisi = newRank
                saveFactionUsers(factionNewsData)
    
                caption = `Jabatan ${factionNewsData.NewsNetwork[setRankIndex].nama} telah diubah dari ${oldRank} menjadi ${newRank}.`
                break
            case 'payday':
                if (!isNewsUser) {
                    caption = 'Kamu bukan anggota News Network.'
                    break
                }

                if (isNewsUser.lastPayday && isNewsUser.lastPayday === dateTime.date) {
                    caption = 'Kamu sudah mengklaim gaji hari ini.'
                    break
                }

                const rankSalary = {
                    'Intern': 500,
                    'Reporter': 800,
                    'Senior Reporter': 1400,
                    'Editor': 2000,
                    'News Anchor': 4500,
                    'News Director': 7000,
                    'Network CEO': 10000
                }

                const salary = rankSalary[isNewsUser.divisi]

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
                    by: isNewsUser.nama,
                    role: isNewsUser.divisi,
                    date: `${dateTime.date} ${dateTime.time}`,
                    timestamp: dateTime.timestamp
                })

                user.playerInventory.items.uang += salary

                db.users.update(m.sender, user)
                db.save()

                factionGovData.Storage.balance -= salary
                saveFactionUsers(factionGovData)

                isNewsUser.lastPayday = dateTime.date

                factionNewsData.NewsNetwork[isNewsUserIndex] = isNewsUser
                saveFactionUsers(factionNewsData)

                caption = `Kamu telah menerima gaji hari ini sebesar $${salary}`
                break
            case 'publish':
                if (!isNewsUser) {
                    caption = 'Kamu bukan anggota News Network.'
                    break
                }

                if (!['Reporter', 'Senior Reporter', 'Editor', 'News Anchor', 'News Director', 'Network CEO'].includes(isNewsUser.divisi)) {
                    caption = 'Kamu harus memiliki pangkat Reporter atau lebih tinggi.'
                    break
                }

                if (!isNewsUser.duty) {
                    caption = 'Kamu harus bertugas terlebih dahulu.'
                    break
                }

                const headline = cmdArgs.join(' ')

                if (!headline) {
                    caption = `Gunakan: \`${ prefix + command } ${cmd} [headline berita]\``
                    break
                }

                if (headline.length < 5) {
                    caption = 'Headline berita terlalu pendek.'
                    break
                }

                if (!isNewsUser.storiesPublished) isNewsUser.storiesPublished = []
                isNewsUser.storiesPublished.push({
                    type: 'News Story',
                    headline: headline,
                    date: `${dateTime.date} ${dateTime.time}`
                })

                factionNewsData.NewsNetwork[isNewsUserIndex] = isNewsUser
                saveFactionUsers(factionNewsData)

                const announcement = `📢 *\`BREAKING NEWS!\`*\n\n${headline}\n\n_*Reporter:* ${isNewsUser.nama} (${isNewsUser.divisi})\n*Waktu:* ${dateTime.date} ${dateTime.time}_`

                await conn.sendMessage(idGrupBot, { text: announcement.trim() })
                return
            case 'ads':
                if (cmdArgs[0] && cmdArgs[0].includes('@')) {
                    if (!isNewsUser) {
                        caption = 'Kamu bukan anggota News Network.'
                        break
                    }

                    if (!['News Director', 'Network CEO'].includes(isNewsUser.divisi)) {
                        caption = 'Kamu harus memiliki pangkat News Director atau lebih tinggi.'
                        break
                    }

                    if (!isNewsUser.duty) {
                        caption = 'Kamu harus bertugas terlebih dahulu.'
                        break
                    }

                    const adsIndex = factionNewsData.NewsNetwork.findIndex(member => member.id === target)
                    if (adsIndex === -1) {
                        caption = 'Orang ini tidak ditemukan dalam News Network.'
                        break
                    }

                    if (userTarget.playerStatus.jail.status) {
                        caption = 'Orang ini sedang dalam penjara'
                        break
                    }

                    factionNewsData.NewsNetwork[adsIndex].hasAdsAccess = true
                    saveFactionUsers(factionNewsData)

                    caption = `${factionNewsData.NewsNetwork[adsIndex].nama} telah diberikan akses untuk mengelola iklan.`
                    break
                }

                const adsCategory = cmdArgs[0]?.toLowerCase()
                const adsMessage = cmdArgs.slice(1).join(' ')

                if (!adsCategory || !validateAdsCategory(adsCategory) || !adsMessage) {
                    caption = `Gunakan: \`${ prefix + command } ${cmd} [sell/buy/trade] [pesan iklan]\``
                    break
                }

                const adIds = `ad_${Date.now()}_${Math.floor(Math.random() * 1000)}`
                conn.pendingAds = conn.pendingAds || {}
                conn.pendingAds[adIds] = {
                    id: adIds,
                    sender: m.sender,
                    category: adsCategory,
                    message: adsMessage,
                    contactName: user.playerInfo.namaLengkap,
                    contactNumber: m.sender.split('@')[0],
                    timestamp: dateTime.timestamp
                }

                caption = `Iklan telah disiapkan untuk direview.\nKategori: ${adsCategory.toUpperCase()}\nPesan: ${adsMessage}`
                break
            case 'acc':
                if (!isNewsUser) {
                    caption = 'Kamu bukan anggota News Network.'
                    break
                }

                if (!isNewsUser.hasAdsAccess) {
                    caption = 'Kamu tidak memiliki akses untuk mengelola iklan.'
                    break
                }

                if (!isNewsUser.duty) {
                    caption = 'Kamu harus bertugas terlebih dahulu.'
                    break
                }

                const adId = cmdArgs[0]

                if (!adId || !conn.pendingAds || !conn.pendingAds[adId]) {
                    caption = `Gunakan: \`${ prefix + command } ${cmd} [id iklan]\``
                    break
                }

                const pendingAd = conn.pendingAds[adId]

                const expiry = Date.now() + (24 * 60 * 60 * 1000)
                conn.newsAds = conn.newsAds || {}
                conn.newsAds[adId] = {
                    ...pendingAd,
                    approved: true,
                    approvedBy: isNewsUser.id,
                    approvedByName: isNewsUser.nama,
                    approvedAt: dateTime.timestamp,
                    expiry: expiry
                }

                delete conn.pendingAds[adId]

                setTimeout(() => {
                    if (conn.newsAds && conn.newsAds[adId]) {
                        delete conn.newsAds[adId]
                    }
                }, 24 * 60 * 60 * 1000)

                if (!isNewsUser.storiesPublished) isNewsUser.storiesPublished = []
                isNewsUser.storiesPublished.push({
                    type: 'Advertisement',
                    category: pendingAd.category,
                    message: pendingAd.message,
                    date: `${dateTime.date} ${dateTime.time}`
                })

                factionNewsData.NewsNetwork[isNewsUserIndex] = isNewsUser
                saveFactionUsers(factionNewsData)

                const newAds = `📢 *\`NEW ADVERTISEMENT\`*\n\n[${pendingAd.category.toUpperCase()}] ${pendingAd.message}\n\n👤 Contact: ${pendingAd.contactName} (${pendingAd.contactNumber})\n⏰ Aktif Selama: 24 jam`

                await conn.sendMessage(idGrupBot, { text: newAds.trim() })
                return
            case 'kick':
                if (!target) {
                    caption = `Gunakan: \`${prefix + command} ${cmd} [target]\``
                    break
                }

                const kickIndex = factionNewsData.NewsNetwork.findIndex(member => member.id === target)
    
                if (kickIndex === -1) {
                    caption = 'Target tidak ditemukan dalam News Network.'
                    break
                }

                if (hasHighPrivilege(factionNewsData.NewsNetwork[kickIndex])) {
                    caption = 'Tidak dapat mengeluarkan News Director dan Network CEO.'
                    break
                }

                let hasPermission = false
                let iniMessage = ''

                if (isNewsUser) {
                    if (!hasHighPrivilege(isNewsUser)) {
                        iniMessage = 'Hanya News Director dan Network CEO yang dapat menggunakan perintah ini.'
                    } else if (!isNewsUser.duty) {
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
                    iniMessage = 'Kamu bukan anggota News Network.'
                }

                if (!hasPermission) {
                    caption = iniMessage
                    break
                }

                factionNewsData.NewsNetwork.splice(kickIndex, 1)
                userTarget.playerStatus.pekerjaan = pekerjaan.filter(p => p !== 'News Network')
                
                db.users.update(target, pekerjaan)
                db.save()
                saveFactionUsers(factionNewsData)
    
                caption = `${userTarget.playerInfo.namaLengkap} telah dikeluarkan dari News Network.`
                break
            case 'history':
                if (!isNewsUser) {
                    caption = 'Kamu bukan anggota News Network.'
                    break
                }

                if (!isNewsUser.dutyHistory || isNewsUser.dutyHistory.length === 0) {
                    caption = 'Kamu belum memiliki riwayat shift.'
                    break
                }

                caption = `📰 *RIWAYAT SHIFT ${isNewsUser.nama}*\n\n`

                isNewsUser.dutyHistory.slice(-10).forEach((duty, index) => {
                    caption += `${index + 1}. Mulai: ${duty.start}\n   Selesai: ${duty.end}\n   Durasi: ${duty.duration}\n\n`
                })
                break
            case 'stories':
                if (!isNewsUser) {
                    caption = 'Kamu bukan anggota News Network.'
                    break
                }

                if (!isNewsUser.storiesPublished || isNewsUser.storiesPublished.length === 0) {
                    caption = 'Kamu belum mempublikasikan konten apapun.'
                    break
                }

                caption = `📰 *RIWAYAT PUBLIKASI ${isNewsUser.nama}*\n\n`

                isNewsUser.storiesPublished.slice(-10).forEach((story, index) => {
                    caption += `${index + 1}. Tipe: ${story.type}\n`

                    if (story.type === 'News Story') {
                        caption += `   Headline: ${story.headline}\n`
                    } else if (story.type === 'Interview') {
                        caption += `   Narasumber: ${story.interviewee}\n`
                        caption += `   Topik: ${story.topic}\n`
                    } else if (story.type === 'Advertisement') {
                        caption += `   Kategori: ${story.category}\n`
                        caption += `   Pesan: ${story.message}\n`
                    }

                    caption += `   Tanggal: ${story.date}\n\n`
                })
                break
            case 'members':
                if (!isNewsUser) {
                    caption = 'Kamu bukan anggota News Network.'
                    break
                }

                const members = factionNewsData.NewsNetwork

                if (members.length === 0) {
                    caption = 'Tidak ada anggota News Network saat ini.'
                    break
                }

                caption = `📰 *\`DAFTAR ANGGOTA NEWS NETWORK\`*\n\n`
                caption += `Total Anggota: ${members.length}\n\n`
                caption += `*Daftar Anggota:*\n`

                const rankOrder = {
                    'Network CEO': 7,
                    'News Director': 6,
                    'News Anchor': 5,
                    'Editor': 4,
                    'Senior Reporter': 3,
                    'Reporter': 2,
                    'Intern': 1
                }

                const sortedMembers = [...members].sort((a, b) => {
                    return rankOrder[b.divisi] - rankOrder[a.divisi]
                })

                sortedMembers.forEach((member, index) => {
                    const status = member.duty ? '🟢 On Duty' : '🔴 Off Duty'
                    caption += `${index + 1}. ${member.nama} - ${member.divisi}\n   ${status}\n   Joined: ${member.joinDate}\n\n`
                })
                break
            case 'info':
                if (!isNewsUser) {
                    caption = 'Kamu bukan anggota News Network.'
                    break
                }

                caption = `📰 *\`INFORMASI ANGGOTA NEWS NETWORK\`*\n\n`

                caption += `Nama: ${isNewsUser.nama}\n`
                caption += `Pangkat: ${isNewsUser.divisi}\n`
                caption += `Status: ${isNewsUser.duty ? '🟢 Sedang Bertugas' : '🔴 Tidak Bertugas'}\n`
                caption += `Bergabung: ${isNewsUser.joinDate}\n`

                if (isNewsUser.duty) {
                    caption += `Mulai Shift: ${isNewsUser.dutyStartTime}\n`
                }

                caption += `\nStatistik:\n`
                caption += `• Total Shift: ${isNewsUser.dutyHistory ? isNewsUser.dutyHistory.length : 0}\n`
                caption += `• Total Publikasi: ${isNewsUser.storiesPublished ? isNewsUser.storiesPublished.length : 0}\n`
                caption += `• Akses Iklan: ${isNewsUser.hasAdsAccess ? 'Ya' : 'Tidak'}\n`

                if (isNewsUser.recruitedBy) {
                    caption += `\nDirekrut oleh: ${isNewsUser.recruitedBy}\n`
                }
                break
            case 'delete':
                if (!isNewsUser) {
                    caption = 'Kamu bukan anggota News Network.'
                    break
                }

                if (!hasHighPrivilege(isNewsUser)) {
                    caption = 'Hanya News Director dan Network CEO yang dapat menggunakan perintah ini.'
                    break
                }

                if (!isNewsUser.duty) {
                    caption = 'Kamu harus bertugas terlebih dahulu.'
                    break
                }

                const adIdToDelete = cmdArgs[0]

                if (!adIdToDelete || !conn.newsAds || !conn.newsAds[adIdToDelete]) {
                    caption = `Gunakan: ${ prefix + command } ${cmd} [id iklan]`
                    break
                }

                const deletedAd = conn.newsAds[adIdToDelete]
                delete conn.newsAds[adIdToDelete]

                caption = `Iklan dengan ID ${adIdToDelete} telah dihapus.\nIklan: [${deletedAd.category.toUpperCase()}] ${deletedAd.message}`
                break
            case 'help':
                caption = `📰 *\`DAFTAR PERINTAH\`*\n\n`

                caption += `*Contoh:* \`${prefix + command} list\`\n`
                caption += `*Prefix:* \`${prefix}\`\n\n`

                caption += `*Non-Employee Command:*\n`
                caption += `• \`${command} list\` - Lihat daftar staff news yang sedang duty atau iklan aktif\n`
                caption += `• \`${command} ads\` - Buat iklan\n\n`

                if (isNewsUser) {
                    caption += `*Basic Command:*\n`
                    caption += `• \`${command} duty\` - Mulai/akhiri duty\n`
                    caption += `• \`${command} history\` - Lihat riwayat duty\n`
                    caption += `• \`${command} stories\` - Lihat riwayat publikasi\n`
                    caption += `• \`${command} info\` - Lihat informasi diri\n`
                    caption += `• \`${command} payday\` - Klaim gaji harian\n`
                    caption += `• \`${command} members\` - Lihat daftar anggota\n`
                    caption += `• \`biz ads\` - Iklan bisnis\n\n`

                    if (['Reporter', 'Senior Reporter', 'Editor', 'News Anchor', 'News Director', 'Network CEO'].includes(isNewsUser.divisi)) {
                        caption += `*Publishing Command (Reporter+):*\n`
                        caption += `• \`${command} publish\` - Publikasikan berita\n`
                    }

                    if (['News Anchor', 'News Director', 'Network CEO'].includes(isNewsUser.divisi)) {
                        caption += `*Recruitment Command (News Anchor+):*\n`
                        caption += `• \`${command} recruit\` - Rekrut anggota baru\n\n`
                    }

                    if (['News Director', 'Network CEO'].includes(isNewsUser.divisi)) {
                        caption += `*Management Command (News Director+):*\n`
                        caption += `• \`${command} setrank\` - Ubah pangkat anggota\n`
                        caption += `• \`${command} kick\` - Keluarkan anggota\n`
                        caption += `• \`${command} ads\` - Berikan akses iklan\n`
                        caption += `• \`${command} delete\` - Hapus iklan\n\n`
                    }

                    if (isNewsUser.hasAdsAccess) {
                        caption += `*Advertisement Command:*\n`
                        caption += `• \`${command} acc\` - Setujui publikasi iklan\n\n`
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

                caption += `*Posisi Jabatan News Network:*\n`
                caption += `1. Intern\n2. Reporter\n3. Senior Reporter\n4. Editor\n5. News Anchor\n6. News Director\n7. Network CEO`
                break
            default:
                if (isNewsUser) {
                    caption = `Perintah tidak dikenali. Gunakan: \`${ prefix + command } help\` untuk melihat daftar perintah.`
                } else {
                    caption = `Gunakan: \`${ prefix + command } help\` untuk melihat daftar perintah.`
                }
        }
        conn.sendMessage(m.from, { text: caption.trim() })
    }
}