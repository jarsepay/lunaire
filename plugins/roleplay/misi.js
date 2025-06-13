const missionDefinitions = {
    // Misi Registrasi (Otomatis dimulai setelah registrasi)
    registration_idcard: {
        id: 'registration_idcard',
        name: 'Membuat ID Card',
        description: 'Buat ID Card untuk verifikasi identitas',
        category: 'registration',
        priority: 1,
        requirements: {
            playerInfo: { namaLengkap: { $exists: true } }
        },
        objectives: [
            { 
                id: 'create_idcard',
                description: 'Upload foto ID Card',
                target: 1,
                progress: 0,
                checkField: 'playerInventory.sertifikatDanDokumen.idCard.imageUrl'
            }
        ],
        rewards: {
            exp: 50,
            uang: 20,
            honor: 10
        },
        deadline: 7 * 24 * 60 * 60 * 1000, // 7 hari
        canSkip: false,
        skipCost: 0
    },

    registration_job: {
        id: 'registration_job',
        name: 'Mencari Pekerjaan',
        description: 'Dapatkan pekerjaan pertama untuk memulai karir',
        category: 'registration',
        priority: 2,
        requirements: {
            playerInventory: { 'sertifikatDanDokumen.idCard.imageUrl': { $exists: true } }
        },
        objectives: [
            {
                id: 'get_job',
                description: 'Dapatkan pekerjaan apapun',
                target: 1,
                progress: 0,
                checkField: 'playerStatus.pekerjaan'
            }
        ],
        rewards: {
            exp: 75,
            uang: 50,
            honor: 15
        },
        deadline: 3 * 24 * 60 * 60 * 1000, // 3 hari
        canSkip: false,
        skipCost: 0
    },

    // Misi Kesehatan
    health_checkup: {
        id: 'health_checkup',
        name: 'Medical Check-up',
        description: 'Lakukan pemeriksaan kesehatan rutin',
        category: 'health',
        priority: 3,
        requirements: {
            playerStatus: { pekerjaan: { $exists: true } }
        },
        objectives: [
            {
                id: 'upload_health_cert',
                description: 'Upload sertifikat kesehatan',
                target: 1,
                progress: 0,
                checkField: 'playerInventory.sertifikatDanDokumen.sertifikatKesehatan.imageUrl'
            }
        ],
        rewards: {
            exp: 30,
            uang: 70,
            honor: 8,
            health: 20
        },
        deadline: 14 * 24 * 60 * 60 * 1000, // 14 hari
        canSkip: true,
        skipCost: 250
    },

    // Misi Keuangan
    financial_planning: {
        id: 'financial_planning',
        name: 'Perencanaan Keuangan',
        description: 'Kumpulkan uang untuk masa depan',
        category: 'financial',
        priority: 4,
        requirements: {
            playerStatus: { pekerjaan: { $exists: true } }
        },
        objectives: [
            {
                id: 'save_money',
                description: 'Kumpulkan 10.000 uang',
                target: 10000,
                progress: 0,
                checkField: 'playerInventory.items.uang'
            }
        ],
        rewards: {
            exp: 100,
            uang: 2500,
            honor: 20
        },
        deadline: 30 * 24 * 60 * 60 * 1000, // 30 hari
        canSkip: true,
        skipCost: 500
    },

    // Misi Sosial
    community_service: {
        id: 'community_service',
        name: 'Pelayanan Masyarakat',
        description: 'Berkontribusi untuk masyarakat',
        category: 'social',
        priority: 5,
        requirements: {
            playerInfo: { level: { $gte: 3 } }
        },
        objectives: [
            {
                id: 'help_others',
                description: 'Bantu 5 orang lain',
                target: 5,
                progress: 0,
                checkField: 'playerStats.helpCount'
            }
        ],
        rewards: {
            exp: 80,
            uang: 500,
            honor: 25
        },
        deadline: 21 * 24 * 60 * 60 * 1000, // 21 hari
        canSkip: true,
        skipCost: 500
    },

    // Misi Pendidikan
    skill_development: {
        id: 'skill_development',
        name: 'Pengembangan Skill',
        description: 'Tingkatkan kemampuan dengan sertifikat',
        category: 'education',
        priority: 6,
        requirements: {
            playerInfo: { level: { $gte: 5 } }
        },
        objectives: [
            {
                id: 'get_business_license',
                description: 'Dapatkan lisensi bisnis',
                target: 1,
                progress: 0,
                checkField: 'playerInventory.sertifikatDanDokumen.lisensiBisnis.imageUrl'
            }
        ],
        rewards: {
            exp: 120,
            uang: 7500,
            honor: 30
        },
        deadline: 28 * 24 * 60 * 60 * 1000, // 28 hari
        canSkip: true,
        skipCost: 1000
    },

    // Misi Travel
    travel_preparation: {
        id: 'travel_preparation',
        name: 'Persiapan Perjalanan',
        description: 'Siapkan dokumen perjalanan',
        category: 'travel',
        priority: 7,
        requirements: {
            playerInfo: { level: { $gte: 6 } },
            playerInventory: { 'items.uang': { $gte: 20000 } }
        },
        objectives: [
            {
                id: 'get_passport',
                description: 'Dapatkan paspor',
                target: 1,
                progress: 0,
                checkField: 'playerInventory.items.passport.number'
            }
        ],
        rewards: {
            exp: 150,
            uang: 1000,
            honor: 40
        },
        deadline: 60 * 24 * 60 * 60 * 1000, // 60 hari
        canSkip: true,
        skipCost: 2000
    },

    // Misi Kesehatan Lanjutan
    fitness_challenge: {
        id: 'fitness_challenge',
        name: 'Tantangan Kebugaran',
        description: 'Jaga kesehatan dengan olahraga rutin',
        category: 'health',
        priority: 8,
        requirements: {
            playerInfo: { level: { $gte: 8 } }
        },
        objectives: [
            {
                id: 'maintain_health',
                description: 'Pertahankan health di atas 80 selama 7 hari',
                target: 7,
                progress: 0,
                checkField: 'playerStats.healthyDays'
            }
        ],
        rewards: {
            exp: 200,
            uang: 5000,
            honor: 45,
            health: 50
        },
        deadline: 14 * 24 * 60 * 60 * 1000, // 14 hari
        canSkip: true,
        skipCost: 7500
    },

    // Misi Keluarga
    family_life: {
        id: 'family_life',
        name: 'Kehidupan Keluarga',
        description: 'Bangun kehidupan keluarga yang harmonis',
        category: 'family',
        priority: 9,
        requirements: {
            playerInfo: { level: { $gte: 10 } },
            playerStatus: { perkawinan: { $exists: true } }
        },
        objectives: [
            {
                id: 'marriage_cert',
                description: 'Upload buku nikah',
                target: 1,
                progress: 0,
                checkField: 'playerInventory.sertifikatDanDokumen.bukuNikah'
            }
        ],
        rewards: {
            exp: 300,
            uang: 15000,
            honor: 60,
            mood: 30
        },
        deadline: 365 * 24 * 60 * 60 * 1000, // 365 hari
        canSkip: true,
        skipCost: 50000
    }
}

export const cmd = {
    name: ['misi'],
    command: ['misi'],
    category: ['roleplay'],
    detail: {
        desc: 'Sistem misi dan honor untuk pengembangan karakter',
    },
    setting: {
        isRegister: true,
        isBanned: false,
        isJail: false
    },
    async start({ m, db, prefix, command, args, conn }) {
        const user = db.users.get(m.sender)
        
        // Inisialisasi sistem misi jika belum ada
        if (!user.playerStatus.missions) {
            user.playerStatus.missions = {
                active: [],
                completed: [],
                failed: [],
                honor: 0
            }
        }

        // Inisialisasi stats jika belum ada
        if (!user.playerStats) {
            user.playerStats = {
                helpCount: 0,
                healthyDays: 0,
                lastHealthCheck: Date.now()
            }
        }

        const subCommand = args[0] ? args[0].toLowerCase() : ''
        let caption = ''

        switch (subCommand) {
            case 'list':
            case 'daftar':
                caption = await getMissionList(user, prefix, command)
                break
                
            case 'start':
                const missionId = args[1]
                caption = await startMission(user, missionId, db, m.sender)
                break
                
            case 'progress':
            case 'status':
                caption = await getMissionProgress(user)
                break
                
            case 'complete':
            case 'selesai':
                const completeMissionId = args[1]
                caption = await completeMission(user, completeMissionId, db, m.sender)
                break
                
            case 'skip':
            case 'lewati':
                const skipMissionId = args[1]
                caption = await skipMission(user, skipMissionId, db, m.sender)
                break
                
            case 'honor':
                caption = getHonorStatus(user)
                break
                
            case 'help':
            case 'bantuan':
                caption = getMissionHelp(prefix, command)
                break
                
            default:
                // Auto-start misi registrasi jika player sudah punya nama
                if (user.playerInfo.namaLengkap && !hasActiveMission(user, 'registration_idcard')) {
                    await startMission(user, 'registration_idcard', db, m.sender)
                }
                
                // Update progress otomatis
                await updateMissionProgress(user, db, m.sender)
                
                caption = await getMissionOverview(user, prefix, command)
                break
        }
        
        conn.sendMessage(m.from, { text: caption })
    }
}

// Fungsi helper untuk sistem misi
function hasActiveMission(user, missionId) {
    return user.playerStatus.missions.active.some(m => m.id === missionId)
}

function getMissionById(missionId) {
    return missionDefinitions[missionId] || null
}

function checkRequirements(user, requirements) {
    for (const [field, condition] of Object.entries(requirements)) {
        const fieldValue = getNestedValue(user, field)
        
        if (condition.$exists && !fieldValue) return false
        if (condition.$gte && (!fieldValue || fieldValue < condition.$gte)) return false
        if (condition.$lte && (!fieldValue || fieldValue > condition.$lte)) return false
        if (condition.$eq && fieldValue !== condition.$eq) return false
    }
    return true
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj)
}

async function startMission(user, missionId, db, senderId) {
    if (!missionId) {
        return 'Masukkan ID misi yang ingin dimulai.'
    }
    
    const mission = getMissionById(missionId)
    if (!mission) {
        return 'Misi tidak ditemukan.'
    }
    
    // Cek apakah misi sudah aktif
    if (hasActiveMission(user, missionId)) {
        return 'Misi ini sudah aktif.'
    }
    
    // Cek requirements
    if (!checkRequirements(user, mission.requirements)) {
        return `Persyaratan untuk misi "${mission.name}" belum terpenuhi.`
    }
    
    // Cek apakah sudah completed
    if (user.playerStatus.missions.completed.some(m => m.id === missionId)) {
        return 'Misi ini sudah pernah diselesaikan.'
    }
    
    // Start mission
    const activeMission = {
        ...mission,
        startTime: Date.now(),
        deadlineTime: Date.now() + mission.deadline,
        objectives: mission.objectives.map(obj => ({ ...obj, progress: 0 }))
    }
    
    user.playerStatus.missions.active.push(activeMission)
    db.users.update(senderId, user)
    db.save()
    
    return `✅ Misi "${mission.name}" telah dimulai!\n\n` +
           `• Deskripsi: ${mission.description}\n` +
           `• Deadline: ${new Date(activeMission.deadlineTime).toLocaleDateString('id-ID')}\n` +
           `• Objektif:\n${mission.objectives.map((obj, i) => `${i+1}. ${obj.description}`).join('\n')}`
}

async function getMissionList(user, prefix, command) {
    const availableMissions = []
    const completedMissionIds = user.playerStatus.missions.completed.map(m => m.id)
    const activeMissionIds = user.playerStatus.missions.active.map(m => m.id)
    
    for (const [id, mission] of Object.entries(missionDefinitions)) {
        if (!completedMissionIds.includes(id) && !activeMissionIds.includes(id)) {
            if (checkRequirements(user, mission.requirements)) {
                availableMissions.push({ id, ...mission })
            }
        }
    }
    
    if (availableMissions.length === 0) {
        return 'Tidak ada misi yang tersedia saat ini.'
    }
    
    // Sort by priority
    availableMissions.sort((a, b) => a.priority - b.priority)
    
    let caption = '📋 *\`DAFTAR MISI TERSEDIA\`*\n\n'
    
    availableMissions.forEach((mission, index) => {
        const deadlineDays = Math.floor(mission.deadline / (24 * 60 * 60 * 1000))
        caption += `${index + 1}. *${mission.name}*\n`
        caption += `   📝 ${mission.description}\n`
        caption += `   • Honor: +${mission.rewards.honor}\n`
        caption += `   • Deadline: ${deadlineDays} hari\n`
        caption += `   • ID: \`${mission.id}\`\n\n`
    })
    
    caption += `Gunakan: \`${prefix + command} start <id>\` untuk memulai misi`
    
    return caption
}

async function getMissionProgress(user) {
    const activeMissions = user.playerStatus.missions.active
    
    if (activeMissions.length === 0) {
        return 'Tidak ada misi yang sedang aktif.'
    }
    
    let caption = '📊 *\`PROGRESS MISI AKTIF\`*\n\n'
    
    activeMissions.forEach((mission, index) => {
        const now = Date.now()
        const timeLeft = mission.deadlineTime - now
        const daysLeft = Math.floor(timeLeft / (24 * 60 * 60 * 1000))
        const hoursLeft = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
        
        caption += `${index + 1}. *${mission.name}*\n`
        
        if (timeLeft > 0) {
            caption += `   • Sisa waktu: ${daysLeft}d ${hoursLeft}h\n`
        } else {
            caption += `   ⚠️ TERLAMBAT! Deadline terlewat\n`
        }
        
        // Progress objectives
        mission.objectives.forEach((obj, objIndex) => {
            const percentage = Math.min(100, (obj.progress / obj.target) * 100)
            const progressBar = generateProgressBar(percentage)
            
            caption += `   ${objIndex + 1}. ${obj.description}\n`
            caption += `      ${progressBar} ${percentage.toFixed(1)}%\n`
            caption += `      (${obj.progress}/${obj.target})\n`
        })
        
        caption += `   • ID: \`${mission.id}\`\n\n`
    })
    
    return caption
}

async function completeMission(user, missionId, db, senderId) {
    if (!missionId) {
        return 'Masukkan ID misi yang ingin diselesaikan.'
    }
    
    const missionIndex = user.playerStatus.missions.active.findIndex(m => m.id === missionId)
    if (missionIndex === -1) {
        return 'Misi tidak ditemukan dalam daftar misi aktif.'
    }
    
    const mission = user.playerStatus.missions.active[missionIndex]
    
    // Update progress terlebih dahulu
    await updateMissionProgress(user, db, senderId)
    
    // Cek apakah semua objektif tercapai
    const allObjectivesCompleted = mission.objectives.every(obj => obj.progress >= obj.target)
    
    if (!allObjectivesCompleted) {
        return `Misi "${mission.name}" belum dapat diselesaikan. Tidak semua objektif tercapai.`
    }
    
    const now = Date.now()
    const isOnTime = now <= mission.deadlineTime
    
    // Hitung reward
    let finalRewards = { ...mission.rewards }
    
    // Perfect completion bonus
    if (isOnTime) {
        finalRewards.honor *= 1.5 // Bonus 50% honor jika tepat waktu
        finalRewards.exp *= 1.2   // Bonus 20% exp jika tepat waktu
    } else {
        // Penalty jika terlambat
        finalRewards.honor *= 0.7 // Pengurangan 30% honor jika terlambat
        user.playerStatus.missions.honor -= 5 // Pengurangan honor tambahan
    }
    
    // Apply rewards
    user.playerInfo.exp += Math.floor(finalRewards.exp)
    user.playerInventory.items.uang += finalRewards.uang
    user.playerStatus.missions.honor += Math.floor(finalRewards.honor)
    
    if (finalRewards.health) {
        user.playerInfo.health = Math.min(100, user.playerInfo.health + finalRewards.health)
    }
    if (finalRewards.mood) {
        user.playerInfo.mood = Math.min(100, user.playerInfo.mood + finalRewards.mood)
    }
    
    // Level up check
    const requiredExp = user.playerInfo.level * 100
    if (user.playerInfo.exp >= requiredExp) {
        user.playerInfo.level += 1
        user.playerInfo.exp -= requiredExp
    }
    
    // Move mission to completed
    const completedMission = {
        ...mission,
        completedTime: now,
        perfectCompletion: isOnTime,
        rewardsReceived: finalRewards
    }
    
    user.playerStatus.missions.completed.push(completedMission)
    user.playerStatus.missions.active.splice(missionIndex, 1)
    
    // Auto-start next mission if applicable
    await autoStartNextMission(user, mission.category)
    
    db.users.update(senderId, user)
    db.save()
    
    let resultCaption = `🎉 *\`MISI SELESAI!\`*\n\n`
    resultCaption += `✅ "${mission.name}" berhasil diselesaikan.\n\n`
    
    if (isOnTime) {
        resultCaption += `⭐ *PERFECT COMPLETION!* (Bonus reward)\n\n`
    } else {
        resultCaption += `⚠️ Diselesaikan terlambat (penalty applied)\n\n`
    }
    
    resultCaption += `🎁 *Reward yang diterima:*\n`
    resultCaption += `   • Uang: +${finalRewards.uang.toLocaleString('id-ID')}\n`
    resultCaption += `   • EXP: +${Math.floor(finalRewards.exp)}\n`
    resultCaption += `   • Honor: +${Math.floor(finalRewards.honor)}\n`
    
    if (finalRewards.health) resultCaption += `   • Health: +${finalRewards.health}\n`
    if (finalRewards.mood) resultCaption += `   • Mood: +${finalRewards.mood}\n`
    
    return resultCaption
}

async function skipMission(user, missionId, db, senderId) {
    if (!missionId) {
        return 'Masukkan ID misi yang ingin dilewati.'
    }
    
    const missionIndex = user.playerStatus.missions.active.findIndex(m => m.id === missionId)
    if (missionIndex === -1) {
        return 'Misi tidak ditemukan dalam daftar misi aktif.'
    }
    
    const mission = user.playerStatus.missions.active[missionIndex]
    
    if (!mission.canSkip) {
        return `Misi "${mission.name}" tidak dapat dilewati.`
    }
    
    if (user.playerInventory.items.uang < mission.skipCost) {
        return `Uang tidak cukup untuk melewati misi ini. Dibutuhkan $${mission.skipCost.toLocaleString('id-ID')}`
    }
    
    // Deduct money and honor
    user.playerInventory.items.uang -= mission.skipCost
    user.playerStatus.missions.honor -= 10 // Penalty honor karena skip
    
    // Move to completed with skip flag
    const skippedMission = {
        ...mission,
        completedTime: Date.now(),
        skipped: true,
        skipCost: mission.skipCost
    }
    
    user.playerStatus.missions.completed.push(skippedMission)
    user.playerStatus.missions.active.splice(missionIndex, 1)
    
    db.users.update(senderId, user)
    db.save()
    
    return `✅ Misi "${mission.name}" berhasil dilewati.\n\n` +
           `• Biaya: ${mission.skipCost.toLocaleString('id-ID')}\n` +
           `• Honor: -10 (penalty)`
}

function getHonorStatus(user) {
    const honor = user.playerStatus.missions.honor || 0
    const completed = user.playerStatus.missions.completed.length
    const perfectCount = user.playerStatus.missions.completed.filter(m => m.perfectCompletion).length
    const skippedCount = user.playerStatus.missions.completed.filter(m => m.skipped).length
    
    let honorTitle = 'Rookie'
    if (honor >= 500) honorTitle = 'Legend'
    else if (honor >= 300) honorTitle = 'Master'
    else if (honor >= 150) honorTitle = 'Expert'
    else if (honor >= 75) honorTitle = 'Professional'
    else if (honor >= 25) honorTitle = 'Experienced'
    
    return `🏆 *\`STATUS HONOR\`*\n\n` +
           `• Nama: ${user.playerInfo.namaLengkap || 'Belum set'}\n` +
           `• Honor: ${honor}\n` +
           `• Title: ${honorTitle}\n\n` +
           `• *Statistik Misi:*\n` +
           `• Diselesaikan: ${completed}\n` +
           `• Perfect: ${perfectCount}\n` +
           `• Dilewati: ${skippedCount}\n\n` +
           `• Perfect Rate: ${completed > 0 ? ((perfectCount / completed) * 100).toFixed(1) : 0}%`
}

function getMissionHelp(prefix, command) {
    return `📚 *\`DAFTAR PERINTAH\`*\n\n` +
           `*Contoh:* \`${prefix + command} list\`\n` +
           `*Prefix:* \`${prefix}\`\n\n` +
           `• \`${command}\` - Overview misi\n` +
           `• \`${command} list\` - Daftar misi tersedia\n` +
           `• \`${command} start\` - Mulai misi\n` +
           `• \`${command} progress\` - Lihat progress\n` +
           `• \`${command} complete\` - Selesaikan misi\n` +
           `• \`${command} skip\` - Lewati misi (bayar)\n` +
           `• \`${command} honor\` - Status honor\n\n` +
           `ℹ*Tips:*\n` +
           `- Selesaikan misi tepat waktu untuk bonus reward\n` +
           `- Perfect completion memberikan bonus honor\n` +
           `- Terlambat akan mengurangi honor\n` +
           `- Beberapa misi bisa dilewati dengan biaya`
}

async function getMissionOverview(user, prefix, command) {
    const activeMissions = user.playerStatus.missions.active.length
    const completedMissions = user.playerStatus.missions.completed.length
    const honor = user.playerStatus.missions.honor || 0
    
    let caption = `🎯 *\`MISI & HONOR\`*\n\n`
    caption += `• Honor: ${honor}\n`
    caption += `• Misi Aktif: ${activeMissions}\n`
    caption += `• Misi Selesai: ${completedMissions}\n\n`
    
    if (activeMissions > 0) {
        caption += `📋 *Misi Aktif Saat Ini:*\n`
        user.playerStatus.missions.active.forEach((mission, index) => {
            const timeLeft = mission.deadlineTime - Date.now()
            const daysLeft = Math.floor(timeLeft / (24 * 60 * 60 * 1000))
            
            caption += `${index + 1}. ${mission.name}\n`
            if (timeLeft > 0) {
                caption += `   • ${daysLeft} hari lagi\n`
            } else {
                caption += `   ⚠️ TERLAMBAT!\n`
            }
        })
        caption += `\n`
    }
    
    caption += `Gunakan: \`${prefix + command} help\` untuk bantuan lengkap`
    
    return caption
}

async function updateMissionProgress(user, db, senderId) {
    const activeMissions = user.playerStatus.missions.active
    let updated = false
    
    for (const mission of activeMissions) {
        for (const objective of mission.objectives) {
            const currentValue = getNestedValue(user, objective.checkField)
            let newProgress = 0
            
            // Tentukan progress berdasarkan tipe objektif
            if (objective.checkField.includes('imageUrl') || objective.checkField.includes('number')) {
                // Untuk upload dokumen atau field string
                newProgress = currentValue && currentValue !== '' ? 1 : 0
            } else if (typeof currentValue === 'number') {
                // Untuk nilai numerik
                newProgress = Math.min(objective.target, currentValue)
            } else if (typeof currentValue === 'string') {
                // Untuk field string yang tidak kosong
                newProgress = currentValue && currentValue !== '' ? 1 : 0
            }
            
            if (newProgress !== objective.progress) {
                objective.progress = newProgress
                updated = true
            }
        }
    }
    
    // Update health tracking untuk fitness challenge
    if (user.playerInfo.health >= 80) {
        const lastCheck = user.playerStats.lastHealthCheck
        const now = Date.now()
        const daysPassed = Math.floor((now - lastCheck) / (24 * 60 * 60 * 1000))
        
        if (daysPassed >= 1) {
            user.playerStats.healthyDays = (user.playerStats.healthyDays || 0) + daysPassed
            user.playerStats.lastHealthCheck = now
            updated = true
        }
    } else {
        // Reset if health drops below 80
        user.playerStats.healthyDays = 0
        user.playerStats.lastHealthCheck = Date.now()
        updated = true
    }
    
    if (updated) {
        db.users.update(senderId, user)
        db.save()
    }
}

async function autoStartNextMission(user, completedCategory) {
    // Auto-start misi registrasi berikutnya
    if (completedCategory === 'registration') {
        if (user.playerInventory.sertifikatDanDokumen.idCard.imageUrl && 
            !hasActiveMission(user, 'registration_job') &&
            !user.playerStatus.missions.completed.some(m => m.id === 'registration_job')) {
            
            const jobMission = getMissionById('registration_job')
            if (checkRequirements(user, jobMission.requirements)) {
                const activeMission = {
                    ...jobMission,
                    startTime: Date.now(),
                    deadlineTime: Date.now() + jobMission.deadline,
                    objectives: jobMission.objectives.map(obj => ({ ...obj, progress: 0 }))
                }
                user.playerStatus.missions.active.push(activeMission)
            }
        }
    }
}

function generateProgressBar(percentage, length = 10) {
    const filled = Math.floor((percentage / 100) * length)
    const empty = length - filled
    return '█'.repeat(filled) + '░'.repeat(empty)
}

// Export fungsi untuk digunakan di tempat lain
export const missionSystem = {
    updateMissionProgress,
    checkRequirements,
    getMissionById,
    hasActiveMission,
    missionDefinitions
}