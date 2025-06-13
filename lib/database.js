import { defaultPrefix } from '../setting.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { colors } from './src/function.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BACKPACK_LEVELS = {
    BASIC: { capacity: 20, name: 'Tas Kecil' },
    MEDIUM: { capacity: 50, name: 'Tas Sedang' },
    LARGE: { capacity: 100, name: 'Tas Besar' }
}

function DB() {
    const dbPath = path.join(__dirname, '../json/database.json')

    const defaultGroupUser = {
        jid: '',
        level: 1,
        exp: 0,
        limit: 7
    }

    const defaultUser = {
        jid: '',
        nama: '',
        report: 0,
        warn: 0,
        membership: {
            basic: { status: false, time: 0 },
            plus: { status: false, time: 0 },
            pro: { status: false, time: 0 }
        },
        banned: {
            status: false,
            time: 0
        },
        sticker: {
            author: false,
            name: false
        },
        playerInfo: {
            namaLengkap: '',
            id: '',
            jenisKelamin: '',
            level: 1,
            exp: 0,
            limit: 7,
            health: 100,
            lapar: 100,
            haus: 100,
            energy: 100,
            mood: 100,
            lastBackpackWarning: 0
        },
        playerStatus: {
            jail: { status: false, time: 0 },
            missions: {
                active: [],
                completed: [],
                failed: [],
                honor: 0
            },
            warn: 0,
            registered: false,
            kewarganegaraan: '',
            pekerjaan: [],
            perkawinan: '',
            sakit: false,
            pingsan: false,
            waifu: {}
        },
        playerStats: {
            registrationDate: 0,
            lastActive: 0,
            commandsUsed: {},
            helpCount: 0,
            nameChanges: 0,
            lastNameChange: 0,
            healthyDays: 0,
            lastHealthCheck: 0,
            helpCooldown: {},
            lastHealthDecay: 0
        },
        playerInventory: {
            backpack: {
                level: 'BASIC',
                capacity: BACKPACK_LEVELS.BASIC.capacity,
                currentWeight: 0
            },
            items: {
                // Makanan & Minuman
                rice: 0, oil: 0, sugar: 0, flour: 0, salt: 0,
                coffee: 0, tea: 0, milk: 0, air: 0,
                omorice: 0, pizza: 0, snack: 0, burger: 0, fries: 0,
                
                // Elektronik
                phone: 0, laptop: 0, charger: 0,
                
                // Medical
                obat: 0, painkiller: 0, bandage: 0,
                
                // Currency & Special
                uang: 0,
                
                // Documents
                passport: {
                    number: '',
                    issueDate: '',
                    expiryDate: '',
                    nationality: ''
                },
                passportStamps: []
            },
            sertifikatDanDokumen: {
                idCard: { imageUrl: '', expiryDate: 0 },
                lisensiBisnis: { imageUrl: '', expiryDate: 0 },
                sertifikatKesehatan: { imageUrl: '', expiryDate: 0 },
                bpjs: { imageUrl: '', expiryDate: 0 },
                bukuNikah: ''
            }
        },
        playerLocation: {
            city: '',
            country: '',
            street: '',
            houseNumber: 0,
            postalCode: 0
        }
    }

    const defaultGroup = {
        jid: '',
        setting: {
            banned: false,
            detect: false,
            nsfw: false,
            antilink: false,
            antiraid: false,
            antivo: false,
            welcome: { status: false, msg: '' }
        },
        users: []
    }

    const defaultSetting = {
        jid: '',
        mode: 'public',
        prefix: [],
        autojoin: false
    }

    const defaultData = {
        users: [],
        groups: [],
        settings: [],
        stickers: [],
        others: []
    }

    let db = readDB()

    function readDB() {
        try {
            if (fs.existsSync(dbPath)) {
                const dbContent = fs.readFileSync(dbPath, 'utf-8')
                return JSON.parse(dbContent)
            }
            return defaultData
        } catch (e) {
            console.log(colors(`Database read error: ${e}`, 'bgRed'))
            return defaultData
        }
    }

    function writeDB() {
        try {
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 4), 'utf-8')
        } catch (e) {
            console.log(colors(`Database write error: ${e}`, 'bgRed'))
        }
    }

    function initObject(target, source) {
        for (const prop in source) {
            if (typeof target[prop] === 'undefined') {
                target[prop] = Array.isArray(source[prop])
                    ? [...source[prop]]
                    : (typeof source[prop] === 'object' && source[prop] !== null
                        ? { ...source[prop] }
                        : source[prop])
            } else if (typeof source[prop] === 'object' && source[prop] !== null && !Array.isArray(source[prop])) {
                initObject(target[prop], source[prop])
            }
        }
    }

    function deepMerge(target, source) {
        const result = { ...target }
        
        for (const key in source) {
            if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
                    result[key] = deepMerge(result[key], source[key])
                } else {
                    result[key] = { ...source[key] }
                }
            } else {
                result[key] = source[key]
            }
        }
        
        return result
    }

    // backpack yes papa
    function calculateItemWeight(items) {
        const weights = {
            // Makanan (berat)
            rice: 2, oil: 1, sugar: 1, flour: 2, salt: 1,
            omorice: 1, pizza: 2, burger: 1, fries: 1,
            
            // Minuman (sedang)
            coffee: 1, tea: 1, milk: 1, air: 1, snack: 1,
            
            // Elektronik (berat)
            phone: 1, laptop: 5, charger: 1,
            
            // Medical (ringan)
            obat: 1, painkiller: 1, bandage: 1,
            
            // Currency (tidak ada berat)
            uang: 0
        }
        
        let totalWeight = 0
        for (const [item, quantity] of Object.entries(items)) {
            if (weights[item] && typeof quantity === 'number') {
                totalWeight += weights[item] * quantity
            }
        }
        return totalWeight
    }

    function canAddItem(user, itemName, quantity = 1) {
        const backpack = user.playerInventory.backpack
        const currentWeight = calculateItemWeight(user.playerInventory.items)
        const itemWeight = calculateItemWeight({ [itemName]: quantity })
        
        return (currentWeight + itemWeight) <= backpack.capacity
    }

    function upgradeBackpack(user, level) {
        if (!BACKPACK_LEVELS[level]) return false
        
        user.playerInventory.backpack = {
            level,
            capacity: BACKPACK_LEVELS[level].capacity,
            currentWeight: calculateItemWeight(user.playerInventory.items)
        }
        return true
    }

    return {
        backpack: {
            getInfo(jid) {
                const user = db.users.find(u => u.jid === jid)
                if (!user) return null
                
                const backpack = user.playerInventory.backpack
                const currentWeight = calculateItemWeight(user.playerInventory.items)
                
                return {
                    level: backpack.level,
                    name: BACKPACK_LEVELS[backpack.level].name,
                    capacity: backpack.capacity,
                    currentWeight,
                    freeSpace: backpack.capacity - currentWeight,
                    percentage: Math.round((currentWeight / backpack.capacity) * 100)
                }
            },
            
            canAdd(jid, itemName, quantity = 1) {
                const user = db.users.find(u => u.jid === jid)
                return user ? canAddItem(user, itemName, quantity) : false
            },
            
            upgrade(jid, level) {
                const user = db.users.find(u => u.jid === jid)
                if (!user) return false
                
                return upgradeBackpack(user, level)
            },
            
            getLevels() {
                return BACKPACK_LEVELS
            }
        },

        groups: {
            add(jid) {
                if (this.exist(jid)) return false
                const newGroup = { ...defaultGroup, jid }
                db.groups.push(newGroup)
                return newGroup
            },
            
            get(jid) {
                const group = db.groups.find(c => c.jid === jid)
                if (!group) return null
                
                return {
                    ...group,
                    users: {
                        add(userJid) {
                            if (this.exist(userJid)) return false
                            const newUser = { ...defaultGroupUser, jid: userJid }
                            group.users.push(newUser)
                            return newUser
                        },
                        get(userJid) {
                            let user = group.users.find(c => c.jid === userJid)
                            if (user) {
                                initObject(user, defaultGroupUser)
                            }
                            return user
                        },
                        list() {
                            return group.users
                        },
                        exist(userJid) {
                            return group.users.some(u => u.jid === userJid)
                        },
                        del(userJid) {
                            const initialLength = group.users.length
                            group.users = group.users.filter(u => u.jid !== userJid)
                            return group.users.length < initialLength
                        }
                    }
                }
            },
            
            list() {
                return db.groups
            },
            
            exist(jid) {
                return db.groups.some(group => group.jid === jid)
            },
            
            del(jid) {
                const initialLength = db.groups.length
                db.groups = db.groups.filter(group => group.jid !== jid)
                return db.groups.length < initialLength
            }
        },

        users: {
            add(jid, { name = '', report = 0 } = {}) {
                if (this.exist(jid)) return false
                const newUser = { ...defaultUser, jid, nama: name, report }
                db.users.push(newUser)
                return newUser
            },
            
            update(jid, updates = {}) {
                const userIndex = db.users.findIndex(u => u.jid === jid)
                if (userIndex === -1) return false
                
                db.users[userIndex] = deepMerge(db.users[userIndex], updates)
                
                // perbarui berat backpack setelah ada perubahan jumlah item
                if (updates.playerInventory?.items) {
                    const currentWeight = calculateItemWeight(db.users[userIndex].playerInventory.items)
                    db.users[userIndex].playerInventory.backpack.currentWeight = currentWeight
                }
                
                return db.users[userIndex]
            },
            
            get(jid) {
                let user = db.users.find(c => c.jid === jid)
                if (!user) {
                    user = { ...defaultUser, jid }
                    db.users.push(user)
                } else {
                    initObject(user, defaultUser)
                }
                return user
            },
            
            list() {
                return db.users
            },
            
            exist(jid) {
                return db.users.some(u => u.jid === jid)
            },
            
            del(jid) {
                const initialLength = db.users.length
                db.users = db.users.filter(u => u.jid !== jid)
                return db.users.length < initialLength
            }
        },

        settings: {
            add(jid) {
                if (this.exist(jid)) return false
                const newSetting = { ...defaultSetting, jid, prefix: defaultPrefix }
                db.settings.push(newSetting)
                return newSetting
            },
            
            get(jid) {
                return db.settings.find(c => c.jid === jid)
            },
            
            list() {
                return db.settings
            },
            
            exist(jid) {
                return db.settings.some(u => u.jid === jid)
            },
            
            del(jid) {
                const initialLength = db.settings.length
                db.settings = db.settings.filter(u => u.jid !== jid)
                return db.settings.length < initialLength
            }
        },

        stickers: {
            add(data) {
                if (this.exist(data.string)) return false
                db.stickers.push(data)
                return data
            },
            
            get(string) {
                return db.stickers.find(s => s.string === string)
            },
            
            list() {
                return db.stickers
            },
            
            exist(string) {
                return db.stickers.some(s => s.string === string)
            },
            
            del(string) {
                const initialLength = db.stickers.length
                db.stickers = db.stickers.filter(s => s.string !== string)
                return db.stickers.length < initialLength
            }
        },

        save() {
            writeDB()
            return true
        }
    }
}

export default DB()