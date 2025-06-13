export const cmd = {
    name: ['profile'],
    command: ['profile'],
    category: ['main'],
    detail: {
        desc: 'Lihat profil karakter dan statistik penggunaan.'
    },
    setting: {
        isRegister: true,
        isBanned: false,
        isJail: false
    },
    async start({ m, db, prefix, command, args, conn }) {
        const user = db.users.get(m.sender)
        const profile = user.playerInfo || {}
        const stats = user.playerStats || {}
        const location = user.playerLocation || {}
        const status = user.playerStatus || {}
        const membership = user.membership || {}
        const inventory = user.playerInventory || {}

        const backpackInfo = db.backpack.getInfo(m.sender)
        const backpackLevels = db.backpack.getLevels()

        const getMembershipStatus = () => {
            if (membership.pro?.status) return '👑 PRO'
            if (membership.plus?.status) return '💎 PLUS'
            return '🆓 BASIC'
        }

        const formatDate = (timestamp) => {
            if (!timestamp) return 'Tidak diketahui'
            return new Date(timestamp).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        }

        const getTimeSince = (timestamp) => {
            if (!timestamp) return 'Tidak diketahui'
            const now = Date.now()
            const diff = now - timestamp
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            
            if (days > 0) return `${days} hari lalu`
            if (hours > 0) return `${hours} jam lalu`
            return 'Baru saja'
        }

        const getHealthStatus = () => {
            const health = profile.health || 100
            if (health >= 80) return '🟢 Sehat'
            if (health >= 60) return '🟡 Kurang Sehat'
            if (health >= 40) return '🟠 Sakit Ringan'
            if (health >= 20) return '🔴 Sakit Berat'
            return '💀 Kritis'
        }

        const getMoodEmoji = () => {
            const mood = profile.mood || 100
            if (mood >= 80) return '😊'
            if (mood >= 60) return '😐'
            if (mood >= 40) return '😔'
            if (mood >= 20) return '😢'
            return '😰'
        }

        const getActivityLevel = () => {
            const commandsUsed = stats.commandsUsed || {}
            const totalCommands = Object.values(commandsUsed).reduce((a, b) => a + b, 0)
            
            if (totalCommands >= 1000) return '🔥 Sangat Aktif'
            if (totalCommands >= 500) return '⚡ Aktif'
            if (totalCommands >= 100) return '📈 Cukup Aktif'
            if (totalCommands >= 10) return '🌱 Pemula'
            return '😴 Kurang Aktif'
        }

        const getBackpackStatusBar = () => {
            if (!backpackInfo) return '❌ Tidak ada data'
            
            const percentage = backpackInfo.percentage
            const filledBars = Math.round(percentage / 10)
            const emptyBars = 10 - filledBars
            
            return '█'.repeat(filledBars) + '░'.repeat(emptyBars)
        }

        const getBackpackColor = () => {
            if (!backpackInfo) return '⚫'
            
            if (backpackInfo.percentage >= 90) return '🔴'
            if (backpackInfo.percentage >= 70) return '🟡'
            if (backpackInfo.percentage >= 50) return '🟠'
            return '🟢'
        }

        const getTopItems = () => {
            const items = inventory.items || {}
            return Object.entries(items)
                .filter(([key, value]) => typeof value === 'number' && value > 0)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([item, qty]) => `• ${item}: ${qty}`)
                .join('\n') || '• Tidak ada item'
        }

        const cmd = args[0]?.toLowerCase() || ''

        let caption = ''

        switch (cmd) {
            case 'inventory':
            case 'inv':
            case 'backpack':
            case 'bp':
                caption = `🎒 *\`INVENTORI & BACKPACK\`*\n\n`
                caption += `👤 *${profile.namaLengkap || 'Nama belum diatur'}*\n\n`
                
                if (backpackInfo) {
                    caption += `*Status Backpack:*\n`
                    caption += `• Nama: ${backpackInfo.name}\n`
                    caption += `• Level: ${backpackInfo.level}\n`
                    caption += `• Kapasitas: ${backpackInfo.currentWeight}/${backpackInfo.capacity}\n`
                    caption += `• Ruang Kosong: ${backpackInfo.freeSpace}\n`
                    caption += `• Status: ${getBackpackColor()} ${getBackpackStatusBar()} ${backpackInfo.percentage}%\n\n`
                    
                    if (backpackInfo.percentage >= 90) {
                        caption += `*Peringatan: Backpack hampir penuh!*\n\n`
                    }
                } else {
                    caption += `*Backpack tidak ada*\n\n`
                }
                
                caption += `*Item Terbanyak:*\n`
                caption += `${getTopItems()}\n\n`
                
                caption += `*Keuangan:*\n`
                caption += `• Uang: $${inventory.items?.uang || 0}\n\n`
                
                caption += `*Upgrade Backpack:*\n`
                Object.entries(backpackLevels).forEach(([level, info]) => {
                    const current = backpackInfo?.level === level ? '✅' : '⬜'
                    caption += `${current} ${info.name} (${info.capacity} kapasitas)\n`
                })
                
                caption += `\n*Daftar Perintah*\n`
                caption += `• \`upgrade backpack\` - Upgrade tas\n`
                caption += `• \`use [item]\` - Gunakan item\n`
                break

            case 'stats':
                caption = `📊 *\`STATISTIK PENGGUNAAN\`*\n\n`
                caption += `👤 *${profile.namaLengkap || 'Nama belum diatur'}*\n`
                caption += `${getMembershipStatus()}\n\n`
                
                caption += `*Aktivitas:*\n`
                caption += `• Level Aktivitas: ${getActivityLevel()}\n`
                caption += `• Total Perintah: ${Object.values(stats.commandsUsed || {}).reduce((a, b) => a + b, 0)}\n`
                caption += `• Bantuan Diberikan: ${stats.helpCount || 0} kali\n`
                caption += `• Hari Sehat: ${stats.healthyDays || 0} hari\n\n`
                
                caption += `*Pencapaian:*\n`
                caption += `• Perubahan Nama: ${stats.nameChanges || 0} kali\n`
                caption += `• Misi Selesai: ${status.missions?.completed?.length || 0}\n`
                caption += `• Honor Points: ${status.missions?.honor || 0}\n\n`
                
                if (backpackInfo) {
                    caption += `*Backpack Stats:*\n`
                    caption += `• Level: ${backpackInfo.level} (${backpackInfo.name})\n`
                    caption += `• Penggunaan: ${backpackInfo.percentage}%\n`
                    caption += `• Total Item: ${Object.values(inventory.items || {}).reduce((a, b) => typeof b === 'number' ? a + b : a, 0)}\n\n`
                }
                
                caption += `*Waktu:*\n`
                caption += `• Terdaftar: ${formatDate(stats.registrationDate)}\n`
                caption += `• Terakhir Aktif: ${getTimeSince(stats.lastActive)}\n`
                caption += `• Nama Terakhir Diubah: ${getTimeSince(stats.lastNameChange)}\n\n`
                
                const commandsUsed = stats.commandsUsed || {}
                const topCommands = Object.entries(commandsUsed)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                
                if (topCommands.length > 0) {
                    caption += `🔥 *Perintah Favorit:*\n`
                    topCommands.forEach(([cmd, count], index) => {
                        caption += `${index + 1}. ${cmd}: ${count}x\n`
                    })
                }
                break

            case 'health':
                caption = `🏥 *\`STATUS KESEHATAN\`*\n\n`
                caption += `👤 *${profile.namaLengkap || 'Nama belum diatur'}*\n\n`
                
                caption += `*Kondisi Fisik:*\n`
                caption += `• Kesehatan: ${profile.health || 100}/100 ${getHealthStatus()}\n`
                caption += `• Energi: ${profile.energy || 100}/100\n`
                caption += `• Mood: ${profile.mood || 100}/100 ${getMoodEmoji()}\n\n`
                
                caption += `*Kebutuhan:*\n`
                caption += `• Lapar: ${profile.lapar || 100}/100\n`
                caption += `• Haus: ${profile.haus || 100}/100\n\n`
                
                caption += `*Status:*\n`
                caption += `• Sakit: ${status.sakit ? 'Ya' : 'Tidak'}\n`
                caption += `• Pingsan: ${status.pingsan ? 'Ya' : 'Tidak'}\n`
                caption += `• Hari Sehat Berturut: ${stats.healthyDays || 0} hari\n`
                caption += `• Cek Kesehatan Terakhir: ${getTimeSince(stats.lastHealthCheck)}\n\n`
                
                if (backpackInfo && backpackInfo.percentage >= 90) {
                    caption += `*Peringatan Kesehatan:*\n`
                    caption += `• Backpack terlalu berat dapat mempengaruhi kesehatan!\n`
                    caption += `• Pertimbangkan untuk menyimpan item atau upgrade backpack.\n`
                }
                break
            case '':
                let caps = `👤 *\`PROFIL KARAKTER\`*\n\n`
                
                caps += `*Identitas:*\n`
                caps += `• Nama: ${profile.namaLengkap || 'Belum diatur'}\n`
                caps += `• ID: ${profile.id || 'Auto-generated'}\n`
                caps += `• Gender: ${profile.jenisKelamin || 'Belum diatur'}\n`
                caps += `• Status: ${getMembershipStatus()}\n\n`
                
                caps += `*Lokasi & Kewarganegaraan:*\n`
                caps += `• Kewarganegaraan: ${status.kewarganegaraan || 'Unknown'}\n`
                caps += `• Kota: ${location.city || 'Unknown'}\n`
                caps += `• Alamat: ${location.street ? `${location.street} No.${location.houseNumber}` : 'Belum diatur'}\n\n`
                
                caps += `*Statistik:*\n`
                caps += `• Level: ${profile.level || 1}\n`
                caps += `• EXP: ${profile.exp || 0}\n`
                caps += `• Limit: ${profile.limit || 7}\n`
                caps += `• Kesehatan: ${profile.health || 100}/100\n\n`
                
                if (backpackInfo) {
                    caps += `*Backpack:*\n`
                    caps += `• ${backpackInfo.name} (${backpackInfo.currentWeight}/${backpackInfo.capacity})\n`
                    caps += `• Status: ${getBackpackColor()} ${backpackInfo.percentage}% penuh\n\n`
                }
                
                caps += `*Status:*\n`
                caps += `• Terdaftar: ${status.registered ? 'Ya' : 'Tidak'}\n`

                caps += `• Pekerjaan:\n`

                if (status.pekerjaan && status.pekerjaan.length > 0) {
                  for (let i = 0; i < status.pekerjaan.length; i++) {
                    caps += `   ${i + 1}. ${status.pekerjaan[i]}\n`
                  }
                } else {
                  caps += `   Tidak ada pekerjaan (Pengangguran)\n`
                }

                caps += `• Perkawinan: ${status.perkawinan || 'Lajang'}\n`
                caps += `• Warning: ${status.warn || 0}/20\n\n`
                
                caps += `*Keuangan:*\n`
                caps += `• Uang Saku: $${inventory.items?.uang || 0}\n\n`
                
                caps += `*Aktivitas Singkat:*\n`
                caps += `• ${getActivityLevel()}\n`
                caps += `• Terdaftar: ${formatDate(stats.registrationDate)}\n`
                caps += `• Total Perintah: ${Object.values(stats.commandsUsed || {}).reduce((a, b) => a + b, 0)}\n\n`
                
                caps += `🔧 *\`DAFTAR PERINTAH\`*\n`

                caps += `*Contoh:* \`${prefix + command} stats\`\n`
                caps += `*Prefix:* \`${prefix}\`\n\n`

                caps += `• \`${command} stats\` - Statistik lengkap\n`
                caps += `• \`${command} health\` - Status kesehatan\n`
                caps += `• \`${command} inventory\` - Lihat inventori\n`
                
                if (!profile.namaLengkap) {
                    caps += `\n⚠️ *Belum memiliki nama? Daftar sekarang:*\n`
                    caps += `• \`verify name\``
                }

                if (!cmd) {
                    const idCardNya = inventory.sertifikatDanDokumen.idCard.imageUrl
                    const message = idCardNya ? { image: { url: idCardNya }, caption: caps.trim() } : { text: caps.trim() }
                    conn.sendMessage(m.from, message)
                }
                return
            default:
                caption = `Perintah tidak dikenal. Gunakan \`${ prefix + command }\` untuk melihat daftar perintah.`
        }

        // Update last active
        db.users.update(m.sender, {
            playerStats: {
                ...stats,
                lastActive: Date.now(),
                commandsUsed: {
                    ...stats.commandsUsed,
                    [command]: (stats.commandsUsed?.[command] || 0) + 1
                }
            }
        })
        db.save()

        conn.sendMessage(m.from, { text: caption.trim() })
    }
}