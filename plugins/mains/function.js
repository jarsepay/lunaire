import fs from 'fs'
import {
    backpackEffect,
    sendBackpackWarning,
    autoCleanup,
    checkBackpackBeforeAdd
} from '../../lib/databases/backpack.js'

const BANNED_TIME = 18000000 // 5 jam
const HEALTH_DECAY_INTERVAL = 3600000 // 1 jam
const HEALTH_DECAY_AMOUNT = 5 // berkurang 5 setiap jam
const BACKPACK_WEIGHT_PENALTY_THRESHOLD = 90 // mulai penalty di 90%
const BACKPACK_HEALTH_PENALTY = 2 // penalty tambahan untuk kesehatan

// Delivery tracking constants
const DELIVERY_UPDATE_INTERVAL = 30000 // 30 detik
const DELIVERY_STATUS_STAGES = [
    { status: 'PAKET SEDANG DIKEMAS', location: 'SORTING_CENTER', delay: 0 },
    { status: 'PAKET TELAH SAMPAI DI SORTING CENTER', location: 'SORTING_CENTER', delay: 60000 }, // 1 menit
    { status: 'PAKET SEDANG DISORTIR', location: 'SORTING_CENTER', delay: 120000 }, // 2 menit
    { status: 'PAKET TELAH DISORTIR', location: 'SORTING_CENTER', delay: 180000 }, // 3 menit
    { status: 'PAKET SEDANG DIANTAR', location: 'IN_TRANSIT', delay: 300000 }, // 5 menit
    { status: 'PAKET SIAP DIANTAR KE PENERIMA', location: 'OUT_FOR_DELIVERY', delay: 600000 }, // 10 menit
    { status: 'PAKET TELAH DITERIMA OLEH PENERIMA', location: 'DELIVERED', delay: 900000 } // 15 menit
]

class DeliveryDB {
    constructor() {
        this.dbPath = 'json/delivery.json'
        this.data = this.readDB()
    }
    
    readDB() {
        try {
            if (fs.existsSync(this.dbPath)) {
                return JSON.parse(fs.readFileSync(this.dbPath, 'utf-8'))
            }
            return { packages: [], couriers: [], trackingHistory: [] }
        } catch (e) {
            console.log(`Delivery DB error: ${e}`)
            return { packages: [], couriers: [], trackingHistory: [] }
        }
    }
    
    writeDB() {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 4))
        } catch (e) {
            console.log(`Delivery write error: ${e}`)
        }
    }

    addTrackingHistory(trackingNumber, status, location) {
        const pkg = this.data.packages.find(p => p.trackingNumber === trackingNumber)
        if (!pkg) return false
        
        const history = {
            timestamp: Date.now(),
            status,
            location,
            date: new Date().toLocaleString('id-ID')
        }
        
        pkg.trackingHistory.push(history)
        this.writeDB()
        return true
    }

    updatePackageStatus(trackingNumber, status) {
        const pkg = this.data.packages.find(p => p.trackingNumber === trackingNumber)
        if (!pkg) return false

        pkg.status = status
        this.writeDB()
        return true
    }

    getActivePackages() {
        return this.data.packages.filter(pkg => 
            pkg.status !== 'DELIVERED' && 
            pkg.status !== 'CANCELLED' &&
            pkg.status !== 'RETURNED'
        )
    }

    getPackagesByBuyer(buyerJid) {
        return this.data.packages.filter(pkg => pkg.buyerJid === buyerJid)
    }
}

export const before = {
    async start({ m, db }) {
        const sender = m.sender
        const currentTime = Date.now()
        
        if (!m.message) return

        const user = db.users.get(sender)
        
        const banned = user.banned || {}
        const membership = user.membership || {}
        const profile = user.playerInfo || {}
        const status = user.playerStatus || {}
        const stats = user.playerStats || {}
        const inventory = user.playerInventory || {}
        const dokumen = inventory.sertifikatDanDokumen || {}

        const backpackInfo = db.backpack.getInfo(sender)

        // Kurangi health setiap jam
        const lastHealthDecay = stats.lastHealthDecay || currentTime
        if (currentTime - lastHealthDecay >= HEALTH_DECAY_INTERVAL) {
            await this.handleHealth(db, sender, profile, currentTime, backpackInfo)
        }

        // Monitoring beraat backpack
        await backpackEffect(db, sender, m, backpackInfo, profile)

        // Update delivery tracking secara realtime
        await this.updateDeliveryTracking(db, sender, m, currentTime)

        // player stats ke rentang 0-100
        this.clampPlayerStats(profile)

        // warning autoban
        if (user.warn >= 20) {
            await this.autoBan(db, sender, m)
        }

        db.users.update(sender, { playerInfo: profile })

        // item kedaluwarsa
        await this.itemKedaluwarsa(db, sender, m, banned, status, membership, dokumen)

        // auto inventory cleanup kalo backpack penuh
        await autoCleanup(db, sender, m, backpackInfo)

        db.save()
    },

    // ipdate delivery tracking secara realtime
    async updateDeliveryTracking(db, sender, m, currentTime) {
        const deliveryDB = new DeliveryDB()
        const activePackages = deliveryDB.getActivePackages()
        let hasUpdates = false

        for (const pkg of activePackages) {
            // cek apakah paket ini milik user atau user adalah penjual/kurir
            const isRelated = pkg.buyerJid === sender ||  pkg.sellerJid === sender ||  pkg.courierJid === sender

            if (!isRelated) continue

            const packageAge = currentTime - pkg.createdAt
            const lastUpdate = pkg.trackingHistory.length > 0 ?  pkg.trackingHistory[pkg.trackingHistory.length - 1].timestamp :  pkg.createdAt

            // cari stage yang sesuai berdasarkan waktu
            const currentStage = DELIVERY_STATUS_STAGES.find(stage => 
                packageAge >= stage.delay && 
                !pkg.trackingHistory.some(h => h.status === stage.status)
            )

            if (currentStage && (currentTime - lastUpdate) >= DELIVERY_UPDATE_INTERVAL) {
                // update status paket
                let statusMessage = currentStage.status
                
                // pprsonalisasi pesan berdasarkan lokasi
                if (currentStage.status.includes('SORTING CENTER')) {
                    const [destCity] = pkg.destination.split(':')
                    statusMessage = currentStage.status.replace('SORTING CENTER', `SORTING CENTER ${destCity}`)
                } else if (currentStage.status.includes('DIANTAR')) {
                    statusMessage = `${currentStage.status} KE ${pkg.destination} VIA JALUR DARAT DENGAN ESTIMASI ${pkg.estimatedDays} HARI`
                }

                deliveryDB.addTrackingHistory(pkg.trackingNumber, statusMessage, currentStage.location)
                deliveryDB.updatePackageStatus(pkg.trackingNumber, currentStage.location)

                if (pkg.buyerJid === sender) {
                    await this.sendDeliveryNotification(m, pkg, statusMessage, 'buyer')
                } else if (pkg.sellerJid === sender) {
                    await this.sendDeliveryNotification(m, pkg, statusMessage, 'seller')
                } else if (pkg.courierJid === sender) {
                    await this.sendDeliveryNotification(m, pkg, statusMessage, 'courier')
                }

                hasUpdates = true

                // kika paket sudah delivered, update inventory buyer
                if (currentStage.location === 'DELIVERED') {
                    await this.handleDeliveredPackage(db, pkg)
                }
            }
        }

        // auto-assign courier untuk paket yang siap diambil
        await this.autoAssignCourier(deliveryDB, currentTime)
    },

    // kirim notifikasi delivery update
    async sendDeliveryNotification(m, pkg, statusMessage, userType) {
        let notificationText = `📦 *\`UPDATE PENGIRIMAN\`*\n\n`
        notificationText += `🏷️ ${pkg.trackingNumber}\n`
        notificationText += `📊 ${statusMessage}\n`
        notificationText += `🕒 ${new Date().toLocaleString('id-ID')}\n\n`

        if (userType === 'buyer') {
            notificationText += `💰 Total: $${pkg.totalValue}\n`
            notificationText += `🚚 ${pkg.courierService}\n`
            if (pkg.status === 'DELIVERED') {
                notificationText += `\nPaket telah diterima. Gunakan: \`market rate ${pkg.trackingNumber} shop 5\` untuk memberi rating.`
            }
        } else if (userType === 'seller') {
            notificationText += `💵 Penjualan: $${pkg.totalValue}\n`
            if (pkg.status === 'DELIVERED') {
                notificationText += `\nPaket berhasil diantar ke pembeli.`
            }
        } else if (userType === 'courier') {
            notificationText += `💰 Komisi: $${Math.floor(pkg.totalValue * 0.1)}\n`
            if (pkg.status === 'DELIVERED') {
                notificationText += `\nPengiriman selesai. Komisi telah ditambahkan.`
            }
        }

        // kirim notifikasi (tidak mengganggu chat aktif)
        // hanya kirim jika bukan command market yang sedang aktif
        if (!m.text?.toLowerCase().startsWith('market')) {
            await m.reply(notificationText)
        }
    },

    // handle paket yang sudah delivered
    async handleDeliveredPackage(db, pkg) {
        const buyer = db.users.get(pkg.buyerJid)
        if (!buyer) return

        // tambahkan items ke inventory buyer
        for (const item of pkg.items) {
            if (!buyer.playerInventory.items[item.name]) {
                buyer.playerInventory.items[item.name] = 0
            }
            buyer.playerInventory.items[item.name] += item.quantity
        }

        db.users.update(pkg.buyerJid, { playerInventory: buyer.playerInventory })

        // update statistik kurir jika ada
        if (pkg.courierJid) {
            const deliveryDB = new DeliveryDB()
            const courier = deliveryDB.data.couriers.find(c => c.jid === pkg.courierJid)
            if (courier) {
                courier.deliveredPackages += 1
                courier.earnings += Math.floor(pkg.totalValue * 0.1)
                deliveryDB.writeDB()

                // tambahkan uang komisi ke kurir
                const courierUser = db.users.get(pkg.courierJid)
                if (courierUser) {
                    const commission = Math.floor(pkg.totalValue * 0.1)
                    courierUser.playerInventory.items.uang += commission
                    db.users.update(pkg.courierJid, { playerInventory: courierUser.playerInventory })
                }
            }
        }
    },

    // auto assign courier untuk paket yang siap
    async autoAssignCourier(deliveryDB, currentTime) {
        const unassignedPackages = deliveryDB.data.packages.filter(pkg => 
            pkg.status === 'PENDING' && !pkg.courierJid
        )

        for (const pkg of unassignedPackages) {
            // cari kurir yang tersedia di lokasi yang sama
            const availableCouriers = deliveryDB.data.couriers.filter(courier => 
                courier.location === pkg.origin && courier.isActive
            )

            if (availableCouriers.length > 0) {
                // pilih kurir dengan rating tertinggi
                const bestCourier = availableCouriers.sort((a, b) => b.rating - a.rating)[0]
                
                pkg.courierJid = bestCourier.jid
                pkg.status = 'ASSIGNED_TO_COURIER'
                
                deliveryDB.addTrackingHistory(
                    pkg.trackingNumber, 
                    `PAKET TELAH DITUGASKAN KE KURIR ${bestCourier.name}`, 
                    'COURIER_ASSIGNED'
                )

                deliveryDB.writeDB()
            }
        }
    },

    // clamp semua stats player ke 0-100
    clampPlayerStats(profile) {
        const statNames = ['health', 'lapar', 'haus', 'energy', 'mood']
        statNames.forEach(stat => {
            if (profile[stat] > 100) profile[stat] = 100
            if (profile[stat] < 0) profile[stat] = 0
        })
    },

    async handleHealth(db, sender, profile, currentTime, backpackInfo) {
        let healthDecay = HEALTH_DECAY_AMOUNT
        let laparDecay = HEALTH_DECAY_AMOUNT
        let hausDecay = HEALTH_DECAY_AMOUNT
        let energyDecay = HEALTH_DECAY_AMOUNT

        // tambahan penalty berdasarkan persentase
        if (backpackInfo && backpackInfo.percentage >= BACKPACK_WEIGHT_PENALTY_THRESHOLD) {
            const extraPenalty = Math.floor((backpackInfo.percentage - BACKPACK_WEIGHT_PENALTY_THRESHOLD) / 10) * BACKPACK_HEALTH_PENALTY
            healthDecay += extraPenalty
            energyDecay += extraPenalty
        
            // tambahan penalty mood karena stres membawa beban berat
            const moodDecay = Math.floor(backpackInfo.percentage / 20)
            const newMood = Math.max(0, profile.mood - moodDecay)
        
            if (backpackInfo.percentage >= 95) {
                await sendBackpackWarning(m, db, sender, 'CRITICAL')
            } else if (backpackInfo.percentage >= BACKPACK_WEIGHT_PENALTY_THRESHOLD) {
                await sendBackpackWarning(m, db, sender, 'WARNING')
            }
        
            profile.mood = newMood
        }

        const newHealth = Math.max(0, profile.health - healthDecay)
        const newLapar = Math.max(0, profile.lapar - laparDecay)
        const newHaus = Math.max(0, profile.haus - hausDecay)
        const newEnergy = Math.max(0, profile.energy - energyDecay)

        db.users.update(sender, {
            playerInfo: {
                ...profile,
                health: newHealth,
                lapar: newLapar,
                haus: newHaus,
                energy: newEnergy
            },
            playerStats: {
                ...db.users.get(sender).playerStats,
                lastHealthDecay: currentTime
            }
        })

        // kalo health sangat rendah, set status sakit
        if (newHealth <= 20) {
            db.users.update(sender, {
                playerStatus: { 
                    ...db.users.get(sender).playerStatus,
                    sakit: true 
                }
            })
        }

        // kalo energy habis karena backpack berat, beri peringatan
        if (newEnergy <= 10 && backpackInfo?.percentage >= 90) {
            await sendBackpackWarning(m, db, sender, 'EXHAUSTION')
        }
    },

    // auto ban
    async autoBan(db, sender, m) {
        db.users.update(sender, {
            warn: 0,
            banned: { 
                status: true, 
                time: Date.now() + BANNED_TIME 
            }
        })

        await m.reply('Kamu telah di banned selama 5 jam karena mencapai 20 peringatan.')
    },

    // handle semua item yang bisa expired
    async itemKedaluwarsa(db, sender, m, banned, stat, membership, dokumen) {
        const currentTime = Date.now()

        // cek status banned
        if (banned.status && banned.time !== 0 && currentTime > banned.time) {
            db.users.update(sender, {
                banned: { status: false, time: 0 }
            })
            await m.reply('Kamu telah bebas dari banned.')
        }

        // cek status jail
        if (stat.jail.status && stat.jail.time !== 0 && currentTime > stat.jail.time) {
            db.users.update(sender, {
                playerStatus: {
                    jail: { status: false, time: 0 }
                }
            })
            await m.reply('Kamu telah bebas dari penjara.')
        }

        // cek membership
        await this.checkMembershipExpiry(db, sender, m, membership, currentTime)
        
        // cek dokumen & lisensi
        await this.checkDocumentExpiry(db, sender, m, dokumen, currentTime)
    },

    // cek membership
    async checkMembershipExpiry(db, sender, m, membership, currentTime) {
        const membershipTypes = [
            { type: 'basic', name: 'Basic' },
            { type: 'plus', name: 'Plus' },
            { type: 'pro', name: 'Pro' }
        ]

        for (const { type, name } of membershipTypes) {
            const membershipData = membership[type]
            if (membershipData?.status && membershipData.time !== 0 && currentTime > membershipData.time) {
                db.users.update(sender, {
                    membership: {
                        ...membership,
                        [type]: { status: false, time: 0 }
                    }
                })
                await m.reply(`Membership ${name} kamu telah berakhir.`)
            }
        }
    },

    // cek dokumen & lisensi
    async checkDocumentExpiry(db, sender, m, dokumen, currentTime) {
        const documents = [
            { key: 'idCard', name: 'ID Card' },
            { key: 'lisensiBisnis', name: 'Lisensi Bisnis' },
            { key: 'sertifikatKesehatan', name: 'Sertifikat Kesehatan' }
        ]

        for (const { key, name } of documents) {
            const doc = dokumen[key]
            if (doc?.imageUrl && doc.expiryDate !== 0 && currentTime > doc.expiryDate) {
                db.users.update(sender, {
                    playerInventory: {
                        sertifikatDanDokumen: {
                            ...dokumen,
                            [key]: { imageUrl: '', expiryDate: 0 }
                        }
                    }
                })
                await m.reply(`${name} kamu telah kedaluwarsa.`)
            }
        }
    }
}