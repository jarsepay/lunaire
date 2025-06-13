// stock-market.js
import fs from 'fs'

const stockJsonPath = './json/stocks.json'

const GLOBAL_MARKETS = {
    'LSE': { name: 'Los Angeles Stock Exchange', city: 'Los Angeles', timezone: 'America/Los_Angeles', currency: 'USD' },
    'TSX': { name: 'Toronto Stock Exchange', city: 'Toronto', timezone: 'America/Toronto', currency: 'CAD' },
    'LVX': { name: 'Las Vegas Exchange', city: 'Las Vegas', timezone: 'America/Los_Angeles', currency: 'USD' },
    'NYSE': { name: 'New York Stock Exchange', city: 'New York', timezone: 'America/New_York', currency: 'USD'},
    'LSX': { name: 'London Stock Exchange', city: 'London', timezone: 'Europe/London', currency: 'GBP' },
    'TSE': { name: 'Tokyo Stock Exchange', city: 'Tokyo', timezone: 'Asia/Tokyo', currency: 'JPY' },
    'MSE': { name: 'Miami Stock Exchange', city: 'Miami', timezone: 'America/New_York', currency: 'USD' },
    'PSE': { name: 'Paris Stock Exchange', city: 'Paris', timezone: 'Europe/Paris', currency: 'EUR' },
    'ASE': { name: 'Amsterdam Stock Exchange', city: 'Amsterdam', timezone: 'Europe/Amsterdam', currency: 'EUR' },
    'KSE': { name: 'Seoul Stock Exchange', city: 'Seoul', timezone: 'Asia/Seoul', currency: 'KRW' },
    'SSE': { name: 'Shanghai Stock Exchange', city: 'Shanghai', timezone: 'Asia/Shanghai', currency: 'CNY' }
}

const MARKET_HOURS = {
    premarket: { start: 4, end: 9 },
    regular: { start: 9, end: 16 },
    afterhours: { start: 16, end: 20 }
}

const initStockData = () => {
    try {
        if (!fs.existsSync(stockJsonPath)) {
            const initialStocks = {
                markets: {},
                players: {},
                events: [],
                lastEventUpdate: Date.now(),
                globalEvents: []
            }

            Object.keys(GLOBAL_MARKETS).forEach(marketCode => {
                initialStocks.markets[marketCode] = {
                    name: GLOBAL_MARKETS[marketCode].name,
                    city: GLOBAL_MARKETS[marketCode].city,
                    timezone: GLOBAL_MARKETS[marketCode].timezone,
                    currency: GLOBAL_MARKETS[marketCode].currency,
                    status: 'closed',
                    lastUpdate: Date.now(),
                    stocks: companyStocks()
                }
            })

            fs.writeFileSync(stockJsonPath, JSON.stringify(initialStocks, null, 2))
            return initialStocks
        } else {
            return JSON.parse(fs.readFileSync(stockJsonPath))
        }
    } catch (error) {
        console.error('Error:', error)
        return {
            markets: {},
            players: {},
            events: []
        }
    }
}

const companyStocks = () => {
    const companies = [
        // Teknologi
        { symbol: 'TECH', name: 'Nous TechCorp', sector: 'Technology', basePrice: 120.50 },
        { symbol: 'DIGI', name: 'Zeta Digital Solutions', sector: 'Technology', basePrice: 85.75 },
        { symbol: 'CYBER', name: 'CyberSoft', sector: 'Technology', basePrice: 95.20 },

        // Kesehatan
        { symbol: 'HEAL', name: 'Nu HealthMed', sector: 'Healthcare', basePrice: 78.90 },
        { symbol: 'PHARM', name: 'Iota PharmaCorp', sector: 'Healthcare', basePrice: 145.30 },

        // Finansial
        { symbol: 'BANK', name: 'Sigma Bank', sector: 'Finance', basePrice: 65.40 },
        { symbol: 'INSR', name: 'Insurance Pro', sector: 'Finance', basePrice: 52.80 },

        // Sumber Daya
        { symbol: 'OIL', name: 'Omega Oil Corp', sector: 'Energy', basePrice: 110.25 },
        { symbol: 'GAS', name: 'Theta Gas Industries', sector: 'Energy', basePrice: 88.65 },
        { symbol: 'SOLAR', name: 'Kappa Solar Power', sector: 'Energy', basePrice: 42.15 },

        // Konsumen
        { symbol: 'FOOD', name: 'Food Giant', sector: 'Consumer', basePrice: 35.90 },
        { symbol: 'RETAIL', name: 'Retail Chain', sector: 'Consumer', basePrice: 28.45 },
        { symbol: 'AUTO', name: 'GSM Auto Corp', sector: 'Automotive', basePrice: 72.30 },

        // Real Estate
        { symbol: 'REAL', name: 'Real Estate Co', sector: 'Real Estate', basePrice: 195.80 },
        { symbol: 'PROP', name: 'Property Dev', sector: 'Real Estate', basePrice: 156.25 },

        // Entertainment
        { symbol: 'ENT', name: 'Diddy Entertainment Inc', sector: 'Entertainment', basePrice: 45.60 },
        { symbol: 'GAME', name: 'Luna Gaming Corp', sector: 'Entertainment', basePrice: 67.40 },

        // Transportasi
        { symbol: 'AIR', name: 'Eta Airways', sector: 'Transportation', basePrice: 38.75 },
        { symbol: 'SHIP', name: 'Danny Shipping Inc', sector: 'Transportation', basePrice: 49.20 },

        // Manufaktur
        { symbol: 'STEEL', name: 'Gamma Steel Works', sector: 'Manufacturing', basePrice: 82.10 },
        { symbol: 'CHEM', name: 'Rick Chemical Corp', sector: 'Manufacturing', basePrice: 91.35 },

        // Telekomunikasi
        { symbol: 'TEL', name: 'Telecom Giant', sector: 'Telecommunications', basePrice: 58.90 },
        { symbol: 'NET', name: 'OmiNetwork Solutions', sector: 'Telecommunications', basePrice: 44.25 },

        // Agrikultur
        { symbol: 'AGRI', name: 'Lambda Agriculture Co', sector: 'Agriculture', basePrice: 29.80 },
        { symbol: 'FARM', name: 'OmiFarm Industries', sector: 'Agriculture', basePrice: 33.45 },

        // Luxury
        { symbol: 'LUX', name: 'Loire Luxury', sector: 'Luxury', basePrice: 285.70 }
    ]

    const stocks = {}
    companies.forEach(company => {
        const volatility = Math.random() * 0.3 + 0.1 // 10-40% volatility
        stocks[company.symbol] = {
            name: company.name,
            sector: company.sector,
            price: company.basePrice,
            basePrice: company.basePrice,
            change: 0,
            changePercent: 0,
            volume: Math.floor(Math.random() * 1000000) + 100000,
            volatility: volatility,
            history: [{
                timestamp: Date.now(),
                price: company.basePrice,
                volume: Math.floor(Math.random() * 1000000) + 100000
            }],
            marketCap: company.basePrice * (Math.floor(Math.random() * 1000000) + 1000000),
            dividendYield: Math.random() * 5,
            peRatio: Math.random() * 30 + 5,
            lastUpdate: Date.now()
        }
    })

    return stocks
}

const getMarketStatus = (marketCode) => {
    const market = GLOBAL_MARKETS[marketCode]
    if (!market) return 'closed'

    const now = new Date()
    const marketTime = new Date(now.toLocaleString('en-US', {
        timeZone: market.timezone
    }))
    const hour = marketTime.getHours()

    if (hour >= MARKET_HOURS.premarket.start && hour < MARKET_HOURS.premarket.end) {
        return 'premarket'
    } else if (hour >= MARKET_HOURS.regular.start && hour < MARKET_HOURS.regular.end) {
        return 'open'
    } else if (hour >= MARKET_HOURS.afterhours.start && hour < MARKET_HOURS.afterhours.end) {
        return 'afterhours'
    } else {
        return 'closed'
    }
}

const generateMarketEvent = () => {
    const events = [
        { type: 'earnings', impact: 0.15, description: 'Quarterly earnings report released' },
        { type: 'merger', impact: 0.25, description: 'Major merger announcement' },
        { type: 'scandal', impact: -0.20, description: 'Corporate scandal emerges' },
        { type: 'breakthrough', impact: 0.18, description: 'Technology breakthrough announced' },
        { type: 'regulation', impact: -0.12, description: 'New government regulations' },
        { type: 'partnership', impact: 0.10, description: 'Strategic partnership formed' },
        { type: 'lawsuit', impact: -0.15, description: 'Major lawsuit filed' },
        { type: 'acquisition', impact: 0.22, description: 'Company acquisition completed' },
        { type: 'bankruptcy', impact: -0.35, description: 'Competitor files for bankruptcy' },
        { type: 'ipo', impact: 0.12, description: 'Successful IPO launch' }
    ]

    return events[Math.floor(Math.random() * events.length)]
}

const updateStockPrices = (stockData) => {
    const now = Date.now()

    if (now - stockData.lastEventUpdate > 4 * 60 * 60 * 1000) {
        const globalEvent = generateMarketEvent()
        stockData.globalEvents.push({
            ...globalEvent,
            timestamp: now,
            affectedSectors: ['Technology', 'Healthcare', 'Finance'].slice(0, Math.floor(Math.random() * 3) + 1)
        })
        stockData.lastEventUpdate = now

        if (stockData.globalEvents.length > 10) {
            stockData.globalEvents = stockData.globalEvents.slice(-10)
        }
    }

    Object.keys(stockData.markets).forEach(marketCode => {
        const market = stockData.markets[marketCode]
        market.status = getMarketStatus(marketCode)

        Object.keys(market.stocks).forEach(symbol => {
            const stock = market.stocks[symbol]
            let priceChange = 0

            const baseVolatility = stock.volatility * (Math.random() - 0.5) * 0.1

            let statusMultiplier = 1
            if (market.status === 'premarket') statusMultiplier = 0.5
            else if (market.status === 'afterhours') statusMultiplier = 0.3
            else if (market.status === 'closed') statusMultiplier = 0.1

            stockData.globalEvents.forEach(event => {
                if (event.affectedSectors.includes(stock.sector)) {
                    priceChange += event.impact * statusMultiplier
                }
            })

            const playerInfluence = calculatePlayerInfluence(stockData.players, symbol)
            priceChange += playerInfluence * statusMultiplier

            const totalChange = (baseVolatility + priceChange) * statusMultiplier
            const newPrice = stock.price * (1 + totalChange)

            stock.price = Math.max(newPrice, 0.01) // Prevent negative prices
            stock.change = stock.price - stock.basePrice
            stock.changePercent = (stock.change / stock.basePrice) * 100
            stock.volume += Math.floor(Math.random() * 10000)
            stock.lastUpdate = now

            stock.history.push({
                timestamp: now,
                price: stock.price,
                volume: stock.volume
            })

            if (stock.history.length > 100) {
                stock.history = stock.history.slice(-100)
            }
        })

        market.lastUpdate = now
    })

    return stockData
}

const calculatePlayerInfluence = (players, symbol) => {
    let totalBuyVolume = 0
    let totalSellVolume = 0

    Object.values(players).forEach(player => {
        if (player.portfolio[symbol]) {
            const position = player.portfolio[symbol]
            if (position.shares > 0) {
                totalBuyVolume += position.totalInvested
            } else {
                totalSellVolume += Math.abs(position.totalInvested)
            }
        }
    })

    const netVolume = totalBuyVolume - totalSellVolume
    return Math.min(Math.max(netVolume / 1000000, -0.1), 0.1) // Cap influence at ±10%
}

const formatCurrency = (amount, currency = 'USD') => {
    const formatters = {
        'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
        'EUR': new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
        'GBP': new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
        'JPY': new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
        'CAD': new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }),
        'KRW': new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }),
        'CNY': new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' })
    }

    return formatters[currency]?.format(amount) || `${amount} ${currency}`
}

export {
    GLOBAL_MARKETS,
    MARKET_HOURS,
    initStockData,
    companyStocks,
    getMarketStatus,
    generateMarketEvent,
    updateStockPrices,
    calculatePlayerInfluence,
    formatCurrency,
    stockJsonPath
}