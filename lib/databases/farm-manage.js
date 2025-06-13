// Farm Player Management System
import farmDb from './farm-database.js'

function FarmPlayer() {
    
    // Default player farm structure
    const defaultPlayerFarm = {
        farmLevel: 1,
        farmSize: { width: 3, height: 2 }, // 3x2 = 6 plots
        plots: Array(6).fill(null).map((_, i) => ({
            id: i,
            x: i % 3,
            y: Math.floor(i / 3),
            planted: null,
            plantedAt: 0,
            growthStage: 0,
            mutation: null,
            gearEffects: [],
            harvestable: false
        })),
        farmMoney: 1000, // Starting money
        farmExperience: 0,
        farmStats: {
            totalHarvested: 0,
            totalPlanted: 0,
            totalMutations: 0,
            totalMoney: 0,
            plantsGrown: {},
            mutationsCollected: {},
            questsCompleted: 0
        },
        inventory: {
            seeds: {},
            gears: {},
            pets: {}
        },
        pets: {
            active: null,
            lastPetEffect: 0
        },
        quests: {
            daily: [],
            weekly: [],
            dailyReset: 0,
            weeklyReset: 0,
            progress: {}
        },
        shopCooldowns: {},
        lastActive: Date.now(),
        farmRegistered: false
    }
    
    function initializePlayerFarm(user) {
        if (!user.playerFarm) {
            user.playerFarm = JSON.parse(JSON.stringify(defaultPlayerFarm))
            user.playerFarm.farmRegistered = true
            return true
        }
        return false
    }
    
    function expandFarm(user) {
        const farm = user.playerFarm
        const currentSize = farm.farmSize.width * farm.farmSize.height
        const expansionCost = currentSize * 1000 // Cost increases with size
        
        if (farm.farmMoney < expansionCost) return { success: false, reason: 'insufficient_money', cost: expansionCost }
        
        // Expand by adding one row
        farm.farmSize.height += 1
        const newPlots = []
        
        for (let i = 0; i < farm.farmSize.width; i++) {
            newPlots.push({
                id: farm.plots.length + i,
                x: i,
                y: farm.farmSize.height - 1,
                planted: null,
                plantedAt: 0,
                growthStage: 0,
                mutation: null,
                gearEffects: [],
                harvestable: false
            })
        }
        
        farm.plots.push(...newPlots)
        farm.farmMoney -= expansionCost
        farm.farmLevel += 1
        
        return { success: true, cost: expansionCost, newSize: `${farm.farmSize.width}x${farm.farmSize.height}` }
    }
    
    function plantSeed(user, plotId, seedType) {
        const farm = user.playerFarm
        const plot = farm.plots.find(p => p.id === plotId)
        const seedData = farmDb.data.seeds[seedType]
        
        if (!plot) return { success: false, reason: 'invalid_plot' }
        if (plot.planted) return { success: false, reason: 'plot_occupied' }
        if (!seedData) return { success: false, reason: 'invalid_seed' }
        if (!farm.inventory.seeds[seedType] || farm.inventory.seeds[seedType] <= 0) {
            return { success: false, reason: 'no_seeds' }
        }
        
        // Plant the seed
        plot.planted = seedType
        plot.plantedAt = Date.now()
        plot.growthStage = 0
        plot.harvestable = false
        plot.mutation = null
        plot.gearEffects = []
        
        // Consume seed
        farm.inventory.seeds[seedType] -= 1
        if (farm.inventory.seeds[seedType] <= 0) {
            delete farm.inventory.seeds[seedType]
        }
        
        // Update stats
        farm.farmStats.totalPlanted += 1
        farm.farmStats.plantsGrown[seedType] = (farm.farmStats.plantsGrown[seedType] || 0) + 1
        
        return { success: true, plot: plotId, seed: seedType }
    }
    
    function checkPlantGrowth(user) {
        const farm = user.playerFarm
        const weather = farmDb.getCurrentWeather()
        const activeEvent = farmDb.getActiveEvent()
        const weatherData = farmDb.data.weather[weather]
        const eventData = activeEvent ? farmDb.data.events[activeEvent] : null
        
        let updates = []
        
        farm.plots.forEach(plot => {
            if (!plot.planted || plot.harvestable) return
            
            const seedData = farmDb.data.seeds[plot.planted]
            const now = Date.now()
            const timePlanted = now - plot.plantedAt
            
            // Calculate growth multipliers
            let growthMultiplier = weatherData.growthBoost
            if (eventData && eventData.effects.growthBoost) {
                growthMultiplier *= eventData.effects.growthBoost
            }
            
            // Apply gear effects
            plot.gearEffects.forEach(effect => {
                if (effect.growthBoost) growthMultiplier *= effect.growthBoost
            })
            
            // Apply pet effects
            if (farm.pets.active) {
                const petData = farmDb.data.pets[farm.pets.active]
                if (petData.effect.growthBoost) {
                    growthMultiplier *= petData.effect.growthBoost
                }
            }
            
            // Check if plant is ready to harvest
            const adjustedGrowTime = seedData.growTime / growthMultiplier
            if (timePlanted >= adjustedGrowTime) {
                plot.harvestable = true
                plot.growthStage = 100
                
                // Check for mutations
                if (!plot.mutation) {
                    plot.mutation = checkForMutation(plot, weather, activeEvent)
                }
                
                updates.push({
                    plotId: plot.id,
                    plant: plot.planted,
                    mutation: plot.mutation,
                    ready: true
                })
            } else {
                // Update growth stage
                plot.growthStage = Math.floor((timePlanted / adjustedGrowTime) * 100)
            }
        })
        
        return updates
    }
    
    function checkForMutation(plot, weather, activeEvent) {
        const seedData = farmDb.data.seeds[plot.planted]
        let mutationChance = 0.05 // Base 5% chance
        let possibleMutations = [...seedData.mutations]
        
        // Weather effects
        const weatherData = farmDb.data.weather[weather]
        Object.keys(weatherData).forEach(key => {
            if (key.endsWith('Chance')) {
                const mutationType = key.replace('Chance', '')
                if (Math.random() < weatherData[key]) {
                    return mutationType
                }
            }
        })
        
        // Event effects
        if (activeEvent) {
            const eventData = farmDb.data.events[activeEvent]
            Object.keys(eventData.effects).forEach(key => {
                if (key.endsWith('Chance')) {
                    const mutationType = key.replace('Chance', '')
                    if (Math.random() < eventData.effects[key]) {
                        return mutationType
                    }
                }
            })
        }
        
        // Gear effects
        plot.gearEffects.forEach(effect => {
            if (effect.mutationChance) mutationChance += effect.mutationChance
            if (effect.forceMutation) return effect.forceMutation
        })
        
        // Random mutation check
        if (Math.random() < mutationChance && possibleMutations.length > 0) {
            return possibleMutations[Math.floor(Math.random() * possibleMutations.length)]
        }
        
        return null
    }
    
    function harvestPlant(user, plotId) {
        const farm = user.playerFarm
        const plot = farm.plots.find(p => p.id === plotId)
        
        if (!plot) return { success: false, reason: 'invalid_plot' }
        if (!plot.planted || !plot.harvestable) return { success: false, reason: 'not_ready' }
        
        const seedData = farmDb.data.seeds[plot.planted]
        let baseValue = seedData.sellPrice
        let harvestYield = 1
        
        // Apply mutation multiplier
        if (plot.mutation) {
            const mutationData = farmDb.data.mutations[plot.mutation]
            baseValue *= mutationData.multiplier
            farm.farmStats.totalMutations += 1
            farm.farmStats.mutationsCollected[plot.mutation] = (farm.farmStats.mutationsCollected[plot.mutation] || 0) + 1
        }
        
        // Apply pet effects
        if (farm.pets.active) {
            const petData = farmDb.data.pets[farm.pets.active]
            if (petData.effect.harvestBonus) {
                harvestYield *= petData.effect.harvestBonus
            }
        }
        
        const totalValue = Math.floor(baseValue * harvestYield)
        
        // Add to inventory or money
        farm.farmMoney += totalValue
        farm.farmStats.totalHarvested += 1
        farm.farmStats.totalMoney += totalValue
        
        // Clear plot
        const harvestedPlant = {
            type: plot.planted,
            mutation: plot.mutation,
            value: totalValue,
            yield: harvestYield
        }
        
        plot.planted = null
        plot.plantedAt = 0
        plot.growthStage = 0
        plot.mutation = null
        plot.gearEffects = []
        plot.harvestable = false
        
        return { success: true, harvest: harvestedPlant }
    }
    
    function useGear(user, gearType, plotId) {
        const farm = user.playerFarm
        const plot = farm.plots.find(p => p.id === plotId)
        const gearData = farmDb.data.gears[gearType]
        
        if (!plot) return { success: false, reason: 'invalid_plot' }
        if (!gearData) return { success: false, reason: 'invalid_gear' }
        if (!farm.inventory.gears[gearType] || farm.inventory.gears[gearType] <= 0) {
            return { success: false, reason: 'no_gear' }
        }
        if (!plot.planted) return { success: false, reason: 'empty_plot' }
        
        // Apply gear effect
        if (gearData.effect.forceMutation && !plot.harvestable) {
            plot.mutation = gearData.effect.forceMutation
        } else if (gearData.effect.growthBoost || gearData.effect.mutationChance) {
            plot.gearEffects.push(gearData.effect)
        }
        
        // Consume gear
        farm.inventory.gears[gearType] -= 1
        if (farm.inventory.gears[gearType] <= 0) {
            delete farm.inventory.gears[gearType]
        }
        
        return { success: true, effect: gearData.effect }
    }
    
    function buyFromShop(user, shopType, itemType, quantity = 1) {
        const farm = user.playerFarm
        const shop = farmDb.data.shops[shopType]
        
        if (!shop) return { success: false, reason: 'invalid_shop' }
        if (!shop.stock[itemType] || shop.stock[itemType] < quantity) {
            return { success: false, reason: 'out_of_stock' }
        }
        
        let itemData, totalCost, targetInventory
        
        if (shopType === 'seed_shop') {
            itemData = farmDb.data.seeds[itemType]
            targetInventory = farm.inventory.seeds
        } else if (shopType === 'gear_shop') {
            itemData = farmDb.data.gears[itemType]
            targetInventory = farm.inventory.gears
        } else if (shopType === 'pet_shop') {
            itemData = farmDb.data.pets[itemType]
            targetInventory = farm.inventory.pets
        }
        
        if (!itemData) return { success: false, reason: 'invalid_item' }
        
        totalCost = itemData.price * quantity
        if (farm.farmMoney < totalCost) return { success: false, reason: 'insufficient_money' }
        
        // Complete purchase
        farm.farmMoney -= totalCost
        shop.stock[itemType] -= quantity
        targetInventory[itemType] = (targetInventory[itemType] || 0) + quantity
        
        farmDb.save()
        
        return { success: true, item: itemType, quantity, cost: totalCost }
    }
    
    function getFarmDisplay(user) {
        const farm = user.playerFarm
        const weather = farmDb.getCurrentWeather()
        const activeEvent = farmDb.getActiveEvent()
        
        let display = `🌱 *${user.nama}'s Farm* 🌱\n\n`
        display += `📍 Level ${farm.farmLevel} Farm (${farm.farmSize.width}x${farm.farmSize.height})\n`
        display += `💰 Money: $${farm.farmMoney.toLocaleString()}\n`
        display += `⭐ Experience: ${farm.farmExperience}\n`
        display += `🌤️ Weather: ${farmDb.data.weather[weather].name}\n`
        
        if (activeEvent) {
            display += `🎪 Event: ${farmDb.data.events[activeEvent].name}\n`
        }
        
        display += `\n📊 *Farm Stats:*\n`
        display += `🌾 Total Harvested: ${farm.farmStats.totalHarvested}\n`
        display += `🌱 Total Planted: ${farm.farmStats.totalPlanted}\n`
        display += `✨ Total Mutations: ${farm.farmStats.totalMutations}\n\n`
        
        display += `🗂️ *Farm Layout:*\n`
        for (let y = 0; y < farm.farmSize.height; y++) {
            let row = ''
            for (let x = 0; x < farm.farmSize.width; x++) {
                const plot = farm.plots.find(p => p.x === x && p.y === y)
                if (!plot.planted) {
                    row += '🟫 '
                } else if (plot.harvestable) {
                    const mutationIcon = plot.mutation ? farmDb.data.mutations[plot.mutation].color : ''
                    row += `🌾${mutationIcon} `
                } else {
                    const stage = plot.growthStage
                    if (stage < 25) row += '🌱 '
                    else if (stage < 50) row += '🌿 '
                    else if (stage < 75) row += '🌸 '
                    else row += '🌻 '
                }
            }
            display += row + `\n`
        }
        
        display += `\n📦 *Inventory Summary:*\n`
        
        // Seeds
        const seedCount = Object.values(farm.inventory.seeds).reduce((a, b) => a + b, 0)
        display += `🌱 Seeds: ${seedCount} types\n`
        
        // Gears
        const gearCount = Object.values(farm.inventory.gears).reduce((a, b) => a + b, 0)
        display += `🔧 Gears: ${gearCount} items\n`
        
        // Pets
        const petCount = Object.keys(farm.inventory.pets).length
        display += `🐾 Pets: ${petCount} owned\n`
        
        if (farm.pets.active) {
            display += `🎯 Active Pet: ${farmDb.data.pets[farm.pets.active].name}\n`
        }
        
        return display
    }
    
    return {
        initializePlayerFarm,
        expandFarm,
        plantSeed,
        checkPlantGrowth,
        harvestPlant,
        useGear,
        buyFromShop,
        getFarmDisplay,
        
        // Quest system
        generateDailyQuests(user) {
            const farm = user.playerFarm
            const now = Date.now()
            const oneDayMs = 24 * 60 * 60 * 1000
            
            if (now - farm.quests.dailyReset >= oneDayMs) {
                const availableQuests = farmDb.data.quests.daily
                farm.quests.daily = availableQuests.slice(0, 3) // Give 3 daily quests
                farm.quests.dailyReset = now
                farm.quests.progress = {}
            }
            
            return farm.quests.daily
        },
        
        // Pet system
        activatePet(user, petType) {
            const farm = user.playerFarm
            if (!farm.inventory.pets[petType]) {
                return { success: false, reason: 'pet_not_owned' }
            }
            
            farm.pets.active = petType
            return { success: true, pet: petType }
        },
        
        // Shop system
        sellToShop(user, itemType, quantity = 1) {
            const farm = user.playerFarm
            const seedData = farmDb.data.seeds[itemType]
            
            if (!seedData) return { success: false, reason: 'invalid_item' }
            if (!farm.inventory.seeds[itemType] || farm.inventory.seeds[itemType] < quantity) {
                return { success: false, reason: 'insufficient_items' }
            }
            
            const totalValue = Math.floor(seedData.sellPrice * 0.7 * quantity) // 70% of sell price
            farm.farmMoney += totalValue
            farm.inventory.seeds[itemType] -= quantity
            
            if (farm.inventory.seeds[itemType] <= 0) {
                delete farm.inventory.seeds[itemType]
            }
            
            return { success: true, sold: quantity, earned: totalValue }
        }
    }
}

export default FarmPlayer()