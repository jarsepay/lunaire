import {
    INTERACTION_DATA,
    MOOD_SYSTEM,
    GIFT_SYSTEM,
    EVENT_SYSTEM,
    MINI_GAMES,
    RELATIONSHIP_LEVELS,
    CharacterManager,
    canInteract,
    generateDatingStory,
    getCurrentMood,
    setMood,
    checkActiveEvents,
    calculateExpGain,
    getRelationshipLevel,
    isUnlocked,
    initializeDailyQuests,
    hasValidWaifu
} from '../../lib/databases/character.js'
import { getRandomElement, formatTime } from '../../lib/src/function.js'

export const cmd = {
    name: ['waifu'],
    command: ['waifu', 'husbu'],
    category: ['roleplay'],
    detail: {
        desc: 'Sistem roleplay waifu/husbu dengan berbagai interaksi romantis'
    },
    setting: {
        isRegister: true,
        isBanned: false,
        isJail: false
    },
    async start({ m, db, prefix, command, conn, args }) {
        const characterManager = new CharacterManager()
        const user = db.users.get(m.sender)
        const subCmd = (args[0] || '').toLowerCase()
        let caption = ''

        initializeDailyQuests(user)

        if (user.playerStatus.waifu && user.playerStatus.waifu.name) {
            const activeEvents = checkActiveEvents(user.playerStatus.waifu)
            if (activeEvents.length > 0) {
                user.playerStatus.waifu.activeEvents = activeEvents
            }
        }

        db.users.update(m.sender, user)

        switch (subCmd) {
            case 'cari':
            case 'search':
                if (!args[1]) {
                    caption = `Gunakan: \`${prefix + command} ${subCmd} [nama karakter]\`

*Karakter populer yang tersedia:*
Waifu: makima, zero two, marin, nezuko, mai, rem, chika
Husbu: gojo, levi, tanjiro, deku, itadori, senku`
                    break
                }

                const query = args.slice(1).join(' ')

                try {
                    const results = await characterManager.searchWeebAPI(query)
                    
                    if (results.length === 0) {
                        const suggestions = characterManager.getRandomCharacters(5)
                        caption = `Karakter '${query}' tidak ditemukan. Coba karakter ini:\n`
                        suggestions.forEach((char, index) => {
                            caption += `• ${char.name} (${char.anime})\n`
                        })
                        caption += `\nGunakan: \`${prefix + command} random\` untuk pilihan acak.`
                        break
                    }

                    caption = `🎌 *\`HASIL DARI '${query.toUpperCase()}'\`*\n\n`
                    
                    results.forEach((char, index) => {
                        caption += `*${index + 1}. ${char.name}*\n`
                        caption += `• Anime: ${char.anime}\n`
                        if (char.age) caption += `• Umur: ${char.age}\n`
                        if (char.gender) caption += `• Gender: ${char.gender}\n`
                        if (char.description && char.description.length > 0) {
                            const shortDesc = char.description.length > 100 
                                ? char.description.substring(0, 100) + '...' 
                                : char.description
                            caption += `• Deskripsi: ${shortDesc}\n`
                        }
                        caption += `• Tipe: ${char.type || 'character'}\n\n`
                    })

                    caption += `*Gunakan:* \`${prefix + command} pilih [nomor]\``

                    user.tempSearchResults = results
                    db.users.update(m.sender, user)
                    
                } catch (e) {
                    caption = 'Terjadi error saat mencari karakter. Coba lagi nanti.'
                    console.log('Search error:', e)
                }
                break

            case 'pilih':
            case 'choose':
                if (!user.tempSearchResults || user.tempSearchResults.length === 0) {
                    caption = `Kamu belum cari karakter. Gunakan: \`${prefix + command} cari [nama karakter]\``
                    break
                }

                const choice = parseInt(args[1]) - 1
                if (isNaN(choice) || choice < 0 || choice >= user.tempSearchResults.length) {
                    caption = `Pilihan tidak valid. Pilih nomor 1-${user.tempSearchResults.length}`
                    break
                }

                const selectedChar = user.tempSearchResults[choice]
                
                if (hasValidWaifu(user) && !user.membership.plus.status) {
                    caption = `Kamu sudah punya ${user.playerStatus.waifu.name}. Untuk mengganti waifu, kamu butuh membership Plus atau lebih.`
                    break
                }

                try {
                    const charDetails = await characterManager.getCharacterDetails(selectedChar)
                    
                    if (!charDetails) {
                        caption = 'Gagal mengambil detail karakter. Coba lagi.'
                        break
                    }

                    user.playerStatus.waifu = {
                        id: selectedChar.id,
                        name: charDetails.name,
                        anime: charDetails.anime,
                        image: charDetails.image,
                        description: charDetails.description,
                        exp: 0,
                        level: 1,
                        dateSelected: Date.now(),
                        interactions: {},
                        age: charDetails.age,
                        gender: charDetails.gender,
                        bloodType: charDetails.bloodType,
                        type: charDetails.type,
                        currentMood: null,
                        gifts: [],
                        memories: []
                    }

                    delete user.tempSearchResults
                    db.users.update(m.sender, user)

                    caption = `✅ *\`BERHASIL MEMILIH ${charDetails.type?.toUpperCase() || 'PARTNER'}\`*

• Nama: ${charDetails.name}
• Anime: ${charDetails.anime}
${charDetails.age ? `• Umur: ${charDetails.age}\n` : ''}${charDetails.gender ? `• Gender: ${charDetails.gender}\n` : ''}${charDetails.bloodType ? `• Golongan Darah: ${charDetails.bloodType}\n` : ''}• Level: 1 (${RELATIONSHIP_LEVELS[1].name})
• Exp: 0

*Deskripsi:*
${charDetails.description}

${charDetails.name} sekarang menjadi ${charDetails.type || 'partner'} kamu.

*DAFTAR PERINTAH*
• \`${command} profile\` - Lihat profil ${charDetails.type || 'partner'}
• \`${command} hug\` - Peluk ${charDetails.type || 'partner'} (+10 exp)
• \`${command} mood\` - Lihat mood ${charDetails.type || 'partner'}
• \`${command} gift\` - Beri hadiah
• \`${command} game\` - Main mini game
• \`${command} quest\` - Lihat daily quest
• \`${command} top\` - Top couple

_Interaksi rutin akan meningkatkan level dan membuka fitur baru._`

                } catch (e) {
                    caption = 'Terjadi error saat memproses pilihan. Coba lagi.'
                    console.log('Character selection error:', e)
                }
                break

            case 'profile': {
                if (!hasValidWaifu(user)) {
                    caption = `Kamu belum punya waifu. Gunakan: \`${prefix + command} cari [nama]\``
                    break
                }

                const waifu = user.playerStatus.waifu
                const daysTogether = Math.floor((Date.now() - waifu.dateSelected) / (1000 * 60 * 60 * 24))
                const currentMood = getCurrentMood(waifu)
                const relationshipLevel = getRelationshipLevel(waifu.exp)
                const relationshipData = RELATIONSHIP_LEVELS[relationshipLevel]

                caption = `💖 *\`PROFIL ${waifu.type?.toUpperCase() || 'PARTNER'}\`*

• Nama: ${waifu.name}
• Anime: ${waifu.anime}  
${waifu.age ? `• Umur: ${waifu.age}\n` : ''}${waifu.gender ? `• Gender: ${waifu.gender}\n` : ''}${waifu.bloodType ? `• Golongan Darah: ${waifu.bloodType}\n` : ''}• Level: ${relationshipLevel} (${relationshipData.name})
• Exp: ${waifu.exp} / ${RELATIONSHIP_LEVELS[relationshipLevel + 1]?.exp || 'MAX'}
• Hubungan: ${daysTogether} hari berjalan
${currentMood ? `• Mood: ${currentMood.name} ${currentMood.emoji} (${formatTime(currentMood.timeLeft)} tersisa)` : '• Mood: Normal 😊'}

*Deskripsi:*
${waifu.description}

*Fitur Terbuka:*
${relationshipData.unlocks.map(unlock => 
    unlock === 'all' ? '• Semua fitur ✅' : `• ${unlock.charAt(0).toUpperCase() + unlock.slice(1)} ✅`
).join('\n')}

*Interact Tersedia:*
• Hug ${isUnlocked(waifu, 'hug') ? '✅' : '❌'}
• Kiss ${isUnlocked(waifu, 'kiss') ? '✅' : '❌'}
• Date ${isUnlocked(waifu, 'date') ? '✅' : '❌'}
• Fuck ${isUnlocked(waifu, 'fuck') ? '✅' : '❌'}
• Gift ${isUnlocked(waifu, 'gift') ? '✅' : '❌'}
• Game ${isUnlocked(waifu, 'game') ? '✅' : '❌'}`

                if (waifu.image) {
                    try {
                        await conn.sendMessage(m.from, {
                            image: { url: waifu.image },
                            caption: caption
                        }, { quoted: m })
                        return
                    } catch (e) {
                        // fallback abcdefg
                    }
                }
                break
            }
            case 'mood':
                if (!hasValidWaifu(user)) {
                    caption = `Kamu belum punya waifu/husbu.`
                    break
                }

                const currentMoodData = getCurrentMood(user.playerStatus.waifu)
                
                if (!currentMoodData) {
                    caption = `💭 *\`MOOD ${user.playerStatus.waifu.name.toUpperCase()}\`*

${user.playerStatus.waifu.name} sedang dalam mood normal. 😊

*Cara mengubah mood:*
• Interact seperti hug, kiss, atau date
• Memberikan hadiah
• Main mini game bersama
• Mood akan berubah berdasarkan aktivitas`
                } else {
                    const mood = MOOD_SYSTEM.moods[currentMoodData.type]
                    const response = getRandomElement(mood.responses)
                    
                    caption = `💭 *\`MOOD ${user.playerStatus.waifu.name.toUpperCase()}\`*

${response}

• Mood: ${currentMoodData.name} ${currentMoodData.emoji}
• Durasi: ${formatTime(currentMoodData.timeLeft)} tersisa
• EXP Multiplier: ${currentMoodData.multiplier}x

*Efek mood:*
${currentMoodData.multiplier > 1 ? 
    `• Semua interaksi memberikan bonus EXP.` : 
    `• EXP yang didapat akan berkurang.`}`
                }
                break

            case 'gift':
            case 'hadiah':
                if (!hasValidWaifu(user)) {
                    caption = `Kamu belum punya waifu/husbu.`
                    break
                }

                if (!isUnlocked(user.playerStatus.waifu, 'gift')) {
                    caption = `Fitur gift belum terbuka. Butuh level ${Object.entries(RELATIONSHIP_LEVELS).find(([level, data]) => data.unlocks.includes('gift'))?.[0] || 2}.`
                    break
                }

                const giftType = args[1]?.toLowerCase()
                
                if (!giftType) {
                    caption = `🎁 *\`DAFTAR HADIAH\`*

*Gunakan:* \`${prefix + command} gift [nama hadiah]\`

*Hadiah yang tersedia:*\n`
                    
                    Object.entries(GIFT_SYSTEM.gifts).forEach(([key, gift]) => {
                        caption += `• *${gift.name}* ${gift.emoji}\n`
                        caption += `  Harga: $${gift.price} | EXP: +${gift.expBonus}\n`
                        caption += `  Rarity: ${gift.rarity} | Mood: ${gift.mood}\n\n`
                    })
                    break
                }

                const gift = GIFT_SYSTEM.gifts[giftType]
                if (!gift) {
                    caption = `Hadiah '${giftType}' tidak ditemukan. Gunakan: \`${prefix + command} gift\``
                    break
                }

                if (user.playerInventory.items.uang < gift.price) {
                    caption = `Uang tidak cukup. Kamu butuh $${gift.price}.`
                    break
                }

                user.playerInventory.items.uang -= gift.price
                const expGain = calculateExpGain(gift.expBonus, user.playerStatus.waifu)
                user.playerStatus.waifu.exp += expGain
                
                setMood(user.playerStatus.waifu, gift.mood, 'gift')
                
                const giftResponse = getRandomElement(gift.responses)
                user.playerStatus.waifu.gifts = user.playerStatus.waifu.gifts || []
                user.playerStatus.waifu.gifts.push({
                    name: gift.name,
                    date: Date.now(),
                    rarity: gift.rarity
                })

                const newLevel = getRelationshipLevel(user.playerStatus.waifu.exp)
                const leveledUp = newLevel > user.playerStatus.waifu.level
                user.playerStatus.waifu.level = newLevel

                db.users.update(m.sender, user)

                caption = `🎁 *\`HADIAH UNTUK ${user.playerStatus.waifu.name.toUpperCase()}\`*

Kamu memberikan ${gift.name} ${gift.emoji} kepada ${user.playerStatus.waifu.name}...

"${giftResponse}"

• Hadiah: ${gift.name} ${gift.emoji}
• Harga: $${gift.price}
• EXP: +${expGain}
• Mood: ${MOOD_SYSTEM.moods[gift.mood].name} ${MOOD_SYSTEM.moods[gift.mood].emoji}

${leveledUp ? `🎉 Hubungan naik ke level ${newLevel}: ${RELATIONSHIP_LEVELS[newLevel].name}.` : ''}`
                break
                
            case 'event':
            case 'events':
                if (!hasValidWaifu(user)) {
                    caption = `Kamu belum punya waifu/husbu.`
                    break
                }

                const activeEvents = checkActiveEvents(user.playerStatus.waifu)
                
                if (activeEvents.length === 0) {
                    caption = `🎉 *\`EVENTS\`*

Tidak ada event aktif saat ini.

*Event yang mungkin terjadi:*
• Anniversary - Setiap tanggal pilih waifu
• Birthday - Tanggal lahir karakter
• Valentine - 14 Februari
• Christmas - 25 Desember
• New Year - 1 Januari

Event memberikan bonus EXP dan unlock content khusus.`
                } else {
                    caption = `🎉 *\`EVENT AKTIF\`*\n\n`
                    
                    activeEvents.forEach(event => {
                        const eventData = EVENT_SYSTEM.events[event.type]
                        caption += `*${eventData.name}*\n`
                        caption += `• Bonus EXP: ${eventData.expMultiplier}x\n`
                        caption += `• Durasi: ${formatTime(eventData.duration)}\n\n`
                        
                        if (event.type === 'anniversary') {
                            caption += eventData.story(user.playerStatus.waifu, event.data.days)
                        } else {
                            caption += eventData.story(user.playerStatus.waifu)
                        }
                    })
                }
                break

            case 'kiss':
                {
                    const interactionCheck = canInteract(user, 'kiss')
                    if (!interactionCheck.can) {
                        caption = interactionCheck.reason
                        break
                    }

                    const waifu = user.playerStatus.waifu
                    const response = getRandomElement(INTERACTION_DATA.kiss.responses)
                    
                    setTimeout(() => {
                        conn.sendMessage(m.from, { text: `Kamu perlahan mendekat ke ${user.playerStatus.waifu.name} dan memberikan ciuman lembut...` })
                    }, 1500)

                    const expGain = calculateExpGain(INTERACTION_DATA.kiss.expGain, waifu)
                    waifu.exp += expGain
                    waifu.interactions.kiss = Date.now()
                    
                    const newLevel = getRelationshipLevel(waifu.exp)
                    const leveledUp = newLevel > waifu.level
                    waifu.level = newLevel

                    if (Math.random() < 0.4) {
                        setMood(waifu, 'romantic', 'kiss')
                    }

                    db.users.update(m.sender, user)
                    db.save()

                    setTimeout(() => {
                        const currentMood = getCurrentMood(waifu)
                        const moodText = currentMood ? `\n• Mood: ${currentMood.name} ${currentMood.emoji}` : ''

                        conn.sendMessage(m.from, { text: `💋 *\`KISS ${waifu.name.toUpperCase()}\`*

${response}

• Exp: +${expGain} EXP${currentMood ? ` (${currentMood.multiplier}x mood bonus)` : ''}
• Level: ${waifu.level} (${RELATIONSHIP_LEVELS[waifu.level].name})
• Total EXP: ${waifu.exp}${moodText}${leveledUp ? `\n\n🎉 Relationship naik ke level ${waifu.level}: ${RELATIONSHIP_LEVELS[waifu.level].name}.` : ''}

Cooldown: ${formatTime(INTERACTION_DATA.kiss.cooldown)}`.trim() })
                    }, 5000)
                    return
                }

            case 'hug':
            case 'peluk':
                {
                    const interactionCheck = canInteract(user, 'hug')
                    if (!interactionCheck.can) {
                        caption = interactionCheck.reason
                        break
                    }

                    const waifu = user.playerStatus.waifu
                    const response = getRandomElement(INTERACTION_DATA.hug.responses)
                    
                    setTimeout(() => {
                        conn.sendMessage(m.from, { text: `Kamu merentangkan tangan dan memeluk ${user.playerStatus.waifu.name} dengan hangat...` })
                    }, 1500)

                    const expGain = calculateExpGain(INTERACTION_DATA.hug.expGain, waifu)
                    waifu.exp += expGain
                    waifu.interactions.hug = Date.now()

                    // Update daily quest progress
                    if (user.dailyQuests.quests.hug_quest && !user.dailyQuests.quests.hug_quest.completed) {
                        user.dailyQuests.quests.hug_quest.progress++
                        if (user.dailyQuests.quests.hug_quest.progress >= user.dailyQuests.quests.hug_quest.target) {
                            user.dailyQuests.quests.hug_quest.completed = true
                            user.playerInventory.items.uang += user.dailyQuests.quests.hug_quest.reward.money
                            waifu.exp += user.dailyQuests.quests.hug_quest.reward.exp
                        }
                    }
                    
                    const newLevel = getRelationshipLevel(waifu.exp)
                    const leveledUp = newLevel > waifu.level
                    waifu.level = newLevel

                    if (Math.random() < 0.3) {
                        setMood(waifu, 'happy', 'hug')
                    }

                    db.users.update(m.sender, user)
                    db.save()

                    setTimeout(() => {
                        const currentMood = getCurrentMood(waifu)
                        const moodText = currentMood ? `\n• Mood: ${currentMood.name} ${currentMood.emoji}` : ''

                        conn.sendMessage(m.from, { text: `🤗 *\`HUG ${waifu.name.toUpperCase()}\`*

${response}

• Exp: +${expGain} EXP${currentMood ? ` (${currentMood.multiplier}x mood bonus)` : ''}
• Level: ${waifu.level} (${RELATIONSHIP_LEVELS[waifu.level].name})
• Total EXP: ${waifu.exp}${moodText}${leveledUp ? `\n\n🎉 Relationship naik ke level ${waifu.level}: ${RELATIONSHIP_LEVELS[waifu.level].name}.` : ''}

${user.dailyQuests.quests.hug_quest && user.dailyQuests.quests.hug_quest.completed ? '✅ Daily Quest "Peluk 3 kali" selesai!' : ''}

Cooldown: ${formatTime(INTERACTION_DATA.hug.cooldown)}`.trim() })
                    }, 5000)
                    return
                }

            case 'date':
            case 'kencan':
                {
                    const interactionCheck = canInteract(user, 'date')
                    if (!interactionCheck.can) {
                        caption = interactionCheck.reason
                        break
                    }

                    const waifu = user.playerStatus.waifu
                    
                    setTimeout(() => {
                        conn.sendMessage(m.from, { text: `${waifu.name} terlihat excited mendengar ajakan kencan darimu...` })
                    }, 1500)

                    const story = await generateDatingStory(waifu)
                    const expGain = calculateExpGain(INTERACTION_DATA.date.expGain, waifu)
                    waifu.exp += expGain
                    waifu.interactions.date = Date.now()
                    
                    const newLevel = getRelationshipLevel(waifu.exp)
                    const leveledUp = newLevel > waifu.level
                    waifu.level = newLevel

                    if (Math.random() < 0.6) {
                        setMood(waifu, 'romantic', 'date')
                    }

                    db.users.update(m.sender, user)
                    db.save()

                    setTimeout(() => {
                        conn.sendMessage(m.from, { text: story })
                    }, 3000)
                    return
                }

            case 'fuck':
            case 'sex':
            case 'seks':
            case 'ewe':
            case 'entot':
            case 'entod':
                {
                    const interactionCheck = canInteract(user, 'fuck')
                    if (!interactionCheck.can) {
                        caption = interactionCheck.reason
                        break
                    }

                    const waifu = user.playerStatus.waifu
                    const response = getRandomElement(INTERACTION_DATA.fuck.responses)
                    
                    setTimeout(() => {
                        conn.sendMessage(m.from, { text: `Kamu dan ${waifu.name} saling menatap dalam-dalam... suasana mulai memanas...` })
                    }, 1500)

                    const expGain = calculateExpGain(INTERACTION_DATA.fuck.expGain, waifu)
                    waifu.exp += expGain
                    waifu.interactions.fuck = Date.now()
                    
                    const newLevel = getRelationshipLevel(waifu.exp)
                    const leveledUp = newLevel > waifu.level
                    waifu.level = newLevel

                    if (Math.random() < 0.8) {
                        setMood(waifu, 'romantic', 'fuck')
                    }

                    db.users.update(m.sender, user)
                    db.save()

                    setTimeout(() => {
                        const currentMood = getCurrentMood(waifu)
                        const moodText = currentMood ? `\n• Mood: ${currentMood.name} ${currentMood.emoji}` : ''

                        conn.sendMessage(m.from, { text: `🔥 *\`INTIM MOMENTO\`*

${response}

• Exp: +${expGain} EXP${currentMood ? ` (${currentMood.multiplier}x mood bonus)` : ''}
• Level: ${waifu.level} (${RELATIONSHIP_LEVELS[waifu.level].name})
• Total EXP: ${waifu.exp}${moodText}${leveledUp ? `\n\n🎉 Relationship naik ke level ${waifu.level}: ${RELATIONSHIP_LEVELS[waifu.level].name}.` : ''}

Cooldown: ${formatTime(INTERACTION_DATA.fuck.cooldown)}`.trim() })
                    }, 8000)
                    return
                }

            case 'game':
            case 'minigame':
                if (!hasValidWaifu(user)) {
                    caption = `Kamu belum punya waifu/husbu.`
                    break
                }

                if (!isUnlocked(user.playerStatus.waifu, 'game')) {
                    caption = `Fitur game belum terbuka. Butuh level ${Object.entries(RELATIONSHIP_LEVELS).find(([level, data]) => data.unlocks.includes('game'))?.[0] || 3}.`
                    break
                }

                const gameType = args[1]?.toLowerCase()
                const waifu = user.playerStatus.waifu
                
                if (!gameType) {
                    caption = `🎮 *\`MINI GAMES\`*



*Game yang tersedia:*
• *suit* - Batu Gunting Kertas
• *tebak* - Tebak Angka (1-50)

*Gunakan:* \`${prefix + command} game [nama game]\`

Main game bareng ${waifu.name} untuk dapetin EXP dan hadiah.`
                    break
                }

                if (gameType === 'suit') {
                    const playerChoice = args[2]?.toLowerCase()
                    const choices = ['batu', 'gunting', 'kertas']
                    
                    if (!playerChoice || !choices.includes(playerChoice)) {
                        caption = `🎮 *\`SUIT GAME\`*

*Gunkakan:* \`${prefix + command} game suit [batu/gunting/kertas]\`

${waifu.name}: "Ayo main suit! Pilih batu, gunting, atau kertas!"`
                        break
                    }

                    const waifuChoice = getRandomElement(choices)
                    const game = MINI_GAMES.suitGame
                    let result, reward, resultText
                    
                    if (playerChoice === waifuChoice) {
                        result = 'draw'
                        reward = game.drawReward
                        resultText = 'SERI!'
                    } else if (
                        (playerChoice === 'batu' && waifuChoice === 'gunting') ||
                        (playerChoice === 'gunting' && waifuChoice === 'kertas') ||
                        (playerChoice === 'kertas' && waifuChoice === 'batu')
                    ) {
                        result = 'win'
                        reward = game.winReward
                        resultText = 'KAMU MENANG!'
                    } else {
                        result = 'lose'
                        reward = game.loseReward
                        resultText = 'KAMU KALAH!'
                    }

                    const expGain = calculateExpGain(reward.exp, waifu)
                    waifu.exp += expGain
                    user.playerInventory.items.uang += reward.money
                    
                    const response = getRandomElement(game.responses[result])
                    
                    if (user.dailyQuests.quests.game_quest && !user.dailyQuests.quests.game_quest.completed) {
                        user.dailyQuests.quests.game_quest.progress++
                        if (user.dailyQuests.quests.game_quest.progress >= user.dailyQuests.quests.game_quest.target) {
                            user.dailyQuests.quests.game_quest.completed = true
                            user.playerInventory.items.uang += user.dailyQuests.quests.game_quest.reward.money
                            waifu.exp += user.dailyQuests.quests.game_quest.reward.exp
                        }
                    }

                    db.users.update(m.sender, user)

                    caption = `🎮 *\`SUIT GAME\`*

Kamu: ${playerChoice.toUpperCase()}
${waifu.name}: ${waifuChoice.toUpperCase()}

*${resultText}*

${waifu.name}: "${response}"

• EXP: +${expGain}
• Uang: +$${reward.money}${user.dailyQuests.quests.game_quest && user.dailyQuests.quests.game_quest.completed ? "\n\n✅ Daily Quest 'Main game bareng' telah selesai." : ''}`
                
                } else if (gameType === 'tebak') {
                    const playerGuess = parseInt(args[2])
                    
                    if (!playerGuess || playerGuess < 1 || playerGuess > 50) {
                        caption = `🎮 *\`TEBAK ANGKA\`*

*Gunakan:* \`${prefix + command} game tebak [1-50]\`

${waifu.name}: "Aku lagi mikirin angka 1-50... coba tebak ya!"`
                        break
                    }

                    const answer = Math.floor(Math.random() * 50) + 1
                    const game = MINI_GAMES.guessGame
                    let result, reward, resultText
                    
                    if (playerGuess === answer) {
                        result = 'win'
                        reward = game.winReward
                        resultText = 'BENAR!'
                    } else {
                        result = 'lose'
                        reward = game.loseReward
                        resultText = 'SALAH!'
                    }

                    const expGain = calculateExpGain(reward.exp, waifu)
                    waifu.exp += expGain
                    user.playerInventory.items.uang += reward.money
                    
                    const response = getRandomElement(game.responses[result]).replace('${answer}', answer)
                    
                    if (user.dailyQuests.quests.game_quest && !user.dailyQuests.quests.game_quest.completed) {
                        user.dailyQuests.quests.game_quest.progress++
                        if (user.dailyQuests.quests.game_quest.progress >= user.dailyQuests.quests.game_quest.target) {
                            user.dailyQuests.quests.game_quest.completed = true
                            user.playerInventory.items.uang += user.dailyQuests.quests.game_quest.reward.money
                            waifu.exp += user.dailyQuests.quests.game_quest.reward.exp
                        }
                    }

                    db.users.update(m.sender, user)

                    caption = `🎮 *\`TEBAK ANGKA\`*

Tebakanmu: ${playerGuess}
Jawabannya: ${answer}

*${resultText}*

${waifu.name}: "${response}"

• EXP: +${expGain}
• Uang: +$${reward.money}${user.dailyQuests.quests.game_quest && user.dailyQuests.quests.game_quest.completed ? "\n\n✅ Daily Quest 'Main game bareng' telah selesai." : ''}`
                }
                break

            case 'quest':
            case 'dailyquest':
                if (!hasValidWaifu(user)) {
                    caption = `Kamu belum punya waifu/husbu.`
                    break
                }

                const quests = user.dailyQuests.quests
                const questList = Object.entries(quests)
                
                if (questList.length === 0) {
                    caption = `📝 *\`DAILY QUESTS\`*

Tidak ada quest hari ini. Quest akan direset setiap hari.`
                } else {
                    caption = `📝 *\`DAILY QUESTS\`*

*Tanggal:* ${user.dailyQuests.date}\n\n`
                    
                    questList.forEach(([key, quest]) => {
                        const status = quest.completed ? '✅' : '❌'
                        const progress = quest.completed ? quest.target : quest.progress
                        
                        caption += `${status} *${quest.name}*\n`
                        caption += `• Progress: ${progress}/${quest.target}\n`
                        caption += `• Reward: ${quest.reward.exp} EXP, Uang $${quest.reward.money}\n`
                        caption += `• Deskripsi: ${quest.description}\n\n`
                    })
                    
                    const completedQuests = questList.filter(([key, quest]) => quest.completed).length
                    caption += `*Completed:* ${completedQuests}/${questList.length}`
                }
                break

            case 'top':
            case 'leaderboard':
                {
                    const allUsers = db.users.list()
                    const couples = []
        
                    allUsers.forEach(user => {
                        if (user.playerStatus?.waifu && hasValidWaifu(user)) {
                            const waifu = user.playerStatus.waifu
                            const daysTogether = Math.floor((Date.now() - waifu.dateSelected) / (1000 * 60 * 60 * 24))
                                        
                            couples.push({
                                username: user.playerInfo?.namaLengkap || user.nama || user.jid.split('@')[0],
                                waifuName: waifu.name,
                                level: waifu.level,
                                exp: waifu.exp,
                                days: daysTogether,
                                relationshipName: RELATIONSHIP_LEVELS[waifu.level]?.name || 'Unknown'
                            })
                        }
                    })
        
                    couples.sort((a, b) => b.exp - a.exp)
        
                    if (couples.length === 0) {
                        caption = `🏆 *\`TOP COUPLE\`*

            Belum ada couple yang terdaftar.`
                    } else {
                        caption = `🏆 *\`TOP COUPLE\`*\n\n`
            
                        couples.slice(0, 10).forEach((couple, index) => {
                            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
                
                            caption += `${medal} *${couple.username}* & *${couple.waifuName}*\n`
                            caption += `• Level: ${couple.level} (${couple.relationshipName})\n`
                            caption += `• EXP: ${couple.exp}\n`
                            caption += `• Bersama: ${couple.days} hari\n\n`
                        })
                    }
                }
                break

            case 'random':
                const randomChars = characterManager.getRandomCharacters(5)
                
                caption = `🎲 *\`KARAKTER ACAK\`*\n\n`
                
                randomChars.forEach((char, index) => {
                    caption += `*${index + 1}. ${char.name}*\n`
                    caption += `• Anime: ${char.anime}\n`
                    caption += `• Tipe: ${char.type || 'character'}\n\n`
                })
                
                caption += `*Gunakan:* \`${prefix + command} pilih [nomor]\``
                
                user.tempSearchResults = randomChars
                db.users.update(m.sender, user)
                break

            case 'ganti':
            case 'change':
                if (!user.membership.plus.status) {
                    caption = `Fitur ganti waifu hanya tersedia untuk member Plus atau lebih tinggi.`
                    break
                }
                
                if (!hasValidWaifu(user)) {
                    caption = `Kamu belum punya waifu/husbu untuk diganti.`
                    break
                }
                
                user.playerStatus.waifu = null
                db.users.update(m.sender, user)
                
                caption = `✅ Waifu/husbu berhasil dihapus. Kamu bisa pilih yang baru dengan \`${prefix + command} cari [nama]\``
                break

            case 'help':
            case 'menu':
            default:
                caption = `💖 *\`DAFTAR PERINTAH\`*

*Contoh:* \`${prefix + command} cari miku\`
*Prefix:* \`${prefix}\`

*Pencarian & Pilihan*
• \`${command} cari\` - Cari karakter
• \`${command} random\` - Karakter acak
• \`${command} pilih\` - Pilih karakter

*Interact*
• \`${command} profile\` - Lihat profil partner
• \`${command} hug\` - Peluk partner (+10 exp)
• \`${command} kiss\` - Kiss partner (+15 exp)
• \`${command} date\` - Kencan romantis (+25 exp)
• \`${command} fuck\` - Intimate moment (+50 exp)

*Aktivitas*
• \`${command} gift\` - Beri hadiah
• \`${command} mood\` - Lihat mood partner
• \`${command} game\` - Mini games
• \`${command} quest\` - Daily quests
• \`${command} event\` - Lihat event aktif
• \`${command} top\` - Top couples

*Setting*
• \`${command} ganti\` - Ganti waifu (Plus only)

*Relationship Level*
${Object.entries(RELATIONSHIP_LEVELS).map(([level, data]) => 
    `• Level ${level}: ${data.name} (${data.exp} EXP)`
).join('\n')}

*Tips:*
- Interact secara rutin untuk meningkatkan EXP
- Mood mempengaruhi bonus EXP
- Event memberikan bonus khusus
- Complete daily quest untuk reward`
                break
        }

        if (caption) {
            await conn.sendMessage(m.from, { text: caption.trim() })
        }

        db.save()
    }
}