import fs from 'fs'

export const cmd = {
    name: ['grow'],
    command: ['grow'],
    category: ['roleplay'], 
    detail: {
        desc: 'Grow a Garden'
    },
    setting: {
        isRegister: true,
        isBanned: false,
        isJail: false
    },
    async start({ m, db, prefix, command, conn, args }) {
        const farmDbPath = 'json/farm.json'
        
        let farmDb = {}
        if (fs.existsSync(farmDbPath)) {
            farmDb = JSON.parse(fs.readFileSync(farmDbPath, 'utf8'))
        }
        
        const userId = m.sender
        const user = db.users.get(userId)

        const subCommand = args[0]?.toLowerCase()

        if (!user.playerStatus.pekerjaan.includes('Farmer') && subCommand === 'register') {
            return registerFarmer(m, db, user)
        }

        if (user.playerStatus.pekerjaan.includes('Farmer') && subCommand === 'quit') {
            return quitFarmer(m, db, user)
        }
        
        if (!user.playerStatus.pekerjaan.includes('Farmer')) {
            return m.reply(`Kamu harus menjadi farmer terlebih dahulu.\nGunakan: \`${ prefix + command } register\``)
        }
        
        // farmer db
        if (user.playerStatus.pekerjaan.includes('Farmer') && !farmDb[userId]) {
            farmDb[userId] = {
                garden: {
                    size: { width: 3, height: 2 }, // 3x2 plot
                    plots: Array(6).fill(null).map((_, i) => ({
                        id: i,
                        crop: null,
                        plantedAt: null,
                        wateredAt: null,
                        harvestReady: false,
                        mutation: null
                    }))
                },
                inventory: {
                    seeds: {},
                    gear: {},
                    crops: {},
                    pets: {}
                },
                stats: {
                    level: 1,
                    experience: 0,
                    totalHarvests: 0,
                    totalMutations: 0,
                    joinedAt: Date.now()
                },
                quests: {
                    daily: [],
                    weekly: [],
                    lastDailyReset: 0,
                    lastWeeklyReset: 0
                },
                achievements: [],
                settings: {
                    autoWater: false,
                    notifications: true
                }
            }
        } else if (!user.playerStatus.pekerjaan.includes('Farmer') && farmDb[userId]) {
            delete farmDb[userId]
        }
        
        // global shop db
        if (!farmDb.globalData) {
            farmDb.globalData = {
                shops: {
                    seedShop: {
                        stock: generateSeedStock(),
                        lastRestock: Date.now()
                    },
                    gearShop: {
                        stock: generateGearStock(), 
                        lastRestock: Date.now()
                    },
                    limitedShop: {
                        stock: generateLimitedStock(),
                        lastRestock: Date.now()
                    }
                },
                events: {
                    current: null,
                    weather: getRandomWeather(),
                    lastWeatherChange: Date.now()
                },
                leaderboard: {},
                npcs: generateNPCs()
            }
        }
        
        const playerData = farmDb[userId]
        const globalData = farmDb.globalData

        if (!playerData.inventory) playerData.inventory = {}
        if (!playerData.inventory.seeds) playerData.inventory.seeds = {}
        if (!playerData.inventory.gear) playerData.inventory.gear = {}
        if (!playerData.inventory.crops) playerData.inventory.crops = {}
        if (!playerData.inventory.pets) playerData.inventory.pets = {}

        
        // shop restock (tiap 10 menit)
        checkShopRestocks(globalData)
        
        // weather changes (tiap 30 mnit)
        checkWeatherChange(globalData)
        
        // updte daily/weekly quest
        updateQuests(playerData)

        // pet effect
        if (playerData?.inventory?.pets && Object.keys(playerData.inventory.pets).length === 0) {
            checkPetEffects(playerData)
        }
        
        switch (subCommand) {
            case 'garden':
            case 'farm':
                return showGarden(m, playerData, globalData)
                
            case 'plant':
                return plantSeed(m, prefix, command, subCommand, args[1], args[2], playerData, globalData)
                
            case 'water':
                return waterPlants(m, prefix, command, subCommand, args[1], playerData)
                
            case 'harvest':
                return harvestCrops(m, prefix, command, subCommand, args[1], playerData, globalData, user, db)
                
            case 'shop':
            case 'store':
                return showShop(m, prefix, command, args[1], playerData, globalData)
                
            case 'buy':
                return buyItem(m, prefix, command, subCommand, args[1], args[2], args[3], playerData, globalData, user, db)
                
            case 'sell':
                return sellItem(m, prefix, command, subCommand, args[1], args[2], playerData, globalData, user, db)
                
            case 'inventory':
            case 'inv':
                return showInventory(m, playerData)
                
            case 'gear':
                return useGear(m, prefix, command, subCommand, args[1], args[2], playerData, globalData)
                
            case 'quest':
            case 'quests':
                return showQuests(m, playerData)
                
            case 'pet':
            case 'pets':
                if (playerData.context?.waitingForPetActivation) {
                    if (Date.now() > playerData.context.petActivationExpires) {
                        delete playerData.context.waitingForPetActivation
                        delete playerData.context.petActivationExpires
                        return m.reply('Waktu untuk aktivasi pet telah habis.')
                    }
                    return handlePetActivationResponse(m, playerData, args[1])
                }
                return managePets(m, conn, prefix, command, subCommand, args[1], playerData)
                
            case 'trade':
                return tradeWithPlayer(m, conn, prefix, command, args, playerData, farmDb, user, db)
                
            case 'expand':
                return expandGarden(m, playerData, user, db)
                
            case 'leaderboard':
            case 'lb':
                return showLeaderboard(m, globalData, farmDb)
                
            case 'weather':
                return showWeather(m, globalData) 
                
            case 'help':
            default:
                return showHelp(m, conn, prefix, command)
        }
        
        function saveFarmDb() {
            fs.writeFileSync(farmDbPath, JSON.stringify(farmDb, null, 2))
        }
        
        function generateSeedStock() {
            const seeds = {
                'wheat': { price: 10, stock: 50, growTime: 300000, sellPrice: 25, rarity: 'common' },
                'carrot': { price: 15, stock: 40, growTime: 450000, sellPrice: 35, rarity: 'common' },
                'potato': { price: 20, stock: 35, growTime: 600000, sellPrice: 50, rarity: 'common' },
                'tomato': { price: 35, stock: 25, growTime: 900000, sellPrice: 85, rarity: 'uncommon' },
                'corn': { price: 50, stock: 20, growTime: 1200000, sellPrice: 125, rarity: 'uncommon' },
                'pumpkin': { price: 100, stock: 10, growTime: 1800000, sellPrice: 250, rarity: 'rare' },
                'strawberry': { price: 150, stock: 8, growTime: 2100000, sellPrice: 350, rarity: 'rare' },
                'rainbow_seed': { price: 500, stock: 3, growTime: 3600000, sellPrice: 1200, rarity: 'legendary' }
            }
            return seeds
        }
        
        function generateGearStock() {
            const gear = {
                'basic_sprinkler': { price: 100, stock: 20, uses: 10, effect: 'growth_speed', power: 1.2, rarity: 'common' },
                'advanced_sprinkler': { price: 300, stock: 15, uses: 15, effect: 'growth_speed', power: 1.5, rarity: 'uncommon' },
                'godly_sprinkler': { price: 1000, stock: 5, uses: 25, effect: 'growth_speed', power: 2.0, rarity: 'rare' },
                'master_sprinkler': { price: 2500, stock: 2, uses: 50, effect: 'growth_speed', power: 3.0, rarity: 'legendary' },
                'lightning_rod': { price: 200, stock: 10, uses: 5, effect: 'shocked_mutation', power: 0.3, rarity: 'uncommon' },
                'fertilizer': { price: 50, stock: 30, uses: 1, effect: 'instant_growth', power: 1.0, rarity: 'common' },
                'mutation_booster': { price: 400, stock: 8, uses: 3, effect: 'mutation_chance', power: 0.5, rarity: 'rare' },
                'plot_expander': { price: 1500, stock: 3, uses: 1, effect: 'expand_garden', power: 1, rarity: 'epic' }
            }
            return gear
        }
        
        function generateLimitedStock() {
            const limited = {
                'daily_pack': { price: 200, stock: 5, resetDaily: true, contents: ['random_seed', 'fertilizer', 'coins'] },
                'event_gear': { price: 800, stock: 2, resetDaily: false, contents: ['chocolate_sprinkler'] },
                'pet_food': { price: 100, stock: 10, resetDaily: true, contents: ['pet_boost'] }
            }
            return limited
        }
        
        function generateNPCs() {
            return {
                'farmer_joe': { 
                    name: 'Farmer Joe', 
                    type: 'seed_trader',
                    dialogue: 'Apa kabar kawan! Aku ada beberapa seeds yang bagus untuk kamu nih!',
                    trades: ['wheat', 'carrot', 'potato']
                },
                'gadget_gary': {
                    name: 'Gadget Gary',
                    type: 'gear_trader', 
                    dialogue: 'Kamu butuh peralatan buat farming? Aku ada nih!',
                    trades: ['basic_sprinkler', 'fertilizer', 'lightning_rod']
                },
                'mystic_mary': {
                    name: 'Mystic Mary',
                    type: 'mutation_expert',
                    dialogue: 'The plants whisper their secrets to me...',
                    trades: ['mutation_booster', 'rainbow_seed']
                },
                'trader_tom': {
                    name: 'Trader Tom', 
                    type: 'crop_buyer',
                    dialogue: 'Akan kubeli hasil panen terbaik kamu dengan harga premium!',
                    buyMultiplier: 1.2
                },
                'quest_giver_quinn': {
                    name: 'Quest Giver Quinn',
                    type: 'quest_master',
                    dialogue: 'Saya memiliki tugas yang harus dikerjakan. Apa kamu tertarik?',
                    quests: ['daily', 'weekly', 'special']
                }
            }
        }
        
        function checkShopRestocks(globalData) {
            const now = Date.now()
            const restockInterval = 10 * 60 * 1000 // 10 mmnnt
            
            Object.keys(globalData.shops).forEach(shopType => {
                const shop = globalData.shops[shopType]
                if (now - shop.lastRestock >= restockInterval) {
                    switch(shopType) {
                        case 'seedShop':
                            shop.stock = generateSeedStock()
                            break
                        case 'gearShop':
                            shop.stock = generateGearStock()
                            break
                        case 'limitedShop':
                            shop.stock = generateLimitedStock()
                            break
                    }
                    shop.lastRestock = now
                }
            })

            saveFarmDb()
        }
        
        function getRandomWeather() {
            const weathers = ['sunny', 'rainy', 'stormy', 'snowy', 'foggy', 'windy']
            const weights = [40, 25, 10, 10, 10, 5]
            
            let random = Math.random() * 100
            for (let i = 0; i < weathers.length; i++) {
                random -= weights[i]
                if (random <= 0) return weathers[i]
            }
            return 'sunny'
        }
        
        function checkWeatherChange(globalData) {
            const now = Date.now()
            const weatherInterval = 30 * 60 * 1000
            
            if (now - globalData.events.lastWeatherChange >= weatherInterval) {
                globalData.events.weather = getRandomWeather()
                globalData.events.lastWeatherChange = now
            }

            saveFarmDb()
        }
        
        function updateQuests(playerData) {
            const now = Date.now()
            const oneDayMs = 24 * 60 * 60 * 1000
            const oneWeekMs = 7 * oneDayMs

            if (!playerData.quests) {
                playerData.quests = {
                    daily: [],
                    weekly: [],
                    lastDailyReset: 0,
                    lastWeeklyReset: 0
                }
            }
            
            // reset daily quests
            if (now - playerData.quests.lastDailyReset >= oneDayMs) {
                playerData.quests.daily = generateDailyQuests()
                playerData.quests.lastDailyReset = now
            }
            
            // reset weekly quests  
            if (now - playerData.quests.lastWeeklyReset >= oneWeekMs) {
                playerData.quests.weekly = generateWeeklyQuests()
                playerData.quests.lastWeeklyReset = now
            }

            saveFarmDb()
        }
        
        function generateDailyQuests() {
            const quests = [
                { type: 'harvest', target: 5, progress: 0, reward: { coins: 100, exp: 50 } },
                { type: 'plant', target: 3, progress: 0, reward: { coins: 75, exp: 30 } },
                { type: 'water', target: 10, progress: 0, reward: { coins: 50, exp: 25 } }
            ]
            return quests.slice(0, 2)
        }
        
        function generateWeeklyQuests() {
            const quests = [
                { type: 'harvest_mutations', target: 3, progress: 0, reward: { coins: 500, exp: 200, item: 'mutation_booster' } },
                { type: 'sell_crops', target: 1000, progress: 0, reward: { coins: 800, exp: 300 } },
                { type: 'expand_garden', target: 1, progress: 0, reward: { coins: 1000, exp: 500, item: 'advanced_sprinkler' } }
            ]
            return [quests[Math.floor(Math.random() * quests.length)]]
        }

        function registerFarmer(m, db, user) {
            const pekerjaan = user.playerStatus.pekerjaan
            const newJob = [...pekerjaan, 'Farmer']
            user.playerStatus.pekerjaan = newJob
        
            db.users.update(user, pekerjaan)
            db.save()

            m.reply('Selamat! Kamu telah menjadi Farmer. Kebun telah dibuat dengan ukuran 3x2')
        }
        
        function quitFarmer(m, db, user) {
            const pekerjaan = user.playerStatus.pekerjaan
            user.playerStatus.pekerjaan = pekerjaan.filter(p => p !== 'Farmer')
        
            db.users.update(user, pekerjaan)
            db.save()

            m.reply('Kamu telah keluar dari pekerjaan Farmer.')
        }
        
        async function showGarden(m, playerData, globalData) {
            const garden = playerData.garden
            const weather = globalData.events.weather
            
            let gardenView = `🌱 *\`GROW A GARDEN\`*\n\n`
            gardenView += `• Farmer: ${m.pushName}\n`
            gardenView += `• Weather: ${getWeatherEmoji(weather)} ${weather.toUpperCase()}\n`
            gardenView += `• Garden Size: ${garden.size.width}x${garden.size.height}\n`
            gardenView += `• Level: ${playerData.stats.level}\n`
            gardenView += `• Total Harvests: ${playerData.stats.totalHarvests}\n\n`
            
            gardenView += `🌾 \`GARDEN LAYOUT:\`\n`
            for (let row = 0; row < garden.size.height; row++) {
                let rowView = ''
                for (let col = 0; col < garden.size.width; col++) {
                    const plotIndex = row * garden.size.width + col
                    const plot = garden.plots[plotIndex]
                    
                    if (!plot.crop) {
                        rowView += '🟫 '
                    } else {
                        const progress = getCropProgress(plot)
                        if (plot.harvestReady) {
                            rowView += plot.mutation ? '✨ ' : '🌾 '
                        } else {
                            rowView += progress < 0.3 ? '🌱 ' : progress < 0.7 ? '🌿 ' : '🌾 '
                        }
                    }
                }
                gardenView += `${rowView}\n`
            }
            
            gardenView += `\n📋 *\`DAFTAR PERINTAH\`*\n`
            gardenView += `• ${command} plant [seed] [petak] - Tanam seed\n`
            gardenView += `• ${command} water [petak|all] - Sirami tanaman\n` 
            gardenView += `• ${command} harvest [petak|all] - Harvest tanaman\n`
            gardenView += `• ${command} shop - Visit shop\n`
            gardenView += `• ${command} inventory - Cek inventory\n`
            gardenView += `• ${command} help - Semua perintah`
            
            saveFarmDb()
            return m.reply(gardenView.trim())
        }
        
        async function plantSeed(m, prefix, command, cmd, seedName, plotId, playerData, globalData) {
            if (!seedName || !plotId) {
                return m.reply(`*Gunakan:* \`${prefix + command} ${cmd} [nama_seed] [nomor_petak]\`\n*Contoh:* \`${prefix + command} ${cmd} wheat 1\``)
            }
            
            const plotIndex = parseInt(plotId) - 1
            if (plotIndex < 0 || plotIndex >= playerData.garden.plots.length) {
                return m.reply('Nomor petak tidak valid.')
            }
            
            const plot = playerData.garden.plots[plotIndex]
            if (plot.crop) {
                return m.reply('Lahan petak ini sudah ada tanamannya. Harvest lah terlebih dahulu.')
            }
            
            if (!playerData.inventory.seeds[seedName] || playerData.inventory.seeds[seedName] <= 0) {
                return m.reply(`Kamu tidak punya seed ${seedName}. Belilah beberapa melalui shop.`)
            }
            
            const seedData = globalData.shops.seedShop.stock[seedName]
            if (!seedData) {
                return m.reply('Jenis seed tidak diketahui')
            }
            
            plot.crop = seedName
            plot.plantedAt = Date.now()
            plot.wateredAt = null
            plot.harvestReady = false
            plot.mutation = null
            
            playerData.inventory.seeds[seedName]--
            
            updateQuestProgress(playerData, 'plant', 1)
            
            saveFarmDb()
            return m.reply(`Berhasil menanam seed ${seedName} pada petak ${plotId}.\nWaktu Pertumbuhan sekitar ${Math.round(seedData.growTime / 60000)} menit`)
        }
        
        async function waterPlants(m, prefix, command, cmd, plotId, playerData) {
            if (!plotId) {
                return m.reply(`*Gunakan:* \`${prefix + command} ${cmd} [nomor_petak/all]\`\n*Contoh:* \`${prefix + command} ${cmd} 1\` atau \`${prefix + command} ${cmd} all\``)
            }
            
            const now = Date.now()
            let wateredCount = 0
            
            if (plotId.toLowerCase() === 'all') {
                playerData.garden.plots.forEach(plot => {
                    if (plot.crop && !plot.harvestReady) {
                        plot.wateredAt = now
                        wateredCount++
                    }
                })
            } else {
                const plotIndex = parseInt(plotId) - 1
                if (plotIndex < 0 || plotIndex >= playerData.garden.plots.length) {
                    return m.reply('Nomor petak tidak valid.')
                }
                
                const plot = playerData.garden.plots[plotIndex]
                if (!plot.crop) {
                    return m.reply('Tidak ada tanaman di petak ini.')
                }
                
                if (plot.harvestReady) {
                    return m.reply('Tanaman pada petak ini siap untuk di harvest.')
                }
                
                plot.wateredAt = now
                wateredCount = 1
            }
            
            if (wateredCount === 0) {
                return m.reply('Tidak ada tanaman yang perlu disiram pada petak ini.')
            }
            
            updateQuestProgress(playerData, 'water', wateredCount)
            
            saveFarmDb()
            return m.reply(`Berhasil menyiram ${wateredCount} tanaman. Ini akan meningkatkan pertumbuhan mereka.`)
        }
        
        async function harvestCrops(m, prefix, command, cmd, plotId, playerData, globalData, user, db) {
            if (!plotId) {
                return m.reply(`*Gunakan:* \`${prefix + command} ${cmd} [nomor_petak/all]\`\n*Contoh:* \`${prefix + command} ${cmd} 1\` atau \`${prefix + command} ${cmd} all\``)
            }
            
            let harvestedCrops = []
            let totalEarnings = 0
            
            if (plotId.toLowerCase() === 'all') {
                playerData.garden.plots.forEach((plot, index) => {
                    if (plot.crop && isReadyToHarvest(plot, globalData)) {
                        const result = harvestPlot(plot, playerData, globalData)
                        if (result) {
                            harvestedCrops.push({...result, plotId: index + 1})
                            totalEarnings += result.earnings
                        }
                    }
                })
            } else {
                const plotIndex = parseInt(plotId) - 1
                if (plotIndex < 0 || plotIndex >= playerData.garden.plots.length) {
                    return m.reply('Nomor petak tidak valid.')
                }
                
                const plot = playerData.garden.plots[plotIndex]
                if (!plot.crop) {
                    return m.reply('Tidak ada tanaman di petak ini.')
                }
                
                if (!isReadyToHarvest(plot, globalData)) {
                    const timeLeft = getTimeUntilHarvest(plot, globalData)
                    return m.reply(`Tanaman ini belum siap untuk di harvest. Waktu yang tersisa sekitar ${timeLeft}`)
                }
                
                const result = harvestPlot(plot, playerData, globalData)
                if (result) {
                    harvestedCrops.push({...result, plotId: plotIndex + 1})
                    totalEarnings += result.earnings
                }
            }
            
            if (harvestedCrops.length === 0) {
                return m.reply('Tidak ada tanaman yang siap untuk di harvest.')
            }
            
            user.playerInventory.items.uang += totalEarnings
            db.users.update(m.sender, user)
            
            playerData.stats.totalHarvests += harvestedCrops.length
            updateQuestProgress(playerData, 'harvest', harvestedCrops.length)
            
            const mutatedCrops = harvestedCrops.filter(crop => crop.mutation)
            if (mutatedCrops.length > 0) {
                playerData.stats.totalMutations += mutatedCrops.length
                updateQuestProgress(playerData, 'harvest_mutations', mutatedCrops.length)
            }
            
            let harvestMsg = `🌾 *\`HARVEST SELESAI\`*\n\n`
            harvestMsg += `• Total Pendapatan: $${totalEarnings}\n`
            harvestMsg += `• Harvest ${harvestedCrops.length} tanaman:\n\n`
            
            harvestedCrops.forEach(crop => {
                harvestMsg += `• Plot ${crop.plotId}: ${crop.cropName}`
                if (crop.mutation) {
                    harvestMsg += ` ✨(${crop.mutation.toUpperCase()})`
                }
                harvestMsg += ` - $${crop.earnings}\n`
            })
            
            saveFarmDb()
            return m.reply(harvestMsg.trim())
        }
        
        function isReadyToHarvest(plot, globalData) {
            if (!plot.crop || !plot.plantedAt) return false
            
            const seedData = globalData.shops.seedShop.stock[plot.crop]
            if (!seedData) return false
            
            let growTime = seedData.growTime
            
            if (plot.wateredAt && (Date.now() - plot.wateredAt) < 3600000) { // 1 hour watering effect
                growTime *= 0.8 // 20% faster growth when watered
            }
            
            if (globalData.events.weather === 'rainy') {
                growTime *= 0.9 // 10% faster in rain
            } else if (globalData.events.weather === 'sunny') {
                growTime *= 0.95 // 5% faster in sun
            }
            
            return (Date.now() - plot.plantedAt) >= growTime
        }
        
        function getCropProgress(plot) {
            if (!plot.crop || !plot.plantedAt) return 0
            
            const elapsed = Date.now() - plot.plantedAt
            const seedData = globalData.shops.seedShop.stock[plot.crop]
            if (!seedData) return 0
            
            return Math.min(elapsed / seedData.growTime, 1)
        }
        
        function getTimeUntilHarvest(plot, globalData) {
            if (!plot.crop || !plot.plantedAt) return "Unknown"
            
            const seedData = globalData.shops.seedShop.stock[plot.crop]
            if (!seedData) return "Unknown"
            
            const elapsed = Date.now() - plot.plantedAt
            const remaining = seedData.growTime - elapsed
            
            if (remaining <= 0) return "Siap Panen!"
            
            const minutes = Math.ceil(remaining / 60000)
            return `${minutes} menit`
        }
        
        function harvestPlot(plot, playerData, globalData) {
            const seedData = globalData.shops.seedShop.stock[plot.crop]
            if (!seedData) return null
            
            const mutation = checkForMutation(plot, globalData)
            
            let earnings = seedData.sellPrice
            if (mutation) {
                earnings *= getMutationMultiplier(mutation)
                plot.mutation = mutation
            }
            
            const cropKey = plot.crop + (mutation ? `_${mutation}` : '')
            if (!playerData.inventory.crops[cropKey]) {
                playerData.inventory.crops[cropKey] = 0
            }
            playerData.inventory.crops[cropKey]++
            
            const result = {
                cropName: plot.crop,
                mutation: mutation,
                earnings: Math.round(earnings)
            }
            
            plot.crop = null
            plot.plantedAt = null
            plot.wateredAt = null
            plot.harvestReady = false
            plot.mutation = null
            
            return result
        }
        
        function checkForMutation(plot, globalData) {
            const baseMutationChance = 0.05 // 5% base chance
            let mutationChance = baseMutationChance
            
            switch (globalData.events.weather) {
                case 'stormy':
                    if (Math.random() < 0.3) return 'shocked'
                    break
                case 'snowy':
                    if (Math.random() < 0.2) return 'frozen'
                    break
                case 'rainy':
                    if (Math.random() < 0.15) return 'wet'
                    break
                case 'foggy':
                    if (Math.random() < 0.1) return 'moonlit'
                    break
            }
            
            if (Math.random() < mutationChance) {
                const mutations = ['gold', 'big', 'rainbow', 'chilled', 'disco', 'bloodlit', 'celestial', 'zombified']
                return mutations[Math.floor(Math.random() * mutations.length)]
            }
            
            return null
        }
        
        function getMutationMultiplier(mutation) {
            const multipliers = {
                'gold': 2.0,
                'wet': 1.2,
                'frozen': 1.3,
                'chilled': 1.25,
                'shocked': 1.4,
                'rainbow': 3.0,
                'big': 1.5,
                'moonlit': 1.8,
                'disco': 2.2,
                'bloodlit': 2.5,
                'celestial': 4.0,
                'zombified': 1.1
            }
            return multipliers[mutation] || 1.0
        }
        
        async function showShop(m, prefix, command, shopType, playerData, globalData) {
            if (!shopType) {
                let shopMsg = `🏪 *\`FARMING SHOP\`*\n\n`
                shopMsg += `Contoh: \`${prefix + command} shop seed\`\n`
                shopMsg += `Prefix: \`${prefix}\`\n\n`
                shopMsg += `• \`Toko Seed\` - Beli seed untuk ditanam\n`
                shopMsg += `• \`Toko Gear\` - Peralatan & gear farming\n`
                shopMsg += `• \`Toko Sell\` - Jual hasil panen untuk mendapat uang\n`
                shopMsg += `• \`Toko Limited\` - Item harian khusus\n`
                shopMsg += `• \`NPC Trader\` - Penawaran khusus dari NPC`
                
                return m.reply(shopMsg.trim())
            }
            
            switch (shopType.toLowerCase()) {
                case 'seed':
                case 'seeds':
                    return showSeedShop(m, prefix, command, shopType, globalData)
                case 'gear':
                case 'equipment':
                    return showGearShop(m, prefix, command, shopType, globalData)
                case 'sell':
                    return showSellShop(m, prefix, command, shopType, playerData, globalData)
                case 'limited':
                case 'special':
                    return showLimitedShop(m, prefix, command, shopType, globalData)
                case 'npc':
                case 'trader':
                    return showNPCTraders(m, prefix, command, shopType, globalData)
                default:
                    return m.reply('Tipe tidak diketahui. Gunakan: `seed, gear, sell, limited, atau npc`')
            }
        }
        
        async function showSeedShop(m, prefix, command, cmd, globalData) {
            const shop = globalData.shops.seedShop
            const nextRestock = 600000 - (Date.now() - shop.lastRestock)
            const restockTime = Math.max(0, Math.ceil(nextRestock / 60000))
            
            let shopMsg = `🌱 *\`SEED SHOP\`*\n\n`
            shopMsg += `• Next Restock: ${restockTime} menit\n\n`
            
            Object.entries(shop.stock).forEach(([seed, data]) => {
                const rarity = getRarityEmoji(data.rarity)
                shopMsg += `${rarity} *${seed.toUpperCase()}*\n`
                shopMsg += `• Harga: $${data.price} | • Stock: ${data.stock}\n`
                shopMsg += `• Waktu Tumbuh: ${Math.round(data.growTime / 60000)}m | • Sell: $${data.sellPrice}\n\n`
            })
            
            shopMsg += `Gunakan: \`${prefix + command} buy ${cmd} [nama_item] [jumlah]\``
            return m.reply(shopMsg.trim())
        }
        
        async function showGearShop(m, prefix, command, cmd, globalData) {
            const shop = globalData.shops.gearShop
            const nextRestock = 600000 - (Date.now() - shop.lastRestock)
            const restockTime = Math.max(0, Math.ceil(nextRestock / 60000))
            
            let shopMsg = `⚙️ *\`GEAR SHOP\`*\n\n`
            shopMsg += `• Next Restock: ${restockTime} menit\n\n`
            
            Object.entries(shop.stock).forEach(([item, data]) => {
                const rarity = getRarityEmoji(data.rarity)
                shopMsg += `${rarity} *${item.toUpperCase().replace(/_/g, ' ')}*\n`
                shopMsg += `• Harga: $${data.price} | • Stock: ${data.stock}\n`
                shopMsg += `• Pemakaian: ${data.uses}x | • Efek: ${data.effect.replace(/_/g, ' ')}\n\n`
            })
            
            shopMsg += `Gunakan: \`${prefix + command} buy ${cmd} [nama_item] [jumlah]\``
            return m.reply(shopMsg.trim())
        }
        
        async function showSellShop(m, prefix, command, cmd, playerData, globalData) {
            let sellMsg = `💰 *\`SELL SHOP\`*\n\n`
            sellMsg += `*Hasil Panen:*\n`
            
            if (Object.keys(playerData.inventory.crops).length === 0) {
                sellMsg += `• Tidak ada hasil panen untuk dijual. Harvestlah terlebih dahulu.\n\n`
            } else {
                Object.entries(playerData.inventory.crops).forEach(([crop, amount]) => {
                    if (amount > 0) {
                        const basePrice = getBestSellPrice(crop, globalData)
                        sellMsg += `🌾 ${crop.replace(/_/g, ' ').toUpperCase()}: ${amount}x\n`
                        sellMsg += `• Harga: $${basePrice} per satu\n\n`
                    }
                })
            }
            
            sellMsg += `Gunakan: \`${prefix + command} ${cmd} [nama_item] [jumlah]\``
            return m.reply(sellMsg.trim())
        }
        
        async function showLimitedShop(m, prefix, command, cmd, globalData) {
            const shop = globalData.shops.limitedShop
            
            let shopMsg = `⭐ *\`LIMITED SHOP\`* ⭐\n\n`
            
            Object.entries(shop.stock).forEach(([item, data]) => {
                shopMsg += `🎁 *${item.toUpperCase().replace(/_/g, ' ')}*\n`
                shopMsg += `• Harga: $${data.price} | • Stock: ${data.stock}\n`
                shopMsg += `• Termasuk: ${data.contents.join(', ')}\n`
                if (data.resetDaily) shopMsg += `🔄 Reset Daily\n`
                shopMsg += `\n`
            })
            
            shopMsg += `Gunakan: \`${prefix + command} buy ${cmd} [nama_item]\``
            return m.reply(shopMsg.trim())
        }
        
        async function showNPCTraders(m, prefix, command, cmd, globalData) {
            let npcMsg = `👨‍🌾 *\`NPC TRADER\`*\n\n`
            
            Object.entries(globalData.npcs).forEach(([npcId, npc]) => {
                npcMsg += `👤 *${npc.name}*\n`
                npcMsg += `💬 "${npc.dialogue}"\n`
                npcMsg += `• Tipe: ${npc.type.replace(/_/g, ' ')}\n`
                
                if (npc.trades) {
                    npcMsg += `• Item Trade: ${npc.trades.join(', ')}\n`
                }
                if (npc.buyMultiplier) {
                    npcMsg += `• Rate Beli: ${npc.buyMultiplier}x harga normal\n`
                }
                npcMsg += `\n`
            })
            
            npcMsg += `Gunakan: \`${prefix + command} ${cmd} npc [nama_npc] [nama_item] [jumlah]\``
            return m.reply(npcMsg.trim())
        }
        
        async function buyItem(m, prefix, command, cmd, shopType, itemName, amount, playerData, globalData, user, db) {
            if (!shopType || !itemName) {
                return m.reply(`*Gunakan:* \`${prefix + command} ${cmd} [tipe_toko] [nama_item] [jumlah]\`\n*Contoh:* \`${prefix + command} ${cmd} seed wheat 5\``)
            }
            
            const quantity = parseInt(amount) || 1
            if (quantity <= 0) {
                return m.reply('Jumlah tidak valid.')
            }
            
            const userMoney = user.playerInventory.items.uang
            
            switch (shopType.toLowerCase()) {
                case 'seed':
                case 'seeds':
                    const seedShop = globalData.shops.seedShop
                    const seed = seedShop.stock[itemName.toLowerCase()]
                    
                    if (!seed) {
                        return m.reply('Seed tidak ditemukan.')
                    }
                    
                    if (seed.stock < quantity) {
                        return m.reply(`Stock tidak cukup. Hanya tersedia ${seed.stock} stock`)
                    }
                    
                    const seedCost = seed.price * quantity
                    if (userMoney < seedCost) {
                        return m.reply(`Uang tidak cukup. Kamu butuh $${seedCost}`)
                    }
                    
                    user.playerInventory.items.uang -= seedCost
                    db.users.update(m.sender, user)
                    
                    seed.stock -= quantity
                    
                    if (!playerData.inventory.seeds[itemName.toLowerCase()]) {
                        playerData.inventory.seeds[itemName.toLowerCase()] = 0
                    }
                    playerData.inventory.seeds[itemName.toLowerCase()] += quantity
                    
                    saveFarmDb()
                    return m.reply(`Berhasil membeli ${quantity}x ${itemName} seed seharga $${seedCost}`)
                    
                case 'gear':
                case 'equipment':
                    const gearShop = globalData.shops.gearShop
                    const gear = gearShop.stock[itemName.toLowerCase()]
                    
                    if (!gear) {
                        return m.reply('Gear tidak ditemukan.')
                    }
                    
                    if (gear.stock < quantity) {
                        return m.reply(`Stock tidak cukup. Hanya tersedia ${gear.stock} stock`)
                    }
                    
                    const gearCost = gear.price * quantity
                    if (userMoney < gearCost) {
                        return m.reply(`Uang tidak cukup. Kamu butuh $${gearCost}`)
                    }
                    
                    user.playerInventory.items.uang -= gearCost
                    db.users.update(m.sender, user)
                    
                    gear.stock -= quantity
                    
                    if (!playerData.inventory.gear[itemName.toLowerCase()]) {
                        playerData.inventory.gear[itemName.toLowerCase()] = 0
                    }
                    playerData.inventory.gear[itemName.toLowerCase()] += quantity
                    
                    saveFarmDb()
                    return m.reply(`Berhasil membeli ${quantity}x ${itemName.replace(/_/g, ' ')} seharga $${gearCost}`)
                    
                case 'limited':
                case 'special':
                    const limitedShop = globalData.shops.limitedShop
                    const limited = limitedShop.stock[itemName.toLowerCase()]
                    
                    if (!limited) {
                        return m.reply('Item tidak ditemukan.')
                    }
                    
                    if (limited.stock < 1) {
                        return m.reply(`Stock item telah habis.`)
                    }
                    
                    if (userMoney < limited.price) {
                        return m.reply(`Uang tidak cukup. Kamu butuh $${limited.price}`)
                    }
                    
                    user.playerInventory.items.uang -= limited.price
                    db.users.update(m.sender, user)
                    
                    limited.stock -= 1
                    
                    const rewards = processLimitedItem(limited, playerData)
                    
                    saveFarmDb()
                    return m.reply(`Berhasil membeli ${itemName.replace(/_/g, ' ')} seharga $${limited.price}\nKamu telah mendapat ${rewards}`)
                    
                default:
                    return m.reply('Tipe toko tidak valid. Gunakan: `seed, gear, atau limited`')
            }
        }
        
        async function sellItem(m, prefix, command, cmd, itemName, amount, playerData, globalData, user, db) {
            if (!itemName) {
                return m.reply(`*Gunakan:* \`${prefix + command} ${cmd} [nama_item] [jumlah]\`\n*Contoh:* \`${prefix + command} ${cmd} wheat 5\``)
            }
            
            const quantity = parseInt(amount) || 1
            if (quantity <= 0) {
                return m.reply('Jumlah tidak valid.')
            }
            
            const cropKey = itemName.toLowerCase()
            if (!playerData.inventory.crops[cropKey] || playerData.inventory.crops[cropKey] < quantity) {
                return m.reply(`Kamu tidak mempunyai cukup ${itemName}. Kamu hanya memiliki ${playerData.inventory.crops[cropKey] || 0}`)
            }
            
            const sellPrice = getBestSellPrice(cropKey, globalData)
            const totalEarnings = sellPrice * quantity
            
            playerData.inventory.crops[cropKey] -= quantity
            user.playerInventory.items.uang += totalEarnings
            db.users.update(m.sender, user)
            
            updateQuestProgress(playerData, 'sell_crops', totalEarnings)
            
            saveFarmDb()
            return m.reply(`Kamu telah menjual ${quantity}x ${itemName.replace(/_/g, ' ')} seharga $${totalEarnings}`)
        }
        
        async function showInventory(m, playerData) {
            let invMsg = `📦 *\`INVENTORY\`*\n\n`
            
            invMsg += `*SEED:*\n`
            if (Object.keys(playerData.inventory.seeds).length === 0) {
                invMsg += `Tidak ada seed.\n`
            } else {
                Object.entries(playerData.inventory.seeds).forEach(([seed, amount]) => {
                    if (amount > 0) {
                        invMsg += `• ${seed.toUpperCase()}: ${amount}x\n`
                    }
                })
            }
            
            invMsg += `\n*GEAR:*\n`
            if (Object.keys(playerData.inventory.gear).length === 0) {
                invMsg += `Tidak ada gear.\n`
            } else {
                Object.entries(playerData.inventory.gear).forEach(([gear, amount]) => {
                    if (amount > 0) {
                        invMsg += `• ${gear.replace(/_/g, ' ').toUpperCase()}: ${amount}x\n`
                    }
                })
            }
            
            invMsg += `\n*HASIL PANEN:*\n`
            if (Object.keys(playerData.inventory.crops).length === 0) {
                invMsg += `Tidak ada hasil panen.\n`
            } else {
                Object.entries(playerData.inventory.crops).forEach(([crop, amount]) => {
                    if (amount > 0) {
                        invMsg += `• ${crop.replace(/_/g, ' ').toUpperCase()}: ${amount}x\n`
                    }
                })
            }
            
            invMsg += `\n*PET:*\n`
            if (Object.keys(playerData.inventory.pets).length === 0) {
                invMsg += `Tidak ada pet.\n`
            } else {
                Object.entries(playerData.inventory.pets).forEach(([pet, data]) => {
                    invMsg += `• ${pet.replace(/_/g, ' ').toUpperCase()}: Level ${data.level}\n`
                })
            }
            
            return m.reply(invMsg.trim())
        }
        
        async function useGear(m, prefix, command, cmd, gearName, plotId, playerData, globalData) {
            if (!gearName) {
                return m.reply(`*Gunakan:* \`${prefix + command} ${cmd} [nama_gear] [nomor_petak]\`\n*Contoh:* \`${prefix + command} ${cmd} fertilizer 1\``)
            }
            
            const gear = playerData.inventory.gear[gearName.toLowerCase()]
            if (!gear || gear <= 0) {
                return m.reply(`Kamu tidak punya ${gearName}.`)
            }
            
            if (!plotId) {
                return m.reply('Nomor petak tidak valid.')
            }
            
            const plotIndex = parseInt(plotId) - 1
            if (plotIndex < 0 || plotIndex >= playerData.garden.plots.length) {
                return m.reply('Nomor petak tidak valid.')
            }
            
            const plot = playerData.garden.plots[plotIndex]
            if (!plot.crop) {
                return m.reply('Tidak ada tanaman di petak ini.')
            }
            
            let result = applyGearEffect(gearName.toLowerCase(), plot, globalData)
            
            if (result.success) {
                playerData.inventory.gear[gearName.toLowerCase()]--
                saveFarmDb()
                return m.reply(result.message)
            } else {
                return m.reply(result.message)
            }
        }
        
        async function showQuests(m, playerData) {
            let questMsg = `📋 *\`QUEST KAMU\`*\n\n`
            
            questMsg += `• *QUEST HARIAN:*\n`
            if (playerData.quests.daily.length === 0) {
                questMsg += `Tidak ada quest aktif.\n`
            } else {
                playerData.quests.daily.forEach((quest, index) => {
                    const progress = `${quest.progress}/${quest.target}`
                    const status = quest.progress >= quest.target ? '✅' : '⏳'
                    questMsg += `${status} ${getQuestDescription(quest)} (${progress})\n`
                    questMsg += `• Imbalan: ${quest.reward.coins}, ${quest.reward.exp} XP\n\n`
                })
            }
            
            questMsg += `• *QUEST MINGGUAN:*\n`
            if (playerData.quests.weekly.length === 0) {
                questMsg += `Tidak ada quest aktif.\n`
            } else {
                playerData.quests.weekly.forEach((quest, index) => {
                    const progress = `${quest.progress}/${quest.target}`
                    const status = quest.progress >= quest.target ? '✅' : '⏳'
                    questMsg += `${status} ${getQuestDescription(quest)} (${progress})\n`
                    let rewardText = `${quest.reward.coins}, ${quest.reward.exp} XP`
                    if (quest.reward.item) rewardText += `, ${quest.reward.item}`
                    questMsg += `• Imbalan: ${rewardText}\n\n`
                })
            }
            
            return m.reply(questMsg.trim())
        }
        
        async function managePets(m, prefix, command, cmd, action, playerData) {
            if (!action) {
                return showPetList(m, playerData)
            }
    
            switch (action.toLowerCase()) {
                case 'list':
                case 'show':
                    return showPetList(m, playerData)
                case 'feed':
                    return feedPet(m, playerData)
                case 'activate':
                case 'use':
                    return activatePet(m, prefix, command, playerData)
                case 'deactivate':
                case 'stop':
                    return deactivatePet(m, playerData)
                default:
                    return m.reply(`Gunakan: \`${prefix + command} ${cmd} [list|feed|activate|deactivate]\``)
            }
        }
        
        async function tradeWithPlayer(m, conn, prefix, command, args, playerData, farmDb, user, db) {
            const action = args[1]?.toLowerCase()

            let playerTrading = `💱 *\`PLAYER TRADING\`*\n\n`

            caption += `*Contoh:* \`${prefix + command} trade offer @omi wheat 1 500\`\n`
            caption += `*Prefix:* \`${prefix}\`\n\n`

            playerTrading += `• ${prefix + command} trade offer @user [item] [jumlah] [harga]\n`
            playerTrading += `• ${prefix + command} trade accept [trade_id]\n`
            playerTrading += `• ${prefix + command} trade list - Lihat trade aktif`
            
            if (!action) {
                return m.reply(playerTrading.trim())
            }
            
            switch (action) {
                case 'offer':
                    return createTradeOffer(m, prefix, command, action, args, playerData, farmDb)
                case 'accept':
                    return acceptTradeOffer(m, prefix, command, action, conn, args[2], playerData, farmDb, user, db)
                case 'list':
                    return showActiveTrades(m, farmDb)
                default:
                    return m.reply('Perintah tidak dikenali.')
            }
        }
        
        async function expandGarden(m, playerData, user, db) {
            const expansionCost = getExpansionCost(playerData.garden.size)
            const userMoney = user.playerInventory.items.uang
            
            if (userMoney < expansionCost) {
                return m.reply(`Uang tidak cukup. Kamu butuh ${expansionCost}`)
            }
            
            if (!playerData.inventory.gear['plot_expander'] || playerData.inventory.gear['plot_expander'] <= 0) {
                return m.reply('kamu membutuhkan gear Plot Expander untuk memperluas kebun.')
            }
            
            const currentSize = playerData.garden.size.width * playerData.garden.size.height
            playerData.garden.size.width += 1
            const newSize = playerData.garden.size.width * playerData.garden.size.height
            
            for (let i = currentSize; i < newSize; i++) {
                playerData.garden.plots.push({
                    id: i,
                    crop: null,
                    plantedAt: null,
                    wateredAt: null,
                    harvestReady: false,
                    mutation: null
                })
            }
            
            user.playerInventory.items.uang -= expansionCost
            db.users.update(m.sender, user)
            playerData.inventory.gear['plot_expander']--
            
            updateQuestProgress(playerData, 'expand_garden', 1)
            
            saveFarmDb()
            return m.reply(`Ukuran kebun telah diperluas hingga ${playerData.garden.size.width}x${playerData.garden.size.height}. Ukuran kebun baru kamu kini ada ${newSize} petak`)
        }
        
        async function showLeaderboard(m, globalData, farmDb) {
            const playerStats = []
    
            Object.entries(farmDb).forEach(([userId, playerData]) => {
                if (userId === 'globalData' || !playerData?.stats) return
        
                const stats = playerData.stats
                const gardenSize = playerData.garden?.size ? 
                    playerData.garden.size.width * playerData.garden.size.height : 6
        
                let totalCropValue = 0
                if (playerData.inventory?.crops) {
                    Object.entries(playerData.inventory.crops).forEach(([crop, amount]) => {
                        const basePrice = getBestSellPrice(crop, globalData)
                        totalCropValue += basePrice * amount
                    })
                }
        
                playerStats.push({
                    userId,
                    level: stats.level || 1,
                    experience: stats.experience || 0,
                    totalHarvests: stats.totalHarvests || 0,
                    totalMutations: stats.totalMutations || 0,
                    gardenSize: gardenSize,
                    totalCropValue: totalCropValue,
                    joinedAt: stats.joinedAt || Date.now()
                })
            })
    
            const topLevel = [...playerStats].sort((a, b) => b.level - a.level || b.experience - a.experience).slice(0, 5)
            const topHarvests = [...playerStats].sort((a, b) => b.totalHarvests - a.totalHarvests).slice(0, 5)
            const topMutations = [...playerStats].sort((a, b) => b.totalMutations - a.totalMutations).slice(0, 5)
            const topGardenSize = [...playerStats].sort((a, b) => b.gardenSize - a.gardenSize).slice(0, 5)
    
            let lbMsg = `🏆 *\`FARMING LEADERBOARD\`*\n\n`
    
            lbMsg += `🌟 *TOP LEVEL FARMER:*\n`
            topLevel.forEach((player, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
                const username = player.userId.split('@')[0]
                lbMsg += `${medal} @${username} - Level ${player.level} (${player.experience} XP)\n`
            })
    
            lbMsg += `\n🌾 *TOP HARVEST FARMER:*\n`
            topHarvests.forEach((player, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
                const username = player.userId.split('@')[0]
                lbMsg += `${medal} @${username} - ${player.totalHarvests} panen\n`
            })
    
            lbMsg += `\n✨ *TOP MUTATION MASTER:*\n`
            topMutations.forEach((player, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
                const username = player.userId.split('@')[0]
                lbMsg += `${medal} @${username} - ${player.totalMutations} mutasi\n`
            })
    
            lbMsg += `\n🏡 *KEBUN TERBESAR:*\n`
            topGardenSize.forEach((player, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
                const username = player.userId.split('@')[0]
                lbMsg += `${medal} @${username} - ${player.gardenSize} petak\n`
            })
    
            globalData.leaderboard = {
                topLevel,
                topHarvests, 
                topMutations,
                topGardenSize,
                lastUpdated: Date.now()
            }
    
            return m.reply(lbMsg.trim())
        }
        
        async function showWeather(m, globalData) {
            const weather = globalData.events.weather
            const nextChange = 1800000 - (Date.now() - globalData.events.lastWeatherChange)
            const changeTime = Math.max(0, Math.ceil(nextChange / 60000))
            
            let weatherMsg = `🌤️ *\`KONDISI CUACA\`*\n\n`
            weatherMsg += `${getWeatherEmoji(weather)} *${weather.toUpperCase()}*\n\n`
            weatherMsg += `*Efek:*\n${getWeatherEffects(weather)}\n\n`
            weatherMsg += `Perubahan cuaca akan terjadi dalam ${changeTime} menit.`
            
            return m.reply(weatherMsg.trim())
        }
        
        async function showHelp(m, conn, prefix, command) {
            let caption = `🌱 *\`DAFTAR PERINTAH\`*\n\n`

            caption += `*Contoh:* \`${prefix + command} garden\`\n`
            caption += `*Prefix:* \`${prefix}\`\n\n`
            
            caption += `*Garden Management:*\n`
            caption += `• \`${command} garden\` - Lihat kebun kamu\n`
            caption += `• \`${command} plant\` - Tanam seed\n`
            caption += `• \`${command} water\` - Sirami tanaman\n`
            caption += `• \`${command} harvest\` - Harvest tanaman\n`
            caption += `• \`${command} expand\` - Perluas ukuran kebun\n\n`
            
            caption += `*Shopping:*\n`
            caption += `• \`${command} shop\` - Lihat semua toko\n`
            caption += `• \`${command} buy\` - Beli item\n`
            caption += `• \`${command} sell\` - Jual item\n\n`
            
            caption += `*Inventory & Gear*\n`
            caption += `• \`${command} inventory\` - Lihat item kamu\n`
            caption += `• \`${command} gear\` - Pakai gear\n\n`
            
            caption += `*Activities*\n`
            caption += `• \`${command} quest\` - Lihat quest\n`
            caption += `• \`${command} pet\` - Kelola pet kamu\n`
            caption += `• \`${command} trade\` - Player trading\n`
            caption += `• \`${command} weather\` - Cek cuaca\n`
            caption += `• \`${command} leaderboard\` - Lihat ranking\n\n`
            
            caption += `*Tips:*\n`
            caption += `• Sirami tanaman agar tumbuh lebih cepat\n`
            caption += `• Cuaca mempengaruhi mutasi\n`
            caption += `• Selesaikan quest untuk mendapatkan imbalan\n`
            caption += `• Tanaman hasil mutasi dapat dijual dengan harga lebih mahal`
            
            return conn.sendMessage(m.from, { text: caption.trim() })
        }
        
        function getRarityEmoji(rarity) {
            const emojis = {
                'common': '⚪',
                'uncommon': '🟢', 
                'rare': '🔵',
                'epic': '🟣',
                'legendary': '🟡'
            }
            return emojis[rarity] || '⚪'
        }
        
        function getWeatherEmoji(weather) {
            const emojis = {
                'sunny': '☀️',
                'rainy': '🌧️',
                'stormy': '⛈️',
                'snowy': '❄️',
                'foggy': '🌫️',
                'windy': '💨'
            }
            return emojis[weather] || '🌤️'
        }
        
        function getWeatherEffects(weather) {
            const effects = {
                'sunny': '• 5% pertumbuhan lebih cepat\n• Tingkat mutasi normal',
                'rainy': '• 10% pertumbuhan lebih cepat\n• Peluang lebih tinggi untuk Wet mutations',
                'stormy': '• Pertumbuhan normal\n• Kemungkinan besar untuk Shocked mutations',
                'snowy': '• 5% pertumbuhan lebih lambat\n• Peluang lebih tinggi untuk Frozen/Chilled mutations',
                'foggy': '• Pertumbuhan normal\n• Peluang lebih tinggi untuk Moonlit mutations',
                'windy': '• Pertumbuhan normal\n• Tingkat mutasi sedikit lebih tinggi'
            }
            return effects[weather] || 'Tidak ada efek spesial.'
        }
        
        function getBestSellPrice(cropKey, globalData) {
            const baseCrop = cropKey.split('_')[0]
            const seedData = globalData.shops.seedShop.stock[baseCrop]
            if (!seedData) return 0
            
            let basePrice = seedData.sellPrice
            
            if (cropKey.includes('_')) {
                const mutation = cropKey.split('_').slice(1).join('_')
                basePrice *= getMutationMultiplier(mutation)
            }
            
            const npcMultiplier = globalData.npcs.trader_tom?.buyMultiplier || 1.0
            
            return Math.round(Math.max(basePrice, basePrice * npcMultiplier))
        }
        
        function getExpansionCost(currentSize) {
            const currentPlots = currentSize.width * currentSize.height
            return Math.round(1000 * Math.pow(1.5, currentPlots - 6))
        }
        
        function updateQuestProgress(playerData, questType, amount) {
            // upd daily quests
            playerData.quests.daily.forEach(quest => {
                if (quest.type === questType && quest.progress < quest.target) {
                    quest.progress = Math.min(quest.progress + amount, quest.target)
                }
            })
            
            // updt weekly quests
            playerData.quests.weekly.forEach(quest => {
                if (quest.type === questType && quest.progress < quest.target) {
                    quest.progress = Math.min(quest.progress + amount, quest.target)
                }
            })
        }
        
        function getQuestDescription(quest) {
            const descriptions = {
                'harvest': `Harvest ${quest.target} tanaman`,
                'plant': `Tanam ${quest.target} seed`,
                'water': `Sirami tanaman ${quest.target} kali`,
                'harvest_mutations': `Harvest ${quest.target} tanaman bermutasi`,
                'sell_crops': `Jual hasil panen seharga $${quest.target}`,
                'expand_garden': `Perluas kebun ${quest.target} kali`
            }
            return descriptions[quest.type] || 'Tugas selesai'
        }
        
        function processLimitedItem(limited, playerData) {
            let rewards = []
            
            limited.contents.forEach(content => {
                switch (content) {
                    case 'random_seed':
                        const seeds = ['wheat', 'carrot', 'potato', 'tomato']
                        const randomSeed = seeds[Math.floor(Math.random() * seeds.length)]
                        if (!playerData.inventory.seeds[randomSeed]) {
                            playerData.inventory.seeds[randomSeed] = 0
                        }
                        playerData.inventory.seeds[randomSeed] += 3
                        rewards.push(`3x ${randomSeed} seeds`)
                        break
                        
                    case 'fertilizer':
                        if (!playerData.inventory.gear['fertilizer']) {
                            playerData.inventory.gear['fertilizer'] = 0
                        }
                        playerData.inventory.gear['fertilizer'] += 2
                        rewards.push('2x fertilizer')
                        break
                        
                    case 'coins':
                        rewards.push('100 bonus coins')
                        break
                        
                    case 'chocolate_sprinkler':
                        if (!playerData.inventory.gear['chocolate_sprinkler']) {
                            playerData.inventory.gear['chocolate_sprinkler'] = 0
                        }
                        playerData.inventory.gear['chocolate_sprinkler'] += 1
                        rewards.push('1x chocolate sprinkler')
                        break
                        
                    case 'pet_boost':
                        rewards.push('pet boost')
                        break
                }
            })
            
            return rewards.join(', ')
        }
        
        function applyGearEffect(gearName, plot, globalData) {
            switch (gearName) {
                case 'fertilizer':
                    plot.plantedAt = Date.now() - globalData.shops.seedShop.stock[plot.crop].growTime
                    saveFarmDb()

                    return { success: true, message: '🌱 Fertilizer dipakai. Tanaman kini telah siap untuk di harvest.' }
                    
                case 'basic_sprinkler':
                case 'advanced_sprinkler':
                case 'godly_sprinkler':
                case 'master_sprinkler':
                    const multiplier = gearName === 'basic_sprinkler' ? 0.8 : 
                                     gearName === 'advanced_sprinkler' ? 0.65 :
                                     gearName === 'godly_sprinkler' ? 0.5 : 0.33
                    
                    const reduction = (1 - multiplier) * globalData.shops.seedShop.stock[plot.crop].growTime
                    plot.plantedAt -= reduction
                    
                    if (Math.random() < 0.3) {
                        plot.mutation = checkForMutation(plot, globalData) || plot.mutation
                    }

                    saveFarmDb()
                    
                    return { success: true, message: `💧 ${gearName.replace(/_/g, ' ')} dipakai. Pertumbuhan meningkat signifikan.` }
                    
                case 'lightning_rod':
                    plot.mutation = 'shocked'
                    saveFarmDb()

                    return { success: true, message: '⚡ Lightning rod aktif. Tanaman memperoleh Shocked mutation.' }
                    
                case 'mutation_booster':
                    const mutations = ['gold', 'rainbow', 'big', 'disco', 'celestial']
                    plot.mutation = mutations[Math.floor(Math.random() * mutations.length)]
                    saveFarmDb()

                    return { success: true, message: `✨ Mutation booster dipakai! Tanaman memperoleh ${plot.mutation.toUpperCase()} mutation.` }
                    
                case 'chocolate_sprinkler':
                    plot.mutation = 'chocolate'
                    const chocolateReduction = 0.4 * globalData.shops.seedShop.stock[plot.crop].growTime
                    plot.plantedAt -= chocolateReduction
                    saveFarmDb()

                    return { success: true, message: '🍫 Chocolate sprinkler dipakai! Sweet mutation diperoleh.' }
                    
                default:
                    return { success: false, message: 'Tipe gear tidak diketahui.' }
            }
        }
        
        async function showPetList(m, playerData) {
            let petMsg = `🐾 *\`PET KAMU\`*\n\n`
            
            if (Object.keys(playerData.inventory.pets).length === 0) {
                petMsg += `Tidak punya pet.\n\n`
                petMsg += `*Pet Yang Tersedia:*\n`
                petMsg += `🦋 Butterfly - Mengubah 5 tanaman menjadi rainbow mutation setiap 30 menit\n`
                petMsg += `🐝 Bee - 15% pertumbuhan lebih cepat untuk semua tanaman\n`
                petMsg += `🐰 Rabbit - Menggandakan hasil panen secara acak\n`
                petMsg += `🦉 Owl - Meningkatkan peluang mutasi langka di malam hari\n`
                petMsg += `🐸 Frog - Efek dari cuaca ditingkatkan\n\n`
                petMsg += `*Pet dapat ditemukan pada special event atau dibeli dari toko limited*`
            } else {
                Object.entries(playerData.inventory.pets).forEach(([pet, data]) => {
                    const petEmoji = getPetEmoji(pet)
                    petMsg += `${petEmoji} *${pet.replace(/_/g, ' ').toUpperCase()}*\n`
                    petMsg += `• Level: ${data.level}\n`
                    petMsg += `• Happiness: ${data.happiness}/100\n`
                    petMsg += `• Energy: ${data.energy}/100\n`
                    petMsg += `• Effect: ${getPetEffect(pet)}\n`
                    if (data.lastFed) {
                        const timeSinceFed = Date.now() - data.lastFed
                        const hoursSinceFed = Math.floor(timeSinceFed / 3600000)
                        petMsg += `• Pakan Terakhir: ${hoursSinceFed} jam yang lalu\n`
                    }
                    petMsg += `\n`
                })
            }
            
            return m.reply(petMsg.trim())
        }

        function getPetEmoji(pet) {
            const emojis = {
                'butterfly': '🦋',
                'bee': '🐝', 
                'rabbit': '🐰',
                'owl': '🦉',
                'frog': '🐸'
            }
            return emojis[pet] || '🐾'
        }
        
        function getPetEffect(pet) {
            const effects = {
                'butterfly': 'Peningkatan Rainbow mutation setiap 30 menit',
                'bee': '15% pertumbuhan lebih cepat untuk semua tanaman',
                'rabbit': 'Kesempatan acak untuk panen ganda',
                'owl': 'Mutasi langka selama event malam hari',
                'frog': 'Efek dari cuaca ditingkatkan'
            }
            return effects[pet] || 'Unknown effect'
        }
        
        async function feedPet(m, playerData) {
            if (Object.keys(playerData.inventory.pets).length === 0) {
                return m.reply('Tidak ada pet yang perlu diberi makan.')
            }
            
            let fedCount = 0
            Object.entries(playerData.inventory.pets).forEach(([pet, data]) => {
                if (data.happiness < 100) {
                    data.happiness = Math.min(100, data.happiness + 20)
                    data.energy = Math.min(100, data.energy + 15)
                    data.lastFed = Date.now()
                    fedCount++
                }
            })
            
            if (fedCount === 0) {
                return m.reply('Semua pet sudah cukup makan.')
            }
            
            saveFarmDb()
            return m.reply(`Kamu telah memberi makan ${fedCount} pet.`)
        }
        
        async function activatePet(m, prefix, command, playerData) {
            if (Object.keys(playerData.inventory.pets).length === 0) {
                return m.reply('Kamu tidak punya pet untuk diaktivasi.')
            }
    
            let activePet = null
            Object.entries(playerData.inventory.pets).forEach(([petName, petData]) => {
                if (petData.active) {
                    activePet = petName
                }
            })
    
            if (activePet) {
                return m.reply(`Pet ${activePet.replace(/_/g, ' ')} sudah aktif.\nGunakan \`${prefix + command} deactivate\` untuk menonaktifkan.`)
            }
    
            let petMsg = `🐾 *\`PILIH PET UNTUK DIAKTIVASI\`*\n\n`
    
            Object.entries(playerData.inventory.pets).forEach(([petName, petData], index) => {
                const petEmoji = getPetEmoji(petName)
                const canActivate = petData.energy >= 50 && petData.happiness >= 30
                const status = canActivate ? '✅ Siap' : '❌ Tidak siap'
        
                petMsg += `${index + 1}. ${petEmoji} *${petName.replace(/_/g, ' ').toUpperCase()}*\n`
                petMsg += `• Level: ${petData.level}\n`
                petMsg += `• Energy: ${petData.energy}/100\n`
                petMsg += `• Happiness: ${petData.happiness}/100\n`
                petMsg += `• Status: ${status}\n`
                petMsg += `• Effect: ${getPetEffect(petName)}\n\n`
            })
    
            petMsg += `*Persyaratan Aktivasi:*\n`
            petMsg += `• Energy minimal 50\n`
            petMsg += `• Happiness minimal 30\n\n`
            petMsg += `Balas dengan nomor pet yang ingin diaktivasi (1-${Object.keys(playerData.inventory.pets).length})`

            if (!playerData.context) playerData.context = {}
            playerData.context.waitingForPetActivation = true
            playerData.context.petActivationExpires = Date.now() + 60000

            saveFarmDb()
    
            return m.reply(petMsg.trim())
        }

        async function handlePetActivationResponse(m, playerData, choice) {
            const petNames = Object.keys(playerData.inventory.pets)
            const petIndex = parseInt(choice) - 1

            if (petIndex < 0 || petIndex >= petNames.length) {
                return m.reply('Pilihan tidak valid.')
            }

            const selectedPet = petNames[petIndex]
            const petData = playerData.inventory.pets[selectedPet]

            if (petData.energy < 50 || petData.happiness < 30) {
                return m.reply(`${getPetEmoji(selectedPet)} ${selectedPet.replace(/_/g, ' ')} tidak memenuhi persyaratan untuk diaktivasi.\nBeri makan dan tingkatkan kebahagiaan pet terlebih dahulu.`)
            }

            petData.active = true
            petData.activatedAt = Date.now()
            petData.energy -= 20

            applyPetEffects(selectedPet, petData, playerData)

            delete playerData.context.waitingForPetActivation
            delete playerData.context.petActivationExpires

            saveFarmDb()

            return m.reply(`🐾 ${getPetEmoji(selectedPet)} ${selectedPet.replace(/_/g, ' ')} telah diaktivasi.\n\n${getPetActivationMessage(selectedPet)}`)
        }

        function applyPetEffects(petName, petData, playerData) {
            switch (petName) {
                case 'bee':
                    playerData.garden.plots.forEach(plot => {
                        if (plot.crop && plot.plantedAt) {
                            const growthBoost = 0.15
                            const timeReduction = growthBoost * (Date.now() - plot.plantedAt)
                            plot.plantedAt -= timeReduction
                        }
                    })
                    break
    
                case 'butterfly':
                    petData.nextRainbowMutation = Date.now() + (30 * 60 * 1000)
                    break
    
                case 'rabbit':
                    petData.doubleHarvestChance = 0.25 // 25% chance
                    break
    
                case 'owl':
                    petData.nightMutationBonus = 2.0 // 2x mutation chance at night
                    break
    
                case 'frog':
                    petData.weatherEffectMultiplier = 1.5
                    break
            }

            saveFarmDb()
        }

        function getPetActivationMessage(petName) {
            const messages = {
                'bee': '🐝 Lebah mulai bekerja! Semua tanaman akan tumbuh 15% lebih cepat.',
                'butterfly': '🦋 Kupu-kupu terbang mengelilingi kebun! Rainbow mutation akan terjadi dalam 30 menit.',
                'rabbit': '🐰 Kelinci melompat-lompat! Kesempatan panen ganda meningkat 25%.',
                'owl': '🦉 Burung hantu mengawasi kebun! Mutasi langka akan lebih sering terjadi di malam hari.',
                'frog': '🐸 Katak bernyanyi! Efek cuaca akan diperkuat 50%.'
            }
            return messages[petName] || 'Pet telah diaktivasi dengan efek khusus.'
        }
        
        async function deactivatePet(m, playerData) {
            let activePet = null
            Object.entries(playerData.inventory.pets).forEach(([petName, petData]) => {
                if (petData.active) {
                    activePet = petName
                    petData.active = false
                    delete petData.activatedAt

                    delete petData.nextRainbowMutation
                    delete petData.doubleHarvestChance
                    delete petData.nightMutationBonus
                    delete petData.weatherEffectMultiplier
                }

                saveFarmDb()
            })

            if (!activePet) {
                return m.reply('Tidak ada pet yang sedang aktif.')
            }

            saveFarmDb()
            return m.reply(`🐾 ${getPetEmoji(activePet)} ${activePet.replace(/_/g, ' ')} telah dinonaktifkan.`)
        }

        function checkPetEffects(playerData) {
            Object.entries(playerData.inventory.pets).forEach(([petName, petData]) => {
                if (!petData.active) return
      
                const now = Date.now()

                switch (petName) {
                    case 'butterfly':
                        if (petData.nextRainbowMutation && now >= petData.nextRainbowMutation) {
                            const eligiblePlots = playerData.garden.plots.filter(plot => 
                                plot.crop && !plot.harvestReady && !plot.mutation
                            )
            
                            if (eligiblePlots.length > 0) {
                                const randomPlots = eligiblePlots.sort(() => 0.5 - Math.random()).slice(0, 5)
                                randomPlots.forEach(plot => {
                                    plot.mutation = 'rainbow'
                                })
                            }
            
                            petData.nextRainbowMutation = now + (30 * 60 * 1000)
                        }
                        break
        
                    case 'owl':
                        const hour = new Date().getHours()
                        const isNight = hour >= 18 || hour <= 6
                
                        if (isNight && petData.nightMutationBonus) {
                            playerData.garden.plots.forEach(plot => {
                                if (plot.crop && !plot.mutation && Math.random() < 0.1) {
                                    const rareMutations = ['celestial', 'moonlit', 'disco', 'bloodlit']
                                    plot.mutation = rareMutations[Math.floor(Math.random() * rareMutations.length)]
                                }
                            })
                        }
                        break
                }

                if (now - (petData.activatedAt || now) >= 3600000) {
                    petData.energy = Math.max(0, petData.energy - 10)
                    petData.happiness = Math.max(0, petData.happiness - 5)
    
                    if (petData.energy < 10) {
                        petData.active = false
                        delete petData.activatedAt
                
                        delete petData.nextRainbowMutation
                        delete petData.doubleHarvestChance
                        delete petData.nightMutationBonus
                        delete petData.weatherEffectMultiplier
                    }
                }

                saveFarmDb()
            })
        }
        
        async function createTradeOffer(m, prefix, command, cmd, args, playerData, farmDb) {
            if (args.length < 6) {
                return m.reply(`*Gunakan:* \`${prefix + command} ${cmd} @user [item] [jumlah] [harga]\``)
            }
            
            const targetUser = args[2].replace('@', '') + '@s.whatsapp.net'
            const itemName = args[3].toLowerCase()
            const amount = parseInt(args[4])
            const price = parseInt(args[5])
            
            if (!amount || amount <= 0 || !price || price <= 0) {
                return m.reply('Harga atau jumlah tidak valid.')
            }
            
            const hasItem = playerData.inventory.seeds[itemName] >= amount ||
                           playerData.inventory.gear[itemName] >= amount ||
                           playerData.inventory.crops[itemName] >= amount
            
            if (!hasItem) {
                return m.reply(`Kamu tidak punya cukup ${itemName}.`)
            }
            
            if (!farmDb.trades) farmDb.trades = {}
            
            const tradeId = Date.now().toString()
            farmDb.trades[tradeId] = {
                from: m.sender,
                to: targetUser,
                item: itemName,
                amount: amount,
                price: price,
                status: 'pending',
                createdAt: Date.now()
            }
            
            saveFarmDb()
            return m.reply(`✅ *\`TRADE OFFER DIBUAT\`*\n• ID Trade: ${tradeId}\n• Penawaran: ${amount}x ${itemName} seharga $${price}`)
        }
        
        async function acceptTradeOffer(m, prefix, command, cmd, tradeId, playerData, farmDb, user, db) {
            if (!tradeId) {
                return m.reply(`*Gunakan:* \`${prefix + command} ${cmd} [id_trade]\``)
            }
            
            if (!farmDb.trades || !farmDb.trades[tradeId]) {
                return m.reply('Trade ini tidak ditemukan.')
            }
            
            const trade = farmDb.trades[tradeId]
            
            if (trade.to !== m.sender) {
                return m.reply('Trade ini bukan untukmu.')
            }
            
            if (trade.status !== 'pending') {
                return m.reply('Trade ini tidak lagi tersedia.')
            }
            
            const userMoney = user.playerInventory.items.uang
            if (userMoney < trade.price) {
                return m.reply(`Uang tidak cukup. Kamu butuh $${trade.price}`)
            }
            
            const sellerData = farmDb[trade.from]
            if (!sellerData) {
                return m.reply('Data penjual tidak ditemukan.')
            }
            
            const sellerUser = db.users.get(trade.from)
            
            user.playerInventory.items.uang -= trade.price
            sellerUser.playerInventory.items.uang += trade.price
            
            const itemType = getItemType(trade.item, sellerData)
            if (itemType) {
                if (!playerData.inventory[itemType][trade.item]) {
                    playerData.inventory[itemType][trade.item] = 0
                }
                playerData.inventory[itemType][trade.item] += trade.amount
                sellerData.inventory[itemType][trade.item] -= trade.amount
            }
            
            db.users.update(m.sender, user)
            db.users.update(trade.from, sellerUser)
            
            trade.status = 'completed'
            trade.completedAt = Date.now()
            
            saveFarmDb()
            return m.reply(`✅ *\`TRADE SELESAI\`*\nItem: ${trade.amount}x ${trade.item}\nHarga: $${trade.price}`)
        }
        
        async function showActiveTrades(m, farmDb) {
            if (!farmDb.trades) {
                return m.reply('Tidak ada trade yang aktif.')
            }
            
            let tradeMsg = `💱 *\`TRADE AKTIF\`*\n\n`
            
            const activeTrades = Object.entries(farmDb.trades).filter(([id, trade]) => 
                trade.status === 'pending' && (Date.now() - trade.createdAt) < 86400000 // 24 hours
            )
            
            if (activeTrades.length === 0) {
                tradeMsg += `Tidak ada trade yang aktif.`
            } else {
                activeTrades.forEach(([id, trade]) => {
                    const isYourTrade = trade.from === m.sender || trade.to === m.sender
                    tradeMsg += `• ID: ${id}\n`
                    tradeMsg += `• Item: ${trade.amount}x ${trade.item}\n`
                    tradeMsg += `• Harga: $${trade.price}\n`
                    if (isYourTrade) {
                        tradeMsg += `👤 ${trade.from === m.sender ? 'Penawaran kamu': 'Penawaran untuk kamu'}\n`
                    }
                    tradeMsg += `⏰ ${Math.floor((Date.now() - trade.createdAt) / 60000)} menit yang lalu\n\n`
                })
            }
            
            return m.reply(tradeMsg)
        }
        
        function getItemType(itemName, playerData) {
            if (playerData.inventory.seeds[itemName]) return 'seeds'
            if (playerData.inventory.gear[itemName]) return 'gear'  
            if (playerData.inventory.crops[itemName]) return 'crops'
            return null
        }
    }
}