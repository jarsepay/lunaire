import fs from 'fs'

export const cmd = {
    name: ['market', 'kurir'],
    command: ['market', 'kurir'],
    category: ['roleplay'],
    detail: {
        desc: 'Roleplay platform e-commerce jual beli online.'
    },
    setting: {
        isRegister: true,
        isBanned: false,
        isJail: false
    },
    async start({ m, db, prefix, command, args }) {
        const ecommerceDB = new ECommerceDB()
        const deliveryDB = new DeliveryDB()
        const user = db.users.get(m.sender)

        const subCmd = (args[0] || '').toLowerCase()
        
        if (command === 'market' && !subCmd) {
            let caption = `🛒 *\`DAFTAR PERINTAH\`*\n\n`

            caption += `*Contoh:* \`${prefix + command} setup omishop sports\`\n`
            caption += `*Prefix:* \`${prefix}\`\n\n`

            caption += `*Penjual:*\n`
            caption += `• \`${command} setup\` - Setup toko\n`
            caption += `• \`${command} profile\` - Lihat profil toko\n`
            caption += `• \`${command} editshop\` - Edit toko\n`
            caption += `• \`${command} addcatalog\` - Tambah katalog\n`
            caption += `• \`${command} catalog\` - Lihat katalog\n`
            caption += `• \`${command} discount\` - Set diskon\n`
            caption += `• \`${command} orders\` - Lihat pesanan\n\n`
            
            caption += `*Pembeli:*\n`
            caption += `• \`${command} home\` - Beranda market\n`
            caption += `• \`${command} search\` - Cari toko\n`
            caption += `• \`${command} buy\` - Beli produk\n`
            caption += `• \`${command} myorders\` - Pesanan saya\n`
            caption += `• \`${command} track\` - Lacak paket\n`
            caption += `• \`${command} rate\` - Rating toko/kurir`

            return m.reply(caption.trim())
        }
        
        if (command === 'kurir' && !subCmd) {
            if (!args[0]) {
                let caption = `🛒 *\`DAFTAR PERINTAH\`*\n\n`

                caption += `*Contoh:* \`${prefix + command} setup omishop sports\`\n`
                caption += `*Prefix:* \`${prefix}\`\n\n`
            
                caption += `*Kurir:*\n`
                caption += `• \`${command} delivery\` - Jadi kurir\n`
                caption += `• \`${command} pickups\` - Ambil paket\n`
                caption += `• \`${command} deliver\` - Antar paket`

                return m.reply(caption.trim())
            }
        }
        
        if (command === 'market') {
            switch (subCmd) {
                case 'setup':
                    return await setupShop(m, user, prefix, command, subCmd, ecommerceDB, args.slice(1))
                case 'profile':
                    return await viewShopProfile(m, prefix, command, ecommerceDB)
                case 'editshop':
                    return await editShop(m, prefix, command, ecommerceDB, args.slice(1))
                case 'addcatalog':
                    return await addCatalog(m, user, prefix, command, subCmd, ecommerceDB, db, args.slice(1))
                case 'catalog':
                    return await viewCatalog(m, ecommerceDB)
                case 'discount':
                    return await setDiscount(m, prefix, command, subCmd, ecommerceDB, args.slice(1))
                case 'orders':
                    return await viewOrders(m, ecommerceDB, deliveryDB)
                case 'home':
                    return await viewMarketHome(m, prefix, command, ecommerceDB)
                case 'search':
                    return await searchShops(m, ecommerceDB, args.slice(1))
                case 'buy':
                    return await buyProduct(m, user, prefix, command, subCmd, ecommerceDB, deliveryDB, db, args.slice(1))
                case 'myorders':
                    return await viewMyOrders(m, deliveryDB)
                case 'track':
                    return await trackPackage(m, prefix, command, subCmd, deliveryDB, args.slice(1))
                case 'rate':
                    return await rateShopOrCourier(m, prefix, command, subCmd, ecommerceDB, deliveryDB, args.slice(1))
                default:
                    return m.reply(`Gunakan \`${ prefix + command }\` untuk melihat daftar perintah.`)
            }
        }

        if (command === 'kurir') {
            switch (subCmd) {
                case 'delivery':
                    return await becomeDelivery(m, user, prefix, command, deliveryDB)
                case 'pickups':
                    return await viewPickups(m, prefix, command, deliveryDB)
                case 'deliver':
                    return await deliverPackage(m, prefix, command, subCmd, deliveryDB, args.slice(1))
                default:
                    return m.reply(`Gunakan \`${ prefix + command }\` untuk melihat daftar perintah.`)
            }
        }
    }
}

class ECommerceDB {
    constructor() {
        this.dbPath = 'json/e-commerce.json'
        this.data = this.readDB()
    }
    
    readDB() {
        try {
            if (fs.existsSync(this.dbPath)) {
                return JSON.parse(fs.readFileSync(this.dbPath, 'utf-8'))
            }
            return { shops: [], categories: [], badges: [] }
        } catch (e) {
            console.log(`E-commerce DB error: ${e}`)
            return { shops: [], categories: [], badges: [] }
        }
    }
    
    writeDB() {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 4))
        } catch (e) {
            console.log(`E-commerce write error: ${e}`)
        }
    }
    
    createShop(ownerJid, shopData) {
        const shop = {
            id: `shop_${Date.now()}`,
            ownerJid,
            name: shopData.name,
            category: shopData.category,
            description: shopData.description || '',
            location: shopData.location,
            avatar: '',
            banner: '',
            catalog: [],
            stats: {
                totalSales: 0,
                totalOrders: 0,
                rating: 0,
                reviewCount: 0,
                badges: []
            },
            settings: {
                isActive: true,
                autoAcceptOrders: false,
                operatingHours: '08:00-20:00'
            },
            createdAt: Date.now()
        }
        
        this.data.shops.push(shop)
        this.writeDB()
        return shop
    }
    
    getShop(ownerJid) {
        return this.data.shops.find(shop => shop.ownerJid === ownerJid)
    }
    
    getShopById(shopId) {
        return this.data.shops.find(shop => shop.id === shopId)
    }
    
    updateShop(ownerJid, updates) {
        const shopIndex = this.data.shops.findIndex(shop => shop.ownerJid === ownerJid)
        if (shopIndex === -1) return false
        
        this.data.shops[shopIndex] = { ...this.data.shops[shopIndex], ...updates }
        this.writeDB()
        return this.data.shops[shopIndex]
    }
    
    addCatalogItem(ownerJid, item) {
        const shop = this.getShop(ownerJid)
        if (!shop) return false
        
        const catalogItem = {
            id: `item_${Date.now()}`,
            name: item.name,
            stock: item.stock,
            originalPrice: item.price,
            currentPrice: item.price,
            description: item.description || '',
            category: item.category || 'general',
            discount: 0,
            images: [],
            addedAt: Date.now()
        }
        
        shop.catalog.push(catalogItem)
        this.writeDB()
        return catalogItem
    }
    
    searchShops(query, category = null) {
        let shops = this.data.shops.filter(shop => shop.settings.isActive)
        
        if (query) {
            shops = shops.filter(shop => 
                shop.name.toLowerCase().includes(query.toLowerCase()) ||
                shop.description.toLowerCase().includes(query.toLowerCase())
            )
        }
        
        if (category) {
            shops = shops.filter(shop => shop.category === category)
        }
        
        return shops.sort((a, b) => b.stats.rating - a.stats.rating)
    }
    
    getTopShops(limit = 10) {
        return this.data.shops
            .filter(shop => shop.settings.isActive)
            .sort((a, b) => b.stats.totalSales - a.stats.totalSales)
            .slice(0, limit)
    }

    updateCatalogItem(ownerJid, itemId, updates) {
        const shop = this.getShop(ownerJid)
        if (!shop) return false
    
        const itemIndex = shop.catalog.findIndex(item => item.id === itemId)
        if (itemIndex === -1) return false
    
        shop.catalog[itemIndex] = { ...shop.catalog[itemIndex], ...updates }
        this.writeDB()
        return shop.catalog[itemIndex]
    }

    getShopsByCategory(category) {
        return this.data.shops.filter(shop => 
            shop.category === category && shop.settings.isActive
        ).sort((a, b) => b.stats.rating - a.stats.rating)
    }

    addBadgeToShop(shopId, badge) {
        const shop = this.getShopById(shopId)
        if (!shop || shop.stats.badges.includes(badge)) return false
    
        shop.stats.badges.push(badge)
        this.writeDB()
        return true
    }
}

class DeliveryDB {
    constructor() {
        this.dbPath = 'json/delivery.json'
        this.data = this.readDB()
        this.locations = [
            'Los Angeles:United States', 'Toronto:Canada', 'Las Vegas:United States',
            'New York:United States', 'London:United Kingdom', 'Tokyo:Japan',
            'Miami:United States', 'Paris:France', 'Amsterdam:Netherlands',
            'Seoul:South Korea', 'Shanghai:China'
        ]
        this.courierServices = ['FastEx', 'OmiExpress', 'QuickShip', 'SpeedPost', 'UltraDelivery']
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
    
    createPackage(orderData) {
        const trackingNumber = `TRK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
        
        const packaging = {
            trackingNumber,
            orderId: orderData.orderId,
            shopId: orderData.shopId,
            buyerJid: orderData.buyerJid,
            sellerJid: orderData.sellerJid,
            items: orderData.items,
            totalValue: orderData.totalValue,
            origin: orderData.origin,
            destination: orderData.destination,
            courierService: this.courierServices[Math.floor(Math.random() * this.courierServices.length)],
            courierJid: null,
            status: 'PENDING',
            estimatedDays: this.calculateEstimatedDays(orderData.origin, orderData.destination),
            createdAt: Date.now(),
            trackingHistory: []
        }
        
        this.data.packages.push(packaging)
        this.addTrackingHistory(trackingNumber, 'PAKET SEDANG DIKEMAS', 'SORTING_CENTER')
        this.writeDB()
        return packaging
    }
    
    calculateEstimatedDays(origin, destination) {
        const [originCity, originCountry] = origin.split(':')
        const [destCity, destCountry] = destination.split(':')
        
        if (originCountry === destCountry) {
            return Math.floor(Math.random() * 3) + 1 // 1-3 hari
        } else {
            return Math.floor(Math.random() * 7) + 3 // 3-10 hari
        }
    }
    
    addTrackingHistory(trackingNumber, status, location) {
        const packaging = this.data.packages.find(pkg => pkg.trackingNumber === trackingNumber)
        if (!packaging) return false
        
        const history = {
            timestamp: Date.now(),
            status,
            location,
            date: new Date().toLocaleString('id-ID')
        }
        
        packaging.trackingHistory.push(history)
        this.writeDB()
        return true
    }
    
    assignCourier(trackingNumber, courierJid) {
        const packaging = this.data.packages.find(pkg => pkg.trackingNumber === trackingNumber)
        if (!packaging) return false
        
        packaging.courierJid = courierJid
        packaging.status = 'IN_TRANSIT'
        this.addTrackingHistory(trackingNumber, `EKSPEDISI ${packaging.courierService} TELAH MENERIMA PAKET`, 'COURIER')
        return true
    }
    
    getPackagesByBuyer(buyerJid) {
        return this.data.packages.filter(pkg => pkg.buyerJid === buyerJid)
    }
    
    getPackagesBySeller(sellerJid) {
        return this.data.packages.filter(pkg => pkg.sellerJid === sellerJid)
    }
    
    getAvailablePickups(courierLocation) {
        return this.data.packages.filter(pkg => 
            pkg.status === 'READY_FOR_PICKUP' && 
            pkg.origin === courierLocation
        )
    }

    updatePackageStatus(trackingNumber, status) {
        const pkg = this.data.packages.find(p => p.trackingNumber === trackingNumber)
        if (!pkg) return false
    
        pkg.status = status
        this.writeDB()
        return true
    }

    getCourierStats(courierJid) {
        const courier = this.data.couriers.find(c => c.jid === courierJid)
        return courier || null
    }
}

async function setupShop(m, user, prefix, command, cmd, ecommerceDB, args) {
    if (ecommerceDB.getShop(m.sender)) {
        return m.reply('Kamu sudah memiliki toko.')
    }
    
    if (args.length < 2) {
        return m.reply(`Gunakan: \`${ prefix + command } ${cmd} [nama toko] [kategori]\`\n\n*Kategori tersedia:*\n• electronics\n• fashion\n• food\n• health\n• books\n• sports\n• home\n• automotive\n• beauty\n• toys`)
    }
    
    const shopName = args[0]
    const category = args[1].toLowerCase()
    const validCategories = ['electronics', 'fashion', 'food', 'health', 'books', 'sports', 'home', 'automotive', 'beauty', 'toys']
    
    if (!validCategories.includes(category)) {
        return m.reply('Kategori tidak valid.')
    }
    
    const userLocation = `${user.playerLocation.city}:${user.playerLocation.country}`
    
    const shop = ecommerceDB.createShop(m.sender, {
        name: shopName,
        category,
        location: userLocation
    })
    
    m.reply(`🏪 *\`TOKO BARU DIBUAT!\`*\n\n• Toko: *${shop.name}*\n• Kategori: ${category}\n• Lokasi: ${userLocation}\n• ID Toko: ${shop.id}\n\nGunakan: \`${ prefix + command } addcatalog\` untuk menambah produk.`)
}

async function viewShopProfile(m, prefix, command, ecommerceDB) {
    const shop = ecommerceDB.getShop(m.sender)
    if (!shop) {
        return m.reply(`Kamu belum memiliki toko. Gunakan: \`${ prefix + command } setup\` untuk membuat toko.`)
    }
    
    const badges = shop.stats.badges.length > 0 ? shop.stats.badges.join(', ') : 'Belum ada'
    
    m.reply(`🏪 *\`PROFIL TOKO\`*\n\n• Toko: *${shop.name}*\n• Kategori: ${shop.category}\n• Lokasi: ${shop.location}\• ID: ${shop.id}\n\n📊 *Statistik:*\n• Total Penjualan: ${shop.stats.totalSales}\• Total Pesanan: ${shop.stats.totalOrders}\n• Rating: ${shop.stats.rating}/5 (${shop.stats.reviewCount} ulasan)\n• Badge: ${badges}\n\n📝 Deskripsi: ${shop.description || 'Belum ada deskripsi'}\n🕒 Jam Operasional: ${shop.settings.operatingHours}\n\n• Katalog: ${shop.catalog.length} produk`)
}

async function editShop(m, prefix, command, ecommerceDB, args) {
    const shop = ecommerceDB.getShop(m.sender)
    if (!shop) {
        return m.reply('Kamu belum memiliki toko.')
    }
    
    if (args.length < 2) {
        return m.reply(`Gunakan: \`${prefix + command} editshop [field] [value]\`\n\n*Field yang bisa diubah:*\n• name - Nama toko\n• description - Deskripsi toko\n• hours - Jam operasional (format: 08:00-20:00)`)
    }
    
    const field = args[0].toLowerCase()
    const value = args.slice(1).join(' ')
    
    switch (field) {
        case 'name':
            shop.name = value
            break
        case 'description':
            shop.description = value
            break
        case 'hours':
            if (!/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(value)) {
                return m.reply('Gunakan format: \`08:00-20:00\`')
            }
            shop.settings.operatingHours = value
            break
        default:
            return m.reply('Field tidak valid.')
    }
    
    ecommerceDB.writeDB()
    m.reply(`✅ *\`TOKO DIPERBARUI\`*\n\n• ${field}: ${value}`)
}

async function addCatalog(m, user, prefix, command, cmd, ecommerceDB, db, args) {
    const shop = ecommerceDB.getShop(m.sender)
    if (!shop) {
        return m.reply('Kamu belum memiliki toko.')
    }
    
    if (args.length < 3) {
        return m.reply(`Gunakan: \`${ prefix + command } ${cmd} [item] [stock] [harga] [deskripsi (opsional)\``)
    }
    
    const itemName = args[0]
    const stock = parseInt(args[1])
    const price = parseInt(args[2])
    const description = args.slice(3).join(' ')
    
    if (!user.playerInventory.items[itemName] || user.playerInventory.items[itemName] < stock) {
        return m.reply(`Kamu tidak memiliki cukup ${itemName}. Kamu hanya memiliki ${user.playerInventory.items[itemName] || 0} ${itemName}`)
    }
    
    user.playerInventory.items[itemName] -= stock
    db.users.update(m.sender, { playerInventory: user.playerInventory })
    
    const catalogItem = ecommerceDB.addCatalogItem(m.sender, {
        name: itemName,
        stock,
        price,
        description,
        category: 'general'
    })
    
    m.reply(`✅ *\`PRODUK DITAMBAHKAN\`*\n\n• ${catalogItem.name}\• Stock: ${catalogItem.stock}\n• Harga: $${catalogItem.currentPrice}\n• Deskripsi: ${catalogItem.description}\• ID: ${catalogItem.id}`)
}

async function buyProduct(m, user, prefix, command, cmd, ecommerceDB, deliveryDB, db, args) {
    if (args.length < 3) {
        return m.reply(`Gunakan: \`${ prefix + command } ${cmd} [shop_id] [item_id] [jumlah]\``)
    }
    
    const shopId = args[0]
    const itemId = args[1]
    const quantity = parseInt(args[2])
    
    const shop = ecommerceDB.getShopById(shopId)
    if (!shop) {
        return m.reply('Toko tidak ditemukan.')
    }
    
    const item = shop.catalog.find(i => i.id === itemId)
    if (!item) {
        return m.reply('Produk tidak ditemukan.')
    }
    
    if (item.stock < quantity) {
        return m.reply(`Stok produk tidak cukup. Produk hanya tersisa ${item.stock} stok`)
    }
    
    const totalPrice = item.currentPrice * quantity
    if (user.playerInventory.items.uang < totalPrice) {
        return m.reply(`Uang tidak cukup. Kamu butuh $${totalPrice}`)
    }
    
    // Proses pembelian
    user.playerInventory.items.uang -= totalPrice
    item.stock -= quantity
    
    // Update statistik toko
    shop.stats.totalSales += totalPrice
    shop.stats.totalOrders += 1
    
    // Buat paket untuk pengiriman
    const userLocation = `${user.playerLocation.city}:${user.playerLocation.country}`
    const packages = deliveryDB.createPackage({
        orderId: `ORD${Date.now()}`,
        shopId: shop.id,
        buyerJid: m.sender,
        sellerJid: shop.ownerJid,
        items: [{ name: item.name, quantity, price: item.currentPrice }],
        totalValue: totalPrice,
        origin: shop.location,
        destination: userLocation
    })
    
    ecommerceDB.writeDB()
    db.users.update(m.sender, { playerInventory: user.playerInventory })
    
    m.reply(`✅ *PEMBELIAN BERHASIL*\n\n• Toko: ${shop.name}\n• ${item.name} x${quantity}\• Total: $${totalPrice}\• Tracking: ${packages.trackingNumber}\• Estimasi: ${packages.estimatedDays} hari\n\nGunakan \`${ prefix + command } track ${packages.trackingNumber}\` untuk melacak paket.`)
}

async function trackPackage(m, prefix, command, cmd, deliveryDB, args) {
    if (!args[0]) {
        return m.reply(`Gunakan: \`${ prefix + command } ${cmd} [tracking_number]\``)
    }
    
    const trackingNumber = args[0]
    const packages = deliveryDB.data.packages.find(pkg => pkg.trackingNumber === trackingNumber)
    
    if (!packages) {
        return m.reply('Nomor tracking tidak ditemukan.')
    }
    
    let trackingText = `📦 *\`TRACKING PAKET\`*\n\n🏷️ ${packages.trackingNumber}\n🚚 ${packages.courierService}\n📍 ${packages.origin} → ${packages.destination}\n⏱️ Estimasi: ${packages.estimatedDays} hari\n\n📋 *Riwayat:*\n`
    
    packages.trackingHistory.forEach(history => {
        trackingText += `\n> ${history.date} ${history.status}`
    })
    
    m.reply(trackingText)
}

async function viewMarketHome(m, prefix, command, ecommerceDB) {
    const topShops = ecommerceDB.getTopShops(5)
    
    let homeText = `🛒 *\`MARKET HOMEPAGE\`*\n\n🏆 *Toko Terpopuler:*\n`
    
    topShops.forEach((shop, index) => {
        homeText += `\n${index + 1}. 🏪 ${shop.name}\n   📦 ${shop.category} | ⭐ ${shop.stats.rating}/5\n   🆔 ${shop.id}`
    })
    
    homeText += `\n\n💡 *Tips:*\n• Gunakan: \`${ prefix + command } search [nama]\` untuk mencari toko\n• Gunakan: \`${ prefix + command } buy [shop_id] [item_id] [qty]\` untuk membeli`
    
    m.reply(homeText)
}

async function viewCatalog(m, ecommerceDB) {
    const shop = ecommerceDB.getShop(m.sender)
    if (!shop) {
        return m.reply('Kamu belum memiliki toko.')
    }
    
    if (shop.catalog.length === 0) {
        return m.reply('Katalog toko masih kosong.')
    }
    
    let catalogText = `📦 *\`KATALOG TOKO ${shop.name.toUpperCase()}\`*\n\n`
    
    shop.catalog.forEach((item, index) => {
        const discountText = item.discount > 0 ? `🔥 DISKON ${item.discount}%` : ''
        const originalPriceText = item.discount > 0 ? `~$${item.originalPrice}~ ` : ''
        
        catalogText += `${index + 1}. 📦 *${item.name}*\n`
        catalogText += `   💰 ${originalPriceText}$${item.currentPrice} ${discountText}\n`
        catalogText += `   📦 Stok: ${item.stock}\n`
        catalogText += `   🆔 ${item.id}\n`
        if (item.description) catalogText += `   📝 ${item.description}\n`
        catalogText += `\n`
    })
    
    m.reply(catalogText)
}

async function searchShops(m, ecommerceDB, args) {
    if (args.length === 0) {
        return m.reply('Masukkan kata kunci pencarian atau kategori.')
    }
    
    const query = args.join(' ').toLowerCase()
    const validCategories = ['electronics', 'fashion', 'food', 'health', 'books', 'sports', 'home', 'automotive', 'beauty', 'toys']
    
    let shops
    if (validCategories.includes(query)) {
        shops = ecommerceDB.searchShops(null, query)
    } else {
        shops = ecommerceDB.searchShops(query)
    }
    
    if (shops.length === 0) {
        return m.reply('Tidak ada toko yang ditemukan.')
    }
    
    let searchText = `🔍 *\`HASIL PENCARIAN: "${query.toUpperCase()}"\`*\n\n`
    
    shops.slice(0, 10).forEach((shop, index) => {
        const badges = shop.stats.badges.length > 0 ? ` ${shop.stats.badges.join(' ')}` : ''
        searchText += `${index + 1}. 🏪 *${shop.name}*${badges}\n`
        searchText += `   📦 ${shop.category} | ⭐ ${shop.stats.rating}/5 (${shop.stats.reviewCount})\n`
        searchText += `   📍 ${shop.location} | 📦 ${shop.catalog.length} produk\n`
        searchText += `   🆔 ${shop.id}\n\n`
    })
    
    m.reply(searchText)
}

async function viewOrders(m, ecommerceDB, deliveryDB) {
    const shop = ecommerceDB.getShop(m.sender)
    if (!shop) {
        return m.reply('Kamu belum memiliki toko.')
    }
    
    const packages = deliveryDB.getPackagesBySeller(m.sender)
    
    if (packages.length === 0) {
        return m.reply('Belum ada pesanan.')
    }
    
    let ordersText = `📋 *\`PESANAN TOKO ${shop.name.toUpperCase()}\`*\n\n`
    
    packages.slice(0, 10).forEach((pkg, index) => {
        ordersText += `${index + 1}. 📦 ${pkg.trackingNumber}\n`
        ordersText += `   💰 $${pkg.totalValue} | ${pkg.items.length} item\n`
        ordersText += `   📍 ${pkg.destination}\n`
        ordersText += `   📊 ${pkg.status}\n\n`
    })
    
    m.reply(ordersText)
}

async function viewMyOrders(m, deliveryDB) {
    const packages = deliveryDB.getPackagesByBuyer(m.sender)
    
    if (packages.length === 0) {
        return m.reply('Kamu belum pernah berbelanja.')
    }
    
    let ordersText = `🛒 *\`PESANAN SAYA\`*\n\n`
    
    packages.slice(0, 10).forEach((pkg, index) => {
        ordersText += `${index + 1}. 📦 ${pkg.trackingNumber}\n`
        ordersText += `   💰 $${pkg.totalValue} | ${pkg.courierService}\n`
        ordersText += `   📊 ${pkg.status}\n`
        ordersText += `   ⏱️ Estimasi: ${pkg.estimatedDays} hari\n\n`
    })
    
    m.reply(ordersText)
}

async function setDiscount(m, prefix, command, cmd, ecommerceDB, args) {
    const shop = ecommerceDB.getShop(m.sender)
    if (!shop) {
        return m.reply('Kamu belum memiliki toko.')
    }
    
    if (args.length < 2) {
        return m.reply(`Gunakan: \`${ prefix + command } ${cmd} [item_id] [harga_diskon]\``)
    }
    
    const itemId = args[0]
    const discountPrice = parseInt(args[1])
    
    const item = shop.catalog.find(i => i.id === itemId)
    if (!item) {
        return m.reply('Produk tidak ditemukan.')
    }
    
    if (discountPrice >= item.originalPrice) {
        return m.reply('Harga diskon harus lebih kecil dari harga asli.')
    }
    
    const discountPercent = Math.round(((item.originalPrice - discountPrice) / item.originalPrice) * 100)
    
    item.currentPrice = discountPrice
    item.discount = discountPercent
    
    ecommerceDB.writeDB()
    
    m.reply(`✅ *\`DISKON DITERAPKAN\`*\n\n• Nama Produk: 📦 ${item.name}\n• Harga Asli: $${item.originalPrice}\n• Harga Diskon: $${discountPrice}\n• Diskon: ${discountPercent}%`)
}

async function becomeDelivery(m, user, prefix, command, deliveryDB) {
    const existingCourier = deliveryDB.data.couriers.find(c => c.jid === m.sender)
    if (existingCourier) {
        return m.reply(`👨🏼‍💼 *\`KURIR PAKET\`*.\n\n• ${user.playerInfo.namaLengkap}\n• Area: ${user.playerLocation.city}, ${user.playerLocation.country}\n• Rating: ${existingCourier.rating}/5\n• Paket Diantar: ${existingCourier.deliveredPackages}`)
    }
    
    const courier = {
        jid: m.sender,
        name: user.playerInfo.namaLengkap,
        location: `${user.playerLocation.city}:${user.playerLocation.country}`,
        rating: 5.0,
        deliveredPackages: 0,
        earnings: 0,
        isActive: true,
        joinedAt: Date.now()
    }
    
    deliveryDB.data.couriers.push(courier)
    deliveryDB.writeDB()
    
    m.reply(`✅ *\`NEW COURIER\`*\n\n• ${user.playerInfo.namaLengkap}\• Area Kerja: ${user.playerLocation.city}, ${user.playerLocation.country}\n\nGunakan \`${ prefix + command } pickups\` untuk melihat paket yang tersedia.`)
}

async function rateShopOrCourier(m, prefix, command, cmd, ecommerceDB, deliveryDB, args) {
    if (args.length < 3) {
        return m.reply(`Gunakan: \`${ prefix + command } ${cmd} [tracking_number] [shop/kurir] [rating 1-5] [review(opsional)]\``)
    }
    
    const trackingNumber = args[0]
    const type = args[1].toLowerCase()
    const rating = parseInt(args[2])
    const review = args.slice(3).join(' ')
    
    if (rating < 1 || rating > 5) {
        return m.reply('Rating harus antara 1-5.')
    }
    
    const pkg = deliveryDB.data.packages.find(p => p.trackingNumber === trackingNumber)
    if (!pkg) {
        return m.reply('Nomor tracking tidak ditemukan.')
    }
    
    if (pkg.buyerJid !== m.sender) {
        return m.reply('Ini bukan pesanan kamu.')
    }
    
    if (pkg.status !== 'DELIVERED') {
        return m.reply('Paket belum diterima.')
    }
    
    if (type === 'shop') {
        const shop = ecommerceDB.getShopById(pkg.shopId)
        if (!shop) return m.reply('Toko tidak ditemukan.')
        
        // Update rating toko
        const totalRating = (shop.stats.rating * shop.stats.reviewCount) + rating
        shop.stats.reviewCount += 1
        shop.stats.rating = Math.round((totalRating / shop.stats.reviewCount) * 10) / 10
        
        // Add badges based on performance
        if (shop.stats.rating >= 4.8 && shop.stats.reviewCount >= 50 && !shop.stats.badges.includes('⭐')) {
            shop.stats.badges.push('⭐')
        }
        if (shop.stats.totalSales >= 10000 && !shop.stats.badges.includes('💎')) {
            shop.stats.badges.push('💎')
        }
        
        ecommerceDB.writeDB()
        m.reply(`✅ *\`RATING TOKO DIBERIKAN\`*.\n\n• Rating: ${rating}/5\n• Review: ${review || 'Tidak ada review'}`)
        
    } else if (type === 'kurir') {
        const courier = deliveryDB.data.couriers.find(c => c.jid === pkg.courierJid)
        if (!courier) return m.reply('Kurir tidak ditemukan.')
        
        courier.rating = Math.round(((courier.rating * courier.deliveredPackages) + rating) / (courier.deliveredPackages + 1) * 10) / 10
        
        deliveryDB.writeDB()
        m.reply(`✅ *\`RATING KURIR DIBERIKAN\`*\n\• Rating: ${rating}/5\n• Review: ${review || 'Tidak ada review'}`)
    } else {
        return m.reply('Tipe harus "shop" atau "kurir".')
    }
}

async function viewPickups(m, prefix, command, deliveryDB) {
    const courier = deliveryDB.data.couriers.find(c => c.jid === m.sender)
    if (!courier) {
        return m.reply('Kamu belum terdaftar sebagai kurir.')
    }
    
    const availablePickups = deliveryDB.getAvailablePickups(courier.location)
    
    if (availablePickups.length === 0) {
        return m.reply('Tidak ada paket yang tersedia untuk diambil di area kamu.')
    }
    
    let pickupsText = `📦 *\`PAKET TERSEDIA - ${courier.location}\`*\n\n`
    
    availablePickups.slice(0, 10).forEach((pkg, index) => {
        pickupsText += `${index + 1}. 🏷️ ${pkg.trackingNumber}\n`
        pickupsText += `   💰 $${pkg.totalValue} | ${pkg.courierService}\n`
        pickupsText += `   📍 ${pkg.destination}\n`
        pickupsText += `   ⏱️ Estimasi: ${pkg.estimatedDays} hari\n\n`
    })
    
    pickupsText += `Gunakan: \`${ prefix + command } deliver [tracking_number]\` untuk mengambil paket.`
    
    m.reply(pickupsText)
}

async function deliverPackage(m, prefix, command, cmd, deliveryDB, args) {
    if (!args[0]) {
        return m.reply(`Gunakan: \`${ prefix + command } ${cmd} [tracking_number]\``)
    }
    
    const trackingNumber = args[0]
    const courier = deliveryDB.data.couriers.find(c => c.jid === m.sender)
    
    if (!courier) {
        return m.reply('Kamu belum terdaftar sebagai kurir.')
    }
    
    const pkg = deliveryDB.data.packages.find(p => p.trackingNumber === trackingNumber)
    if (!pkg) {
        return m.reply('Nomor tracking tidak ditemukan.')
    }
    
    if (pkg.status === 'PENDING') {
        // ambil paket
        deliveryDB.assignCourier(trackingNumber, m.sender)
        
        // proses pengiriman
        setTimeout(() => {
            deliveryDB.addTrackingHistory(trackingNumber, `PAKET TELAH SAMPAI DI SORTING CENTER ${pkg.destination.split(':')[0]}`, 'SORTING_CENTER')
        }, 2000)
        
        setTimeout(() => {
            deliveryDB.addTrackingHistory(trackingNumber, 'PAKET SEDANG DISORTIR', 'SORTING_CENTER')
        }, 4000)
        
        setTimeout(() => {
            deliveryDB.addTrackingHistory(trackingNumber, 'PAKET TELAH DISORTIR', 'SORTING_CENTER')
        }, 6000)
        
        setTimeout(() => {
            deliveryDB.addTrackingHistory(trackingNumber, `PAKET SEDANG DIANTAR KE ${pkg.destination} VIA JALUR DARAT DENGAN ESTIMASI ${pkg.estimatedDays} HARI`, 'IN_TRANSIT')
        }, 8000)
        
        setTimeout(() => {
            pkg.status = 'READY_FOR_DELIVERY'
            deliveryDB.addTrackingHistory(trackingNumber, 'PAKET SIAP DIANTAR KE PENERIMA', 'OUT_FOR_DELIVERY')
            deliveryDB.writeDB()
        }, 10000)
        
        m.reply(`✅ *\`PAKET ${trackingNumber} BERHASIL DIAMBIL\`*\n\• Tujuan: ${pkg.destination}\• Nilai: $${pkg.totalValue}\• Estimasi: ${pkg.estimatedDays} hari`)
        
    } else if (pkg.status === 'READY_FOR_DELIVERY' && pkg.courierJid === m.sender) {
        // antar paket
        pkg.status = 'DELIVERED'
        deliveryDB.addTrackingHistory(trackingNumber, `PAKET TELAH DITERIMA OLEH PENERIMA`, 'DELIVERED')
        
        // update stats kurir
        courier.deliveredPackages += 1
        courier.earnings += Math.floor(pkg.totalValue * 0.1) // 10% komisi
        
        deliveryDB.writeDB()
        
        const commission = Math.floor(pkg.totalValue * 0.1)
        m.reply(`✅ *\`PAKET ${trackingNumber} BERHASIL DIANTAR\`*\n\n• Komisi: $${commission}\n• Total Paket Diantar: ${courier.deliveredPackages}`)
        
    } else {
        return m.reply('Paket tidak bisa diproses atau bukan tanggung jawab kamu.')
    }
}