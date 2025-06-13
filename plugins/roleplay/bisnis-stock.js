import { factionGovData, factionNewsData, saveFactionUsers } from '../../lib/databases/faction.js'
import { pajak } from '../../setting.js'
import { saveData, getCurrentDateTime, formatDate } from '../../lib/src/function.js'
import {
    GLOBAL_MARKETS,
    initStockData,
    getMarketStatus,
    updateStockPrices,
    formatCurrency,
    stockJsonPath
} from '../../lib/databases/stock-market.js'
import {
    initBusinessData,
    initPriceData,
    businessCertificate,
    openProductBox,
    calculateBusinessValue,
    generateBusinessReport
} from '../../lib/databases/business.js'

export const cmd = {
    name: ['biz', 'stock'],
    command: ['biz', 'stock'],
    category: ['roleplay'],
    detail: {
        desc: 'Manajemen Bisnis & Stock Market'
    },
    setting: {
        isRegister: true,
        isBanned: false,
        isJail: false
    },
    async start({ m, db, prefix, command, conn, args }) {
        const bizData = initBusinessData()
        const priceData = initPriceData()
        const stockData = updateStockPrices(initStockData())
        const sender = m.sender
        const dateTime = getCurrentDateTime()
        
        const subCommand = args[0]?.toLowerCase() || ''
        const cmdArgs = args[1]?.toLowerCase() || ''
        const target = cmdArgs[0] ? cmdArgs[0].replace(/[@ .+-]/g, '') + '@s.whatsapp.net' : ''
        let caption = ''

        const userData = db.users.get(sender)
        const dutyMembers = factionGovData.Government.filter(member => member.duty === true)

        if (!stockData.players[sender]) {
            stockData.players[sender] = {
                portfolio: {},
                totalInvested: 0,
                totalReturn: 0,
                transactions: []
            }
        }

        if (command === 'stock') {
            switch (subCommand) {
                case '':
                case 'help': {
                    caption = `📈 *\`DAFTAR PERINTAH (BETA)\`*\n\n`

                    caption += `*Contoh:* \`${prefix + command} prices lse\`\n`
                    caption += `*Prefix:* \`${prefix}\`\n\n`

                    caption += `*Market Info:*\n`
                    caption += `• \`${command} market\` - Lihat semua market global\n`
                    caption += `• \`${command} prices\` - Lihat harga saham di market\n`
                    caption += `• \`${command} info\` - Info detail saham\n`
                    caption += `• \`${command} events\` - Lihat event market terbaru\n\n`

                    caption += `*Trading:*\n`
                    caption += `• \`${command} buy\` - Beli saham\n`
                    caption += `• \`${command} sell\` - Jual saham\n`
                    caption += `• \`${command} portfolio\` - Lihat portfolio kamu\n`
                    caption += `• \`${command} history\` - Riwayat transaksi\n\n`

                    caption += `*Analysis:*\n`
                    caption += `• \`${command} chart\` - Chart harga\n`
                    caption += `• \`${command} sectors\` - Analisis sektor\n`
                    caption += `• \`${command} top\` - Top gainers/losers`
                    break
                }

                case 'market': {
                    caption = `🌍 *\`GLOBAL STOCK MARKET\`*\n\n`

                    Object.entries(GLOBAL_MARKETS).forEach(([code, market]) => {
                        const status = getMarketStatus(code)
                        const statusEmoji = {
                            'open': '🟢',
                            'premarket': '🟡',
                            'afterhours': '🟠',
                            'closed': '🔴'
                        }

                        caption += `${statusEmoji[status]} *${market.name}*\n`
                        caption += `   • ${market.city} | ⟳ ${market.currency} | Status: ${status.toUpperCase()}\n\n`
                    })
                    break
                }

                case 'prices': {
                    const marketCode = args[1]?.toUpperCase()
                    if (!marketCode || !GLOBAL_MARKETS[marketCode]) {
                        caption = `Gunakan: \`${ prefix + command } ${subCommand} [market]\`\n\n*Available market:*\n${Object.keys(GLOBAL_MARKETS).join(', ')}`
                        break
                    }

                    const market = stockData.markets[marketCode]
                    caption = `📊 *\`${market.name.toUpperCase()}\`*\n`
                    caption += `Status: ${market.status.toUpperCase()} | Currency: ${market.currency}\n\n`

                    const stocks = Object.entries(market.stocks).slice(0, 10)
                    stocks.forEach(([symbol, stock]) => {
                        const changeIcon = stock.change >= 0 ? '📈' : '📉'
                        const changeColor = stock.change >= 0 ? '+' : ''

                        caption += `${changeIcon} *${symbol}* - ${stock.name}\n`
                        caption += `   Price: ${formatCurrency(stock.price, market.currency)}\n`
                        caption += `   Change: ${changeColor}${stock.changePercent.toFixed(2)}%\n`
                        caption += `   Volume: ${stock.volume.toLocaleString()}\n\n`
                    })
                    break
                }

                case 'info': {
                    const marketCode = args[1]?.toUpperCase()
                    const symbol = args[2]?.toUpperCase()

                    if (!marketCode || !symbol || !stockData.markets[marketCode]?.stocks[symbol]) {
                        caption = `Gunakan: \`${ prefix + command } ${subCommand} [market] [symbol]\``
                        break
                    }

                    const market = stockData.markets[marketCode]
                    const stock = market.stocks[symbol]

                    caption = `📋 *\`${stock.name} (${symbol})\`*\n\n`
                    caption += `• Market: ${market.name}\n`
                    caption += `• Sector: ${stock.sector}\n`
                    caption += `• Current Price: ${formatCurrency(stock.price, market.currency)}\n`
                    caption += `• Change: ${stock.change >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%\n`
                    caption += `• Volume: ${stock.volume.toLocaleString()}\n`
                    caption += `• Market Cap: ${formatCurrency(stock.marketCap, market.currency)}\n`
                    caption += `• Dividend Yield: ${stock.dividendYield.toFixed(2)}%\n`
                    caption += `• P/E Ratio: ${stock.peRatio.toFixed(2)}\n`
                    caption += `• Volatility: ${(stock.volatility * 100).toFixed(1)}%`
                    break
                }

                case 'buy': {
                    const marketCode = args[1]?.toUpperCase()
                    const symbol = args[2]?.toUpperCase()
                    const shares = parseInt(args[3])

                    if (!marketCode || !symbol || !shares || shares <= 0) {
                        caption = `Gunakan: \`${ prefix + command } ${subCommand} [market] [symbol] [shares]\``
                        break
                    }

                    const market = stockData.markets[marketCode]
                    const stock = market?.stocks[symbol]

                    if (!stock) {
                        caption = `Saham ${symbol} tidak ditemukan di market ${marketCode}`
                        break
                    }

                    if (market.status === 'closed') {
                        caption = `Market ${marketCode} sedang tutup. Trading hanya bisa dilakukan saat market buka.`
                        break
                    }

                    const totalCost = stock.price * shares
                    const playerBalance = userData.playerInventory?.items?.uang || 0

                    if (playerBalance < totalCost) {
                        caption = `Saldo tidak cukup. Kamu butuh ${formatCurrency(totalCost, market.currency)}`
                        break
                    }

                    const player = stockData.players[sender]
                    if (!player.portfolio[symbol]) {
                        player.portfolio[symbol] = {
                            shares: 0,
                            totalInvested: 0,
                            avgPrice: 0
                        }
                    }

                    const position = player.portfolio[symbol]
                    const newTotalInvested = position.totalInvested + totalCost
                    const newTotalShares = position.shares + shares

                    position.shares = newTotalShares
                    position.totalInvested = newTotalInvested
                    position.avgPrice = newTotalInvested / newTotalShares

                    // Record transaction
                    player.transactions.push({
                        type: 'buy',
                        market: marketCode,
                        symbol: symbol,
                        shares: shares,
                        price: stock.price,
                        total: totalCost,
                        timestamp: Date.now()
                    })

                    db.users.update(sender, {
                        playerInventory: {
                            items: { uang: playerBalance - totalCost }
                        }
                    })

                    // Update stock volume and price influence
                    stock.volume += shares

                    caption = `✅ *\`PEMBELIAN BERHASIL\`*\n\n`
                    caption += `• Market: ${market.name}\n`
                    caption += `• Saham: ${stock.name} (${symbol})\n`
                    caption += `• Shares: ${shares}\n`
                    caption += `• Harga: ${formatCurrency(stock.price, market.currency)}\n`
                    caption += `• Total: ${formatCurrency(totalCost, market.currency)}\n`
                    caption += `• Sisa Saldo: ${formatCurrency(playerBalance - totalCost, market.currency)}`
                    break
                }

                case 'sell': {
                    const marketCode = args[1]?.toUpperCase()
                    const symbol = args[2]?.toUpperCase()
                    const shares = parseInt(args[3])

                    if (!marketCode || !symbol || !shares || shares <= 0) {
                        caption = `Gunakan: \`${ prefix + command } ${subCommand} [market] [symbol] [shares]\``
                        break
                    }

                    const market = stockData.markets[marketCode]
                    const stock = market?.stocks[symbol]

                    if (!stock) {
                        caption = `Saham ${symbol} tidak ditemukan di market ${marketCode}`
                        break
                    }

                    if (market.status === 'closed') {
                        caption = `Market ${marketCode} sedang tutup. Trading hanya bisa dilakukan saat market buka.`
                        break
                    }

                    const player = stockData.players[sender]
                    const position = player.portfolio[symbol]

                    if (!position || position.shares < shares) {
                        caption = `Shares tidak cukup. Kamu memiliki ${position?.shares || 0} shares`
                        break
                    }

                    const totalValue = stock.price * shares
                    const costBasis = (position.totalInvested / position.shares) * shares
                    const profit = totalValue - costBasis

                    // Update position
                    position.shares -= shares
                    position.totalInvested -= costBasis

                    if (position.shares === 0) {
                        delete player.portfolio[symbol]
                    } else {
                        position.avgPrice = position.totalInvested / position.shares
                    }

                    // Record transaction
                    player.transactions.push({
                        type: 'sell',
                        market: marketCode,
                        symbol: symbol,
                        shares: shares,
                        price: stock.price,
                        total: totalValue,
                        profit: profit,
                        timestamp: Date.now()
                    })

                    // Update player balance
                    const currentBalance = userData.playerInventory?.items?.uang || 0
                    db.users.update(sender, {
                        playerInventory: {
                            items: { uang: currentBalance + totalValue }
                        }
                    })

                    // Update stock volume
                    stock.volume += shares

                    const profitIcon = profit >= 0 ? '📈' : '📉'
                    const profitColor = profit >= 0 ? '+' : ''

                    caption = `✅ *\`PENJUALAN BERHASIL\`*\n\n`
                    caption += `• Market: ${market.name}\n`
                    caption += `• Saham: ${stock.name} (${symbol})\n`
                    caption += `• Shares: ${shares}\n`
                    caption += `• Harga: ${formatCurrency(stock.price, market.currency)}\n`
                    caption += `• Total: ${formatCurrency(totalValue, market.currency)}\n`
                    caption += `• Profit/Loss: ${profitIcon} | ${profitColor}${formatCurrency(profit, market.currency)}\n`
                    caption += `• Saldo Baru: ${formatCurrency(currentBalance + totalValue, market.currency)}`
                    break
                }

                case 'portfolio': {
                    const player = stockData.players[sender]
                    const portfolio = player.portfolio

                    if (Object.keys(portfolio).length === 0) {
                        caption = `Kamu belum memiliki saham apapun.`
                        break
                    }

                    caption = `📊 *\`PORTFOLIO SAHAM\`*\n\n`

                    let totalValue = 0
                    let totalInvested = 0

                    Object.entries(portfolio).forEach(([symbol, position]) => {
                        // Find current stock price
                        let currentPrice = 0
                        let marketCurrency = 'USD'

                        Object.entries(stockData.markets).forEach(([marketCode, market]) => {
                            if (market.stocks[symbol]) {
                                currentPrice = market.stocks[symbol].price
                                marketCurrency = market.currency
                            }
                        })

                        const currentValue = currentPrice * position.shares
                        const profit = currentValue - position.totalInvested
                        const profitPercent = (profit / position.totalInvested) * 100

                        totalValue += currentValue
                        totalInvested += position.totalInvested

                        const profitIcon = profit >= 0 ? '📈' : '📉'
                        const profitColor = profit >= 0 ? '+' : ''

                        caption += `${profitIcon} *${symbol}*\n`
                        caption += `   Shares: ${position.shares}\n`
                        caption += `   Avg Price: ${formatCurrency(position.avgPrice, marketCurrency)}\n`
                        caption += `   Current: ${formatCurrency(currentPrice, marketCurrency)}\n`
                        caption += `   Value: ${formatCurrency(currentValue, marketCurrency)}\n`
                        caption += `   P/L: ${profitColor}${formatCurrency(profit, marketCurrency)} (${profitColor}${profitPercent.toFixed(2)}%)\n\n`
                    })

                    const totalProfit = totalValue - totalInvested
                    const totalProfitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0
                    const totalIcon = totalProfit >= 0 ? '📈' : '📉'
                    const totalColor = totalProfit >= 0 ? '+' : ''

                    caption += `${totalIcon} *TOTAL PORTFOLIO*\n`
                    caption += `Invested: ${formatCurrency(totalInvested)}\n`
                    caption += `Current Value: ${formatCurrency(totalValue)}\n`
                    caption += `Total P/L: ${totalColor}${formatCurrency(totalProfit)} (${totalColor}${totalProfitPercent.toFixed(2)}%)`
                    break
                }

                case 'history': {
                    const player = stockData.players[sender]
                    const transactions = player.transactions.slice(-10).reverse()

                    if (transactions.length === 0) {
                        caption = `Belum ada transaksi yang dilakukan.`
                        break
                    }

                    caption = `📜 *\`RIWAYAT TRANSAKSI\`*\n\n`

                    transactions.forEach((tx, index) => {
                        const date = new Date(tx.timestamp).toLocaleDateString('id-ID')
                        const time = new Date(tx.timestamp).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                        const typeIcon = tx.type === 'buy' ? '🟢' : '🔴'

                        caption += `${typeIcon} *${tx.type.toUpperCase()}* ${tx.symbol}\n`
                        caption += `   Market: ${tx.market}\n`
                        caption += `   Shares: ${tx.shares}\n`
                        caption += `   Price: ${formatCurrency(tx.price)}\n`
                        caption += `   Total: ${formatCurrency(tx.total)}\n`
                        if (tx.profit !== undefined) {
                            const profitColor = tx.profit >= 0 ? '+' : ''
                            caption += `   Profit: ${profitColor}${formatCurrency(tx.profit)}\n`
                        }
                        caption += `   Date: ${date} ${time}\n\n`
                    })
                    break
                }

                case 'events': {
                    const globalEvents = stockData.globalEvents.slice(-5).reverse()

                    caption = `📰 *\`MARKET EVENT\`*\n\n`

                    if (globalEvents.length === 0) {
                        caption += `Belum ada event market terbaru.`
                        break
                    }

                    globalEvents.forEach((event, index) => {
                        const date = new Date(event.timestamp).toLocaleDateString('id-ID')
                        const time = new Date(event.timestamp).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                        const impactIcon = event.impact >= 0 ? '📈' : '📉'
                        const impactColor = event.impact >= 0 ? '+' : ''

                        caption += `${impactIcon} *${event.type.toUpperCase()}*\n`
                        caption += `${event.description}\n`
                        caption += `Impact: ${impactColor}${(event.impact * 100).toFixed(1)}%\n`
                        caption += `Affected: ${event.affectedSectors.join(', ')}\n`
                        caption += `Time: ${date} ${time}\n\n`
                    })
                    break
                }

                case 'top': {
                    const marketCode = args[1]?.toUpperCase()
                    if (!marketCode || !GLOBAL_MARKETS[marketCode]) {
                        caption = `Gunakan: \`${ prefix + command } ${subCommand} [market]\`\n\n*Available market:*\n${Object.keys(GLOBAL_MARKETS).join(', ')}`
                        break
                    }

                    const market = stockData.markets[marketCode]
                    const stocks = Object.entries(market.stocks)

                    const gainers = stocks.sort((a, b) => b[1].changePercent - a[1].changePercent).slice(0, 5)
                    const losers = stocks.sort((a, b) => a[1].changePercent - b[1].changePercent).slice(0, 5)

                    caption = `🏆 *\`TOP MOVERS\`* - ${market.name}\n\n`

                    caption += `📈 *\`TOP GAINERS\`*\n`
                    gainers.forEach(([symbol, stock], index) => {
                        caption += `${index + 1}. ${symbol} - ${stock.name}\n`
                        caption += `   +${stock.changePercent.toFixed(2)}% (${formatCurrency(stock.price, market.currency)})\n\n`
                    })

                    caption += `📉 *\`TOP LOSERS\`*\n`
                    losers.forEach(([symbol, stock], index) => {
                        caption += `${index + 1}. ${symbol} - ${stock.name}\n`
                        caption += `   ${stock.changePercent.toFixed(2)}% (${formatCurrency(stock.price, market.currency)})\n\n`
                    })
                    break
                }

                case 'sectors': {
                    const marketCode = args[1]?.toUpperCase()
                    if (!marketCode || !GLOBAL_MARKETS[marketCode]) {
                        caption = `Gunakan: \`${ prefix + command } ${subCommand} [market]\`\n\n*Available market:*\n${Object.keys(GLOBAL_MARKETS).join(', ')}`
                        break
                    }

                    const market = stockData.markets[marketCode]
                    const sectorPerformance = {}

                    Object.values(market.stocks).forEach(stock => {
                        if (!sectorPerformance[stock.sector]) {
                            sectorPerformance[stock.sector] = {
                                totalChange: 0,
                                count: 0,
                                totalVolume: 0
                            }
                        }

                        sectorPerformance[stock.sector].totalChange += stock.changePercent
                        sectorPerformance[stock.sector].count += 1
                        sectorPerformance[stock.sector].totalVolume += stock.volume
                    })

                    Object.keys(sectorPerformance).forEach(sector => {
                        const data = sectorPerformance[sector]
                        data.avgChange = data.totalChange / data.count
                    })

                    const sortedSectors = Object.entries(sectorPerformance)
                        .sort((a, b) => b[1].avgChange - a[1].avgChange)

                    caption = `🏭 *\`SECTOR ANALYSIS - ${market.name}\`*\n\n`

                    sortedSectors.forEach(([sector, data]) => {
                        const icon = data.avgChange >= 0 ? '📈' : '📉'
                        const color = data.avgChange >= 0 ? '+' : ''

                        caption += `${icon} *${sector}*\n`
                        caption += `   Avg Change: ${color}${data.avgChange.toFixed(2)}%\n`
                        caption += `   Companies: ${data.count}\n`
                        caption += `   Volume: ${data.totalVolume.toLocaleString()}\n\n`
                    })
                    break
                }

                case 'chart': {
                    const marketCode = args[1]?.toUpperCase()
                    const symbol = args[2]?.toUpperCase()

                    if (!marketCode || !symbol || !stockData.markets[marketCode]?.stocks[symbol]) {
                        caption = `Gunakan: \`${ prefix + command } ${subCommand} [market] [symbol]\``
                        break
                    }

                    const market = stockData.markets[marketCode]
                    const stock = market.stocks[symbol]
                    const history = stock.history.slice(-20)

                    caption = `📊 *\`PRICE CHART - ${stock.name} (${symbol})\`*\n\n`

                    const prices = history.map(h => h.price)
                    const minPrice = Math.min(...prices)
                    const maxPrice = Math.max(...prices)
                    const priceRange = maxPrice - minPrice

                    caption += `High: ${formatCurrency(maxPrice, market.currency)}\n`
                    caption += `Low: ${formatCurrency(minPrice, market.currency)}\n`
                    caption += `Current: ${formatCurrency(stock.price, market.currency)}\n\n`

                    history.forEach((data, index) => {
                        const relativePosition = priceRange > 0 ? (data.price - minPrice) / priceRange : 0.5
                        const barLength = Math.round(relativePosition * 20)
                        const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength)

                        const time = new Date(data.timestamp).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                        caption += `${time} |${bar}| ${formatCurrency(data.price, market.currency)}\n`
                    })
                    break
                }

                default:
                    caption = `Perintah tidak dikenal. Gunakan ${ prefix + command } help untuk melihat daftar perintah.`
            }

            saveData(stockData, stockJsonPath)
            db.save()

        } else {
            switch (subCommand) {
                case '':
                case 'help': {
                    caption = `🏢 *\`DAFTAR PERINTAH\`*\n\n`

                    caption += `*Contoh:* \`${prefix + command} create ominous clothes\`\n`
                    caption += `*Prefix:* \`${prefix}\`\n\n`

                    caption += `*General Command:*\n`
                    caption += `• \`${command} create\` - Buat bisnis baru\n`
                    caption += `• \`${command} info\` - Lihat info bisnis kamu\n`
                    caption += `• \`${command} list\` - Lihat daftar bisnis yang tersedia\n`
                    caption += `• \`${command} history\` - Menampilkan riwayat transaksi pembelian\n`
                    caption += `• \`${command} products\` - Lihat daftar produk yang bisa dijual\n\n`

                    caption += `*Business Management:*\n`
                    caption += `• \`${command} stock\` - Lihat stok produk kamu\n`
                    caption += `• \`${command} restock\` - Restock produk\n`
                    caption += `• \`${command} delivery\` - Pesan layanan restock\n`
                    caption += `• \`${command} setprice\` - Atur harga produk\n`
                    caption += `• \`${command} report\` - Laporan bisnis\n`
                    caption += `• \`${command} renew-license\` - Perpanjang lisensi bisnis\n`
                    caption += `• \`${command} upgrade\` - Upgrade kapasitas storage\n`
                    caption += `• \`${command} sell\` - Jual bisnis kamu\n\n`

                    caption += `*Buy & Sell:*\n`
                    caption += `• \`${command} buy\` - Beli produk dari bisnis\n`
                    caption += `• \`${command} openbox\` - Buka box produk\n\n`

                    caption += `*Semua Tipe Bisnis:*\n`
                    caption += `• Clothes - Toko pakaian\n`
                    caption += `• Market - Toko kebutuhan sehari-hari\n`
                    caption += `• Electronic - Toko elektronik\n`
                    caption += `• Fastfood - Restoran cepat saji`

                    break
                }
                case 'create': {
                    if (bizData.businesses[sender]) {
                        caption = 'Kamu sudah memiliki bisnis.'
                        break
                    }

                    const price = 5000
                    const costPajak = price + (pajak * price)

                    if (userData.playerInventory.items.uang < costPajak) {
                        caption = `Uang kamu tidak cukup untuk membuat bisnis baru. Kamu butuh $${costPajak}`
                        break
                    }

                    const allArgs = args.slice(1).join(' ').split(' ')

                    if (allArgs.length < 2) {
                        caption = `Gunakan: \`${ prefix + command } ${subCommand} [nama] [tipe]\``
                        break
                    }

                    const businessType = allArgs[allArgs.length - 1]
                    const businessName = allArgs.slice(0, -1).join(' ')
                    const validTypes = ['Clothes', 'Market', 'Electronic', 'Fastfood']
                    const normalizedType = businessType.charAt(0).toUpperCase() + businessType.slice(1).toLowerCase()

                    if (!validTypes.includes(normalizedType)) {
                        caption = `Tipe bisnis tidak valid. Pilih: ${validTypes.join(', ')}`
                        break
                    }

                    const newBusiness = {
                        id: Date.now().toString(),
                        name: businessName,
                        type: normalizedType,
                        owner: sender,
                        established: Date.now(),
                        reputation: 0,
                        sealed: false,
                        customers: 0,
                        capital: 0,
                        income: 0,
                        products: {},
                        prices: {},
                        storage: {
                            capacity: 50,
                            used: 0
                        },
                        transactions: []
                    }

                    bizData.market.products[normalizedType].forEach(product => {
                        newBusiness.products[product] = 0
                        newBusiness.prices[product] = priceData.basePrice[product] || 100
                    })

                    bizData.businesses[sender] = newBusiness
                    saveData(bizData, businessJsonPath)

                    const certificateUrl = await businessCertificate(newBusiness, userData.PlayerInfo.namaLengkap)
                    const currentDate = new Date()
                    const newJob = [...userData.playerStatus.pekerjaan, 'Businessman']

                    if (!factionGovData.Storage) {
                        factionGovData.Storage = {
                            balance: 0,
                            transactions: []
                        }
                    }

                    factionGovData.Storage.transactions.push({
                        type: 'new_business_and_license',
                        amount: price * pajak,
                        by: userData.PlayerInfo.namaLengkap,
                        role: 'Businessman',
                        date: `${dateTime.date} ${dateTime.time}`,
                        timestamp: dateTime.timestamp
                    })

                    factionGovData.Storage.balance += price * pajak

                    userData.playerInventory.items.uang -= costPajak

                    userData.playerStatus.pekerjaan = newJob
                    userData.playerInventory.sertifikatDanDokumen.lisensiBisnis.imageUrl = certificateUrl
                    userData.playerInventory.sertifikatDanDokumen.lisensiBisnis.expiryDate = new Date(currentDate.getTime() + (14 * 24 * 60 * 60 * 1000)).getTime()

                    db.users.update(sender, userData)

                    saveFactionUsers(factionGovData)
                    db.save()

                    if (certificateUrl) {
                        await conn.sendMessage(m.from, {
                            image: { url: certificateUrl },
                            caption: `🏢 *\`USAHA BISNIS DIMULAI!\`*\n• Nama: ${businessName}\n• Tipe: ${normalizedType}\n• Tanggal: ${dateTime.date}\n\nNote: Selalu ingat untuk selalu membayar perpanjangan lisensi agar bisnis kamu tidak di segel.`
                        })
                        return
                    } else {
                        caption = `🏢 *\`USAHA BISNIS DIMULAI!\`*\n• Nama: ${businessName}\n• Tipe: ${normalizedType}\n• Tanggal: ${dateTime.date}\n\nNote: Selalu ingat untuk selalu membayar perpanjangan lisensi agar bisnis kamu tidak di segel.`
                    }
                    break
                }
                case 'info': {
                    const business = bizData.businesses[sender]

                    if (!business) {
                        caption = 'Kamu belum memiliki bisnis.'
                        break
                    }
                    
                    const totalProducts = Object.values(business.products).reduce((sum, q) => sum + q, 0)

                    caption = `🏢 *\`${business.name.toUpperCase()}\`*\n`
                    caption += `• Tipe: ${business.type}\n`
                    caption += `• Tanggal Didirikan: ${formatDate(business.established)}\n`
                    caption += `• Status: ${business.sealed ? '🔒 DISEGEL' : '✅ AKTIF'}\n`
                    caption += `• Reputasi: ${business.reputation} ⭐\n\n`

                    caption += `📊 *\`STATISTIK\`*`
                    caption += `• Pelanggan: ${business.customers}\n`
                    caption += `• Modal: $${business.capital}\n`
                    caption += `• Pendapatan: $${business.income}\n`
                    caption += `• Storage: ${business.storage.used}/${business.storage.capacity}\n\n`

                    caption += `📦 *\`PRODUK\`*\n`
                    caption += `• Total Jenis: ${Object.keys(business.products).length}\n`
                    caption += `• Total Stok: ${totalProducts}`
                    break
                }
                case 'list': {
                    const businessList = Object.values(bizData.businesses)

                    if (businessList.length === 0) {
                        caption = 'Belum ada bisnis terdaftar.'
                        break
                    }

                    const sortedBusinesses = businessList.sort((a, b) => {
                        if (b.reputation !== a.reputation) {
                            return b.reputation - a.reputation
                        }
                        return b.customers - a.customers
                    })

                    caption = `📋 *\`DAFTAR BISNIS\`*\n\n`
                    sortedBusinesses.forEach((business, index) => {
                        const owner = db.users.get(business.owner)
                        caption += `${index + 1}. ${business.name} (${business.type})\n`
                        caption += `   Pemilik: ${owner?.PlayerInfo?.namaLengkap || 'Unknown'}\n`
                        caption += `   Status: ${business.sealed ? '🔒 DISEGEL' : '✅ AKTIF'}\n`
                        caption += `   Reputasi: ${business.reputation} ⭐ | Pelanggan: ${business.customers}\n`

                        caption += `   Produk tersedia:\n`

                        let hasProducts = false
                        Object.entries(business.products).forEach(([product, quantity]) => {
                            if (quantity > 0) {
                                caption += `     - ${product}: ${quantity} ($${business.prices[product]})\n`
                                hasProducts = true
                            }
                        })

                        if (!hasProducts) {
                            caption += `     - Tidak ada stok produk\n`
                        }

                        caption += `\n`
                    })
                    break
                }
                case 'stock': {
                    const business = bizData.businesses[sender]

                    if (!business) {
                        caption = 'Kamu belum memiliki bisnis.'
                        break
                    }

                    caption = `📦 *\`STOK PRODUK ${business.name.toUpperCase()}\`*\n`
                    caption += `Storage: ${business.storage.used}/${business.storage.capacity}\n\n`

                    let hasProducts = false

                    Object.entries(business.products).forEach(([product, quantity]) => {
                        caption += `• ${product}: ${quantity} ($${business.prices[product]})\n`
                        if (quantity > 0) hasProducts = true
                    })

                    if (!hasProducts) {
                        caption += 'Kamu belum memiliki stok produk.'
                    }
                    break
                }
                case 'restock': {
                    const business = bizData.businesses[sender]

                    if (!business) {
                        caption = 'Kamu belum memiliki bisnis.'
                        break
                    }

                    if (business.sealed) {
                        caption = 'Bisnis disegel, tidak dapat restock.'
                        break
                    }

                    const product = args[1]
                    const quantity = parseInt(args[2])

                    if (!product || !quantity || quantity <= 0) {
                        caption = `Gunakan: \`${ prefix + command } ${subCommand} [produk] [jumlah]\``
                        break
                    }

                    if (!bizData.market.products[business.type].includes(product)) {
                        caption = `Produk ${product} tidak tersedia untuk tipe ${business.type}.`
                        break
                    }

                    if (business.storage.used + quantity > business.storage.capacity) {
                        caption = 'Storage tidak cukup.'
                        break
                    }

                    const userInventory = userData.inventory?.items?.[product] || 0
                    if (userInventory < quantity) {
                        caption = `Produk ${product} di dalam inventory tidak cukup.`
                        break
                    }

                    const newInventory = { ...userData.inventory.items }
                    newInventory[product] = userInventory - quantity

                    business.products[product] = (business.products[product] || 0) + quantity
                    business.storage.used += quantity

                    const basePrice = priceData.basePrice[product]
                    const totalCost = basePrice * quantity

                    business.capital += totalCost

                    business.transactions.push({
                        type: 'restock',
                        cost: totalCost,
                        product: product,
                        quantity: quantity,
                        date: `${dateTime.date} ${dateTime.time}`
                    })

                    db.users.update(sender, { inventory: { items: newInventory } })
                    bizData.businesses[sender] = business
                    saveData(bizData, businessJsonPath)
                    db.save()

                    caption = `Berhasil restock ${quantity} ${product}.`
                    break
                }
                case 'delivery': {
                    const business = bizData.businesses[sender]

                    if (!business) {
                        caption = 'Kamu belum memiliki bisnis.'
                        break
                    }

                    if (business.sealed) {
                        caption = 'Bisnis disegel, tidak dapat di delivery.'
                        break
                    }
            
                    const product = args[1]
                    const quantity = parseInt(args[2])
            
                    if (!product) {
                        caption = `Gunakan: \`${ prefix + command } ${subCommand} [produk] [jumlah]\``
                        break
                    }
            
                    if (!quantity || isNaN(quantity) || quantity <= 0) {
                        caption = 'Jumlah tidak valid.'
                        break
                    }
            
                    if (!bizData.market.products[business.type].includes(product)) {
                        caption = `Produk ${product} tidak tersedia untuk bisnis tipe ${business.type}.`
                        break
                    }
            
                    if (business.storage.used + quantity > business.storage.capacity) {
                        caption = `Storage tidak cukup. Kapasitas storage tersisa ${business.storage.capacity - business.storage.used}. Dibutuhkan sekitar ${quantity} storage lebih`
                        break
                    }
            
                    const basePrice = priceData.basePrice[product]
                    const totalCost = basePrice * quantity
                    const costPajak = totalCost + (pajak * totalCost)
            
                    if (userData.playerInventory.items.uang < costPajak) {
                        caption =  `Uang tidak cukup. Kamu butuh $${costPajak}`
                        break
                    }
            
                    userData.playerInventory.items.uang -= costPajak
                    business.products[product] = (business.products[product] || 0) + quantity
                    business.storage.used += quantity
            
                    business.capital += costPajak

                    business.transactions.push({
                        type: 'delivery',
                        cost: costPajak,
                        product: product,
                        quantity: quantity,
                        date: `${dateTime.date} ${dateTime.time}`
                    })
            
                    bizData.businesses[sender] = business
                    saveBusinessData(bizData)
                    db.users.update(sender, userData)
                    db.save()
            
                    caption = `Berhasil memesan ${quantity} ${product} melalui layanan delivery dengan biaya sebesar $${costPajak}`
                    break
                }
                case 'setprice': {
                    const business = bizData.businesses[sender]

                    if (!business) {
                        caption = 'Kamu belum memiliki bisnis.'
                        break
                    }

                    if (business.sealed) {
                        caption = 'Bisnis disegel, tidak dapat ubah harga.'
                        break
                    }

                    const product = args[1]
                    const price = parseInt(args[2])

                    if (!product || !price || price <= 0) {
                        caption = `Gunakan: \`${ prefix + command } ${subCommand} [produk] [harga]\``
                        break
                    }

                    if (!bizData.market.products[business.type].includes(product)) {
                        caption = `Produk ${product} tidak tersedia.`
                        break
                    }

                    business.prices[product] = price
                    bizData.businesses[sender] = business
                    saveData(bizData, businessJsonPath)

                    caption = `Harga ${product} telah diubah menjadi $${price}.`
                    break
                }
                case 'renew-license': {
                    const isGovUserIndex = factionNewsData.NewsNetwork.findIndex(member => member.id === m.sender)
                    const isGovUser = isGovUserIndex !== -1 ? factionGovData.Government[isGovUserIndex] : null
                    const business = bizData.businesses[sender]
                    
                    const price = 550
                    const costPajak = price + (pajak * price)

                    if (isGovUser && isGovUser.duty) {
                        const business = bizData.businesses[target]
                        const targetData = db.users.get(target)

                        if (!target) {
                            caption = `Gunakan: \`${ prefix + command } ${subCommand} [target]\``
                            break
                        }

                        if (!business) {
                            caption = 'Orang ini tidak memiliki bisnis.'
                            break
                        }

                        if (business.sealed) {
                            caption = 'Bisnis ini disegel, tidak dapat memperpanjang lisensi.'
                            break
                        }

                        if (targetData.playerInventory.items.uang < costPajak) {
                            caption = `Uang orang ini tidak cukup untuk memperpanjang lisensi.`
                            break
                        }

                        const certificateUrl = await businessCertificate(business, targetData.PlayerInfo.namaLengkap)
                        const currentDate = new Date()

                        if (!factionGovData.Storage) {
                            factionGovData.Storage = {
                                balance: 0,
                                transactions: []
                            }
                        }

                        factionGovData.Storage.transactions.push({
                            type: 'renew_license',
                            amount: price * pajak,
                            by: userData.PlayerInfo.namaLengkap,
                            role: isGovUser.divisi,
                            date: `${dateTime.date} ${dateTime.time}`,
                            timestamp: dateTime.timestamp
                        })

                        factionGovData.Storage.balance += price * pajak

                        targetData.playerInventory.items.uang -= costPajak
                        targetData.playerInventory.sertifikatDanDokumen.lisensiBisnis.imageUrl = certificateUrl
                        targetData.playerInventory.sertifikatDanDokumen.lisensiBisnis.expiryDate = new Date(currentDate.getTime() + (14 * 24 * 60 * 60 * 1000)).getTime()

                        db.users.update(target, targetData)

                        saveFactionUsers(factionGovData)
                        db.save()

                        caption = 'Lisensi bisnis berhasil diperpanjang hingga 14 hari.'
                        break
                    }
                    
                    if (!business) {
                        caption = 'Kamu tidak memiliki bisnis.'
                        break
                    }

                    if (business.sealed) {
                        caption = 'Bisnis disegel, tidak dapat memperpanjang lisensi.'
                        break
                    }

                    if (!userData.playerInventory.sertifikatDanDokumen.lisensiBisnis.imageUrl) {
                        caption = 'Lisensi kamu tidak valid atau telah kedaluwarsa'
                        break
                    }

                    const lastPaid = new Date(userData.playerInventory.sertifikatDanDokumen.lisensiBisnis.expiryDate)
                    const timeSincePayment = Date.now() - lastPaid.getTime()
                    const timeRemaining = taxPeriod - timeSincePayment
                    const daysRemaining = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000))

                    if (daysRemaining > 3) {
                        caption = `Lisensi kamu masih tersisa ${daysRemaining} hari, Bayarlah jika masa waktu lisensi tersisa 3 hari kebawah.`
                        break
                    }

                    if (userData.playerInventory.items.uang < costPajak) {
                        caption = `Uang kamu tidak cukup untuk memperpanjang lisensi, Kamu butuh $${costPajak}`
                        break
                    }

                    if (dutyMembers.length !== 0) {
                        caption = 'Government sedang duty, Kamu bisa meminta kepada mereka.'
                        break
                    }

                    const certificateUrl = await businessCertificate(business, userData.PlayerInfo.namaLengkap)
                    const currentDate = new Date()

                    if (!factionGovData.Storage) {
                        factionGovData.Storage = {
                            balance: 0,
                            transactions: []
                        }
                    }

                    factionGovData.Storage.transactions.push({
                        type: 'renew_license',
                        amount: price * pajak,
                        by: userData.PlayerInfo.namaLengkap,
                        role: 'Businessman',
                        date: `${dateTime.date} ${dateTime.time}`,
                        timestamp: dateTime.timestamp
                    })

                    factionGovData.Storage.balance += price * pajak

                    userData.playerInventory.items.uang -= costPajak
                    userData.playerInventory.sertifikatDanDokumen.lisensiBisnis.imageUrl = certificateUrl
                    userData.playerInventory.sertifikatDanDokumen.lisensiBisnis.expiryDate = new Date(currentDate.getTime() + (14 * 24 * 60 * 60 * 1000)).getTime()

                    db.users.update(sender, userData)

                    saveFactionUsers(factionGovData)
                    db.save()

                    caption = 'Lisensi bisnis berhasil diperpanjang hingga 14 hari.'
                    break
                }
                case 'upgrade': {
                    const business = bizData.businesses[sender]

                    if (!business) {
                        caption = 'Kamu belum memiliki bisnis.'
                        break
                    }
            
                    if (business.sealed) {
                        caption = 'Bisnis disegel, tidak dapat ubah harga.'
                        break
                    }
            
                    const upgradeCost = business.storage.capacity * 200
                    const upgradeAmount = 50
            
                    if (userData.playerInventory.items.uang < upgradeCost) {
                        caption = `Uang tidak cukup untuk upgrade. Kamu butuh $${upgradeCost}`
                        break
                    }
            
                    userData.playerInventory.items.uang -= upgradeCost
                    business.storage.capacity += upgradeAmount
            
                    bizData.businesses[sender] = business
                    saveBusinessData(bizData)
                    db.users.update(sender, userData)
                    db.save()
            
                    caption = `Berhasil upgrade storage bisnis dari ${business.storage.capacity - upgradeAmount} menjadi ${business.storage.capacity} dengan biaya $${upgradeCost}`
                    break
                }
                case 'history': {
                    const business = bizData.businesses[sender]

                    if (!business) {
                        caption = 'Kamu belum memiliki bisnis.'
                        break
                    }
            
                    const limit = 10
            
                    caption = `📒 *\`RIWAYAT TRANSAKSI ${business.name.toUpperCase()}\`*\n\n`
            
                    if (!business.transactions || business.transactions.length === 0) {
                        caption += 'Belum ada transaksi.'
                    } else {
                        const recentTransactions = business.transactions.slice(-limit)
                
                        recentTransactions.forEach((transaction, index) => {
                            const buyerName = transaction.buyer ? (userData[transaction.buyer]?.playerInfo.namaLengkap || 'Unknown') : 'N/A'
                    
                            caption += `${index + 1}. [${transaction.date}]\n`
                            caption += `   Tipe: ${transaction.type}\n`
                    
                            if (transaction.type === 'sale') {
                                caption += `   Pembeli: ${buyerName}\n`
                                caption += `   Produk: ${transaction.quantity}x ${transaction.product}\n`
                                caption += `   Pendapatan: +$${transaction.income}\n`
                            } else if (transaction.type === 'restock' || transaction.type === 'delivery') {
                                caption += `   Produk: ${transaction.quantity}x ${transaction.product}\n`
                                caption += `   Biaya: -$${transaction.cost}\n`
                            }
                    
                            caption += '\n'
                        })
                
                        caption += `Menampilkan ${recentTransactions.length} dari ${business.transactions.length} transaksi terakhir.`
                    }
                    break
                }
                case 'buy': {
                    const businessIndex = parseInt(args[1])
                    const product = args[2]
                    const quantity = parseInt(args[3])

                    if (!businessIndex || !product || !quantity || quantity <= 0) {
                        caption = `Gunakan: \`${ prefix + command } ${subCommand} [index bisnis] [produk] [jumlah]\``
                        break
                    }

                    const businessList = Object.values(bizData.businesses)
                    if (businessIndex > businessList.length) {
                        caption = 'Index bisnis tidak valid.'
                        break
                    }

                    const business = businessList[businessIndex - 1]
                    const businessOwner = business.owner

                    if (business.sealed) {
                        caption = 'Bisnis disegel, tidak dapat bertransaksi.'
                        break
                    }

                    if (!business.products[product] || business.products[product] < quantity) {
                        caption = `Stok ${product} tidak cukup.`
                        break
                    }

                    const price = business.prices[product]
                    const totalPrice = price * quantity

                    if (userData.money < totalPrice) {
                        caption = `Uang tidak cukup. Kamu butuh $${totalPrice}`
                        break
                    }

                    const newInventory = {
                        ...userData.inventory?.items || {}
                    }
                    newInventory[product] = (newInventory[product] || 0) + quantity

                    business.products[product] -= quantity
                    business.storage.used -= quantity
                    business.income += totalPrice
                    business.customers += 1

                    db.users.update(sender, { inventory: { items: newInventory } })

                    if (businessOwner !== sender) {
                        const ownerData = db.users.get(businessOwner)
                        if (ownerData) {
                            db.users.update(businessOwner, {
                                playerInventory: {
                                    items: {
                                        uang: (ownerData.playerInventory.items.uang) + totalPrice
                                    }
                                }
                            })
                        }
                    }

                    db.users.update(sender, {
                        playerInventory: {
                            items: {
                                uang: (userData.playerInventory.items.uang) - totalPrice
                            }
                        }
                    })

                    business.transactions.push({
                        type: 'sale',
                        buyer: sender,
                        product: product,
                        quantity: quantity,
                        income: totalPrice,
                        date: `${dateTime.date} ${dateTime.time}`
                    })
            
                    if (Math.random() < 0.1) {
                        business.reputation += 1
                    }

                    bizData.businesses[businessOwner] = business
                    saveData(bizData, businessJsonPath)
                    db.save()

                    caption = `✅ *\`PEMBELIAN BERHASIL\`*\n\nProduk: ${quantity} ${product}\nHarga Satuan: ${price}\nTotal: ${totalPrice}\nSisa Uang Dompet: ${userData.playerInventory.items.uang}\n\n~ ${business.name}`
                    break
                }
                case 'sell': {
                    const business = bizData.businesses[sender]
    
                    if (!business) {
                        caption = 'Kamu belum memiliki bisnis untuk dijual.'
                        break
                    }
    
                    if (business.sealed) {
                        caption = 'Bisnis yang disegel tidak dapat dijual.'
                        break
                    }
    
                    const buyerName = args[1]
                    if (!buyerName) {
                        const businessValue = calculateBusinessValue(business)
                        const businessValuePajak = businessValue + (pajak * businessValue)
                        caption = `💰 *\`VALUASI BISNIS ${business.name.toUpperCase()}\`*\n\n`
                        caption += `• Nilai Dasar: $500\n`
                        caption += `• Nilai Reputasi: $${business.reputation * 100}\n`
                        caption += `• Nilai Storage: $${(business.storage.capacity - 50) * 150}\n`
                        caption += `• Nilai Stok: $${Math.floor(Object.entries(business.products).reduce((total, [product, quantity]) => {
                            return total + (quantity * (priceData.basePrice[product] || 100) * 0.7)
                        }, 0))}\n`
                        caption += `• Nilai Pendapatan: $${Math.floor(business.income * 0.1)}\n\n`
                        caption += `💵 *Total Nilai Bisnis: $${businessValuePajak} (termasuk pajak)*\n\n`
                        caption += `Gunakan: \`${ prefix + command } ${subCommand} [nama_pembeli]\` untuk menjual bisnis.`
                        break
                    }
    
                    const buyers = Array.from(db.users.entries()).filter(([id, user]) => 
                        user.PlayerInfo?.namaLengkap?.toLowerCase().includes(buyerName.toLowerCase())
                    )
    
                    if (buyers.length === 0) {
                        caption = `Pembeli dengan nama "${buyerName}" tidak ditemukan.`
                        break
                    }
    
                    if (buyers.length > 1) {
                        caption = `Ditemukan beberapa kandidat pembeli:\n`
                        buyers.forEach(([id, user], index) => {
                            caption += `${index + 1}. ${user.PlayerInfo.namaLengkap}\n`
                        })
                        caption += `\nGunakan nama yang lebih spesifik.`
                        break
                    }
    
                    const [buyerId, buyerData] = buyers[0]
    
                    if (buyerId === sender) {
                        caption = 'Kamu tidak bisa menjual bisnis kepada diri sendiri.'
                        break
                    }
    
                    if (bizData.businesses[buyerId]) {
                        caption = `${buyerData.PlayerInfo.namaLengkap} sudah memiliki bisnis.`
                        break
                    }
    
                    const businessValue = calculateBusinessValue(business)
                    const businessValuePajak = businessValue + (pajak * businessValue)
                    const hasilPajak = businessValue - (pajak * businessValue)
                    const newJob = [...buyerData.playerStatus.pekerjaan, 'Businessman']
    
                    if (buyerData.playerInventory.items.uang < businessValuePajak) {
                        caption = `${buyerData.PlayerInfo.namaLengkap} tidak memiliki cukup uang untuk membeli bisnis ini. Ia butuh $${businessValuePajak}`
                        break
                    }
    
                    delete bizData.businesses[sender]
                    bizData.businesses[buyerId] = {
                        ...business,
                        owner: buyerId,
                        transactions: [...business.transactions, {
                            type: 'owner_transfer',
                            from: userData.PlayerInfo.namaLengkap,
                            to: buyerData.PlayerInfo.namaLengkap,
                            amount: businessValuePajak,
                            date: `${dateTime.date} ${dateTime.time}`
                        }]
                    }
    
                    userData.playerInventory.items.uang += hasilPajak
                    buyerData.playerInventory.items.uang -= businessValuePajak
                    buyerData.playerStatus.pekerjaan = newJob
                    userData.playerStatus.pekerjaan = userData.playerStatus.pekerjaan.filter(p => p !== 'Businessman')
    
                    buyerData.playerInventory.sertifikatDanDokumen.lisensiBisnis = {
                        ...userData.playerInventory.sertifikatDanDokumen.lisensiBisnis
                    }
                    userData.playerInventory.sertifikatDanDokumen.lisensiBisnis = {
                        imageUrl: null,
                        expiryDate: null
                    }

                    if (!factionGovData.Storage) {
                        factionGovData.Storage = {
                            balance: 0,
                            transactions: []
                        }
                    }

                    factionGovData.Storage.transactions.push({
                        type: 'business_sold',
                        amount: businessValue * pajak,
                        by: userData.PlayerInfo.namaLengkap,
                        role: 'Retired Businessman',
                        date: `${dateTime.date} ${dateTime.time}`,
                        timestamp: dateTime.timestamp
                    })

                    factionGovData.Storage.balance += businessValue * pajak
    
                    db.users.update(sender, userData)
                    db.users.update(buyerId, buyerData)

                    saveFactionUsers(factionGovData)
                    saveData(bizData, businessJsonPath)
                    db.save()
    
                    caption = `✅ *\`BISNIS TERJUAL\`*\n\n`
                    caption += `• Bisnis: ${business.name}\n`
                    caption += `• Pembeli: ${buyerData.PlayerInfo.namaLengkap}\n`
                    caption += `• Harga: $${businessValue}\n`
                    caption += `• Tanggal: ${dateTime.date}\n\n`
                    caption += `Selamat! Bisnis berhasil dijual dan uang telah ditransfer.`
                    break
                }
                case 'ads': {
                    const isNewsUserIndex = factionNewsData.NewsNetwork.findIndex(member => member.id === m.sender)
                    const isNewsUser = isNewsUserIndex !== -1 ? factionNewsData.NewsNetwork[isNewsUserIndex] : null

                    if (!isNewsUser) {
                        caption = 'Kamu bukan anggota News Network.'
                        break
                    }

                    if (!isNewsUser.duty) {
                        caption = 'Kamu harus duty untuk mengelola iklan bisnis.'
                        break
                    }

                    const business = bizData.businesses[target]
                    const targetData = db.users.get(target)

                    const adType = args[2]?.toLowerCase()
                    const adCosts = { basic: 100, premium: 250, deluxe: 500 }

                    if (!target && !adType) {
                        caption = `📢 *\`PAKET IKLAN TERSEDIA\`*\n\n`
                        caption += `• Basic ($100) - +1-2 reputation, +5-10 customers\n`
                        caption += `• Premium ($250) - +2-4 reputation, +10-20 customers\n`
                        caption += `• Deluxe ($500) - +3-6 reputation, +20-35 customers\n\n`
                        caption += `Gunakan: \`${ prefix + command } ${subCommand} [target] [basic/premium/deluxe]\``
                        break
                    }

                    if (!business) {
                        caption = 'Orang ini tidak memiliki bisnis.'
                        break
                    }
    
                    if (business.sealed) {
                        caption = 'Bisnis ini disegel, tidak dapat beriklan.'
                        break
                    }
    
                    const cost = adCosts[adType]
                    const costPajak = cost + (pajak * cost)
                    const hasilPajak = cost - (pajak * cost)
    
                    if (targetData.playerInventory.items.uang < costPajak) {
                        caption = `Uang orang ini tidak cukup untuk membeli jasa iklan ${adType}. Butuh $${cost}`
                        break
                    }

                    const effects = {
                        basic: { rep: Math.floor(Math.random() * 2) + 1, customers: Math.floor(Math.random() * 6) + 5 },
                        premium: { rep: Math.floor(Math.random() * 3) + 2, customers: Math.floor(Math.random() * 11) + 10 },
                        deluxe: { rep: Math.floor(Math.random() * 4) + 3, customers: Math.floor(Math.random() * 16) + 20 }
                    }
    
                    const effect = effects[adType]
    
                    userData.playerInventory.items.uang += cost * pajak
                    targetData.playerInventory.items.uang -= costPajak
                    business.reputation += effect.rep
                    business.customers += effect.customers

                    if (!factionGovData.Storage) {
                        factionGovData.Storage = {
                            balance: 0,
                            transactions: []
                        }
                    }

                    factionGovData.Storage.transactions.push({
                        type: 'business_ads',
                        amount: hasilPajak,
                        by: userData.PlayerInfo.namaLengkap,
                        role: isNewsUser.divisi,
                        date: `${dateTime.date} ${dateTime.time}`,
                        timestamp: dateTime.timestamp
                    })

                    factionGovData.Storage.balance += hasilPajak
    
                    db.users.update(sender, userData)
                    db.users.update(target, targetData)
                    bizData.businesses[target] = business

                    saveFactionUsers(factionGovData)
                    saveData(bizData, businessJsonPath)
                    db.save()
    
                    caption = `📢 *\`IKLAN ${adType.toUpperCase()} BERHASIL\`*\n\n`
                    caption += `• Biaya: $${cost}\n`
                    caption += `• Reputasi: +${effect.rep}\n`
                    caption += `• Pelanggan Baru: +${effect.customers}\n\n`
                    caption += `Bisnis kamu semakin dikenal!`
                    break
                }
                case 'report': {
                    const business = bizData.businesses[sender]
    
                    if (!business) {
                        caption = 'Kamu belum memiliki bisnis.'
                        break
                    }
    
                    const report = generateBusinessReport(business, dateTime)
                    const businessValue = calculateBusinessValue(business)
    
                    caption = `📊 *\`LAPORAN BISNIS ${business.name.toUpperCase()}\`*\n\n`
                    caption += `🏢 *Info Umum:*\n`
                    caption += `• Tipe: ${business.type}\n`
                    caption += `• Status: ${business.sealed ? '🔒 DISEGEL' : '✅ AKTIF'}\n`
                    caption += `• Usia Bisnis: ${Math.floor((dateTime.timestamp - business.established) / (24 * 60 * 60 * 1000))} hari\n`
                    caption += `• Nilai Bisnis: ${businessValue}\n\n`
    
                    caption += `💰 *Keuangan:*\n`
                    caption += `• Total Modal: $${business.capital}\n`
                    caption += `• Total Pendapatan: $${business.income}\n`
                    caption += `• Pendapatan Bulanan: $${report.monthlyIncome}\n`
                    caption += `• Margin Keuntungan: $${report.profitMargin}%\n\n`
    
                    caption += `👥 *Pelanggan & Reputasi:*\n`
                    caption += `• Total Pelanggan: ${business.customers}\n`
                    caption += `• Reputasi: ${business.reputation} ⭐\n`
                    caption += `• Customer Retention: ${report.customerRetention}%\n\n`
    
                    caption += `📦 *Inventory:*\n`
                    caption += `• Total Stok: ${report.totalStock}\n`
                    caption += `• Storage: ${business.storage.used}/${business.storage.capacity}\n`
                    caption += `• Rata-rata Harga: $${report.averagePrice}\n\n`
    
                    caption += `📈 *Performa Terakhir:*\n`
                    const recentSales = business.transactions.filter(t => t.type === 'sale').slice(-5)
                    if (recentSales.length > 0) {
                        recentSales.forEach((sale, index) => {
                            caption += `${index + 1}. ${sale.quantity}x ${sale.product} - ${sale.income}\n`
                        })
                    } else {
                        caption += `Belum ada penjualan.`
                    }
                    break
                }
                case 'openbox': {
                    const productBoxes = userData.playerInventory.product
                    if (productBoxes < 1) {
                        caption = 'Kamu tidak memiliki box produk.'
                        break
                    }

                    const products = openProductBox(bizData, priceData)
                    const newInventory = {
                        ...userData.inventory?.items || {}
                    }

                    caption = `📦 *\`BOX TERBUKA\`*\n\nKamu mendapat:\n`
                    for (const [product, quantity] of Object.entries(products)) {
                        newInventory[product] = (newInventory[product] || 0) + quantity
                        caption += `• ${quantity}x ${product}\n`
                    }

                    db.users.update(sender, {
                        inventory: { items: newInventory, product: productBoxes - 1 }
                    })
                    db.save()
                    break
                }

                default:
                    caption = `Perintah tidak dikenal. Gunakan \`${ prefix + command } help\` untuk melihat daftar perintah.`
            }
        }
        conn.sendMessage(m.from, { text: caption.trim() })
    }
}