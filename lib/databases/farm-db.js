// json/farm-database.json structure
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Farm Database Manager
function FarmDB() {
    const farmDbPath = path.join(__dirname, '../../json/farm-database.json')
    
    // Default farm data structure
    const defaultFarmData = {
        seeds: {
            // Basic Seeds
            wheat: { 
                name: 'Wheat', price: 10, sellPrice: 15, growTime: 60000, // 1 minute
                rarity: 'common', category: 'grain',
                mutations: ['gold', 'big', 'rainbow']
            },
            corn: { 
                name: 'Corn', price: 15, sellPrice: 25, growTime: 120000, // 2 minutes
                rarity: 'common', category: 'grain',
                mutations: ['gold', 'big', 'moonlit']
            },
            tomato: { 
                name: 'Tomato', price: 20, sellPrice: 35, growTime: 180000, // 3 minutes
                rarity: 'common', category: 'vegetable',
                mutations: ['wet', 'big', 'bloodlit']
            },
            carrot: { 
                name: 'Carrot', price: 12, sellPrice: 20, growTime: 90000, // 1.5 minutes
                rarity: 'common', category: 'vegetable',
                mutations: ['gold', 'frozen', 'big']
            },
            potato: { 
                name: 'Potato', price: 8, sellPrice: 12, growTime: 80000,
                rarity: 'common', category: 'vegetable',
                mutations: ['big', 'shocked', 'chilled']
            },
            
            // Uncommon Seeds
            strawberry: { 
                name: 'Strawberry', price: 50, sellPrice: 80, growTime: 300000, // 5 minutes
                rarity: 'uncommon', category: 'fruit',
                mutations: ['wet', 'frozen', 'rainbow', 'moonlit']
            },
            blueberry: { 
                name: 'Blueberry', price: 60, sellPrice: 100, growTime: 360000, // 6 minutes
                rarity: 'uncommon', category: 'fruit',
                mutations: ['chilled', 'frozen', 'celestial']
            },
            pumpkin: { 
                name: 'Pumpkin', price: 80, sellPrice: 140, growTime: 480000, // 8 minutes
                rarity: 'uncommon', category: 'fruit',
                mutations: ['big', 'gold', 'disco', 'zombified']
            },
            
            // Rare Seeds
            dragon_fruit: { 
                name: 'Dragon Fruit', price: 200, sellPrice: 350, growTime: 900000, // 15 minutes
                rarity: 'rare', category: 'exotic',
                mutations: ['rainbow', 'celestial', 'disco', 'bloodlit']
            },
            golden_apple: { 
                name: 'Golden Apple', price: 500, sellPrice: 1000, growTime: 1800000, // 30 minutes
                rarity: 'legendary', category: 'exotic',
                mutations: ['gold', 'celestial', 'rainbow', 'disco']
            }
        },
        
        gears: {
            // Sprinklers
            basic_sprinkler: {
                name: 'Basic Sprinkler', price: 100, uses: 10, rarity: 'common',
                effect: { growthBoost: 1.2, mutationChance: 0.05 },
                description: 'Increases growth speed by 20% and mutation chance by 5%'
            },
            advanced_sprinkler: {
                name: 'Advanced Sprinkler', price: 500, uses: 20, rarity: 'uncommon',
                effect: { growthBoost: 1.5, mutationChance: 0.1 },
                description: 'Increases growth speed by 50% and mutation chance by 10%'
            },
            godly_sprinkler: {
                name: 'Godly Sprinkler', price: 2000, uses: 50, rarity: 'rare',
                effect: { growthBoost: 2.0, mutationChance: 0.2 },
                description: 'Increases growth speed by 100% and mutation chance by 20%'
            },
            master_sprinkler: {
                name: 'Master Sprinkler', price: 10000, uses: 100, rarity: 'legendary',
                effect: { growthBoost: 3.0, mutationChance: 0.3 },
                description: 'Increases growth speed by 200% and mutation chance by 30%'
            },
            
            // Special Gears
            lightning_rod: {
                name: 'Lightning Rod', price: 300, uses: 5, rarity: 'uncommon',
                effect: { forceMutation: 'shocked' },
                description: 'Forces Shocked mutation on target plant'
            },
            moon_crystal: {
                name: 'Moon Crystal', price: 800, uses: 3, rarity: 'rare',
                effect: { forceMutation: 'moonlit' },
                description: 'Forces Moonlit mutation on target plant'
            },
            chocolate_sprinkler: {
                name: 'Chocolate Sprinkler', price: 1500, uses: 10, rarity: 'rare',
                effect: { forceMutation: 'disco' },
                description: 'Forces Disco mutation on target plant'
            },
            plant_mover: {
                name: 'Plant Mover', price: 150, uses: 20, rarity: 'common',
                effect: { move: true },
                description: 'Move plants to different plots'
            }
        },
        
        pets: {
            butterfly: {
                name: 'Butterfly', price: 5000, rarity: 'rare',
                effect: { rainbowMutation: true, cooldown: 1800000 }, // 30 minutes
                description: 'Converts 5 random mutated fruits to rainbow mutation every 30 minutes'
            },
            bee: {
                name: 'Bee', price: 3000, rarity: 'uncommon',
                effect: { growthBoost: 1.3, pollination: true },
                description: 'Increases all plant growth by 30% and enables cross-pollination'
            },
            rabbit: {
                name: 'Rabbit', price: 2000, rarity: 'uncommon',
                effect: { harvestBonus: 1.5 },
                description: 'Increases harvest yield by 50%'
            }
        },
        
        mutations: {
            gold: { name: 'Gold', multiplier: 2.0, color: '🟨', rarity: 'uncommon' },
            wet: { name: 'Wet', multiplier: 1.3, color: '💧', rarity: 'common' },
            frozen: { name: 'Frozen', multiplier: 1.5, color: '❄️', rarity: 'common' },
            chilled: { name: 'Chilled', multiplier: 1.4, color: '🧊', rarity: 'common' },
            shocked: { name: 'Shocked', multiplier: 1.8, color: '⚡', rarity: 'uncommon' },
            rainbow: { name: 'Rainbow', multiplier: 3.0, color: '🌈', rarity: 'rare' },
            big: { name: 'Big', multiplier: 1.6, color: '🔍', rarity: 'common' },
            moonlit: { name: 'Moonlit', multiplier: 2.5, color: '🌙', rarity: 'rare' },
            disco: { name: 'Disco', multiplier: 4.0, color: '🕺', rarity: 'rare' },
            bloodlit: { name: 'Bloodlit', multiplier: 2.2, color: '🩸', rarity: 'uncommon' },
            celestial: { name: 'Celestial', multiplier: 5.0, color: '✨', rarity: 'legendary' },
            zombified: { name: 'Zombified', multiplier: 1.2, color: '🧟', rarity: 'uncommon' }
        },
        
        events: {
            lunar_glow: {
                name: 'Lunar Glow', duration: 600000, // 10 minutes
                effects: { moonlitChance: 0.3, growthBoost: 1.2 },
                description: 'Increased moonlit mutation chance and growth speed'
            },
            blood_moon: {
                name: 'Blood Moon', duration: 900000, // 15 minutes
                effects: { bloodlitChance: 0.4, sellPriceBoost: 1.5 },
                description: 'Increased bloodlit mutations and sell prices'
            },
            meteor_shower: {
                name: 'Meteor Shower', duration: 300000, // 5 minutes
                effects: { celestialChance: 0.2, experienceBoost: 2.0 },
                description: 'Chance for celestial mutations and double experience'
            },
            thunderstorm: {
                name: 'Thunderstorm', duration: 480000, // 8 minutes
                effects: { shockedChance: 0.5, wetChance: 0.3 },
                description: 'High chance for shocked and wet mutations'
            }
        },
        
        weather: {
            sunny: { name: 'Sunny', growthBoost: 1.0, mutationChance: 0.05 },
            rainy: { name: 'Rainy', growthBoost: 1.2, wetChance: 0.2 },
            stormy: { name: 'Stormy', growthBoost: 0.8, shockedChance: 0.3 },
            snowy: { name: 'Snowy', growthBoost: 0.9, frozenChance: 0.25, chilledChance: 0.15 },
            night: { name: 'Night', growthBoost: 0.95, moonlitChance: 0.1 }
        },
        
        quests: {
            daily: [
                { id: 'harvest_10', name: 'Harvest 10 plants', requirement: 10, reward: { money: 500, experience: 100 } },
                { id: 'plant_5_seeds', name: 'Plant 5 seeds', requirement: 5, reward: { money: 200, experience: 50 } },
                { id: 'get_mutation', name: 'Get any mutation', requirement: 1, reward: { money: 1000, experience: 200 } },
                { id: 'earn_money', name: 'Earn 1000 money from selling', requirement: 1000, reward: { rare_seed: 1, experience: 150 } }
            ],
            weekly: [
                { id: 'harvest_100', name: 'Harvest 100 plants', requirement: 100, reward: { money: 5000, experience: 1000, gear: 'advanced_sprinkler' } },
                { id: 'collect_mutations', name: 'Collect 10 different mutations', requirement: 10, reward: { money: 10000, experience: 2000, pet: 'butterfly' } }
            ]
        },
        
        shops: {
            seed_shop: {
                name: 'Seed Shop',
                npc: 'Farmer Joe',
                restockTime: 600000, // 10 minutes
                lastRestock: 0,
                stock: {
                    wheat: 20, corn: 15, tomato: 12, carrot: 18, potato: 25,
                    strawberry: 8, blueberry: 6, pumpkin: 4,
                    dragon_fruit: 2, golden_apple: 1
                }
            },
            gear_shop: {
                name: 'Gear Shop',
                npc: 'Engineer Sam',
                restockTime: 600000,
                lastRestock: 0,
                stock: {
                    basic_sprinkler: 10, advanced_sprinkler: 5, godly_sprinkler: 2,
                    lightning_rod: 8, moon_crystal: 3, chocolate_sprinkler: 2,
                    plant_mover: 15
                }
            },
            pet_shop: {
                name: 'Pet Shop',
                npc: 'Animal Lover Lisa',
                restockTime: 1800000, // 30 minutes
                lastRestock: 0,
                stock: {
                    butterfly: 1, bee: 2, rabbit: 3
                }
            }
        }
    }
    
    let farmDb = readFarmDB()
    
    function readFarmDB() {
        try {
            if (fs.existsSync(farmDbPath)) {
                const dbContent = fs.readFileSync(farmDbPath, 'utf-8')
                return JSON.parse(dbContent)
            }
            return { ...defaultFarmData }
        } catch (e) {
            console.log(`Farm Database read error: ${e}`)
            return { ...defaultFarmData }
        }
    }
    
    function writeFarmDB() {
        try {
            fs.writeFileSync(farmDbPath, JSON.stringify(farmDb, null, 4), 'utf-8')
        } catch (e) {
            console.log(`Farm Database write error: ${e}`)
        }
    }
    
    return {
        get data() {
            return farmDb
        },
        
        save() {
            writeFarmDB()
            return true
        },
        
        // Shop management
        restockShop(shopName) {
            const shop = farmDb.shops[shopName]
            if (!shop) return false
            
            const now = Date.now()
            if (now - shop.lastRestock >= shop.restockTime) {
                // Restock logic based on shop type
                if (shopName === 'seed_shop') {
                    shop.stock = {
                        wheat: 20, corn: 15, tomato: 12, carrot: 18, potato: 25,
                        strawberry: 8, blueberry: 6, pumpkin: 4,
                        dragon_fruit: 2, golden_apple: 1
                    }
                } else if (shopName === 'gear_shop') {
                    shop.stock = {
                        basic_sprinkler: 10, advanced_sprinkler: 5, godly_sprinkler: 2,
                        lightning_rod: 8, moon_crystal: 3, chocolate_sprinkler: 2,
                        plant_mover: 15
                    }
                } else if (shopName === 'pet_shop') {
                    shop.stock = {
                        butterfly: 1, bee: 2, rabbit: 3
                    }
                }
                
                shop.lastRestock = now
                this.save()
                return true
            }
            return false
        },
        
        // Weather system
        getCurrentWeather() {
            const hour = new Date().getHours()
            const random = Math.random()
            
            if (hour >= 22 || hour <= 6) return 'night'
            if (random < 0.1) return 'stormy'
            if (random < 0.25) return 'rainy'
            if (random < 0.35) return 'snowy'
            return 'sunny'
        },
        
        // Event system
        getActiveEvent() {
            // Simple event logic - can be expanded
            const random = Math.random()
            const hour = new Date().getHours()
            
            if (random < 0.05) { // 5% chance
                if (hour >= 20 || hour <= 4) return 'lunar_glow'
                if (random < 0.02) return 'blood_moon'
                if (random < 0.01) return 'meteor_shower'
                if (this.getCurrentWeather() === 'stormy') return 'thunderstorm'
            }
            
            return null
        }
    }
}

export default FarmDB()