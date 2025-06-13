// economy.js
import fs from 'fs'

const ekonomiJson = './json/ekonomi.json'

const initEconomicData = () => {
    try {
        if (!fs.existsSync(ekonomiJson)) {
            const initialData = {
                economicIndicators: {
                    gdpGrowth: 3.2, // pertumbuhan GDP dalam %
                    inflation: 2.5, // inflasi dalam %
                    unemployment: 5.8, // pengangguran dalam %
                    interestRate: 4.0, // suku bunga dalam %
                    consumerConfidence: 75, // indeks kepercayaan konsumen (0-100)
                    marketSentiment: 65, // sentimen pasar (0-100)
                    lastUpdate: Date.now()
                },
                taxRates: {
                    baseTax: 0.01, // Ppjak dasar 1%
                    currentTax: 0.01, // pajak saat ini
                    businessTax: 0.15, // pajak bisnis 15%
                    capitalGainsTax: 0.20, // pajak capital gains 20%
                    lastUpdate: Date.now()
                },
                priceAdjustments: {
                    globalMultiplier: 1.0, // multiplier harga global
                    sectorMultipliers: {
                        'Technology': 1.0,
                        'Healthcare': 1.0,
                        'Finance': 1.0,
                        'Energy': 1.0,
                        'Consumer': 1.0,
                        'Real Estate': 1.0,
                        'Entertainment': 1.0,
                        'Transportation': 1.0,
                        'Manufacturing': 1.0,
                        'Telecommunications': 1.0,
                        'Agriculture': 1.0,
                        'Luxury': 1.0
                    },
                    lastUpdate: Date.now()
                },
                economicEvents: [],
                lastEventCheck: Date.now()
            }
            fs.writeFileSync(ekonomiJson, JSON.stringify(initialData, null, 2))
            return initialData
        } else {
            return JSON.parse(fs.readFileSync(ekonomiJson))
        }
    } catch (error) {
        console.error('Error initializing economic data:', error)
        return {
            economicIndicators: {
                gdpGrowth: 3.2,
                inflation: 2.5,
                unemployment: 5.8,
                interestRate: 4.0,
                consumerConfidence: 75,
                marketSentiment: 65,
                lastUpdate: Date.now()
            },
            taxRates: {
                baseTax: 0.01,
                currentTax: 0.01,
                businessTax: 0.15,
                capitalGainsTax: 0.20,
                lastUpdate: Date.now()
            },
            priceAdjustments: {
                globalMultiplier: 1.0,
                sectorMultipliers: {},
                lastUpdate: Date.now()
            },
            economicEvents: [],
            lastEventCheck: Date.now()
        }
    }
}

// Menghitung pajak dinamis berdasarkan kondisi ekonomi
const calculateDynamicTax = (economicData) => {
    const indicators = economicData.economicIndicators
    const baseTax = economicData.taxRates.baseTax
    
    let taxMultiplier = 1.0
    
    // Faktor GDP Growth (pertumbuhan ekonomi tinggi = pajak bisa lebih rendah)
    if (indicators.gdpGrowth > 4.0) {
        taxMultiplier -= 0.1 // Kurangi pajak 10%
    } else if (indicators.gdpGrowth < 1.0) {
        taxMultiplier += 0.2 // Naikkan pajak 20%
    }
    
    // Faktor Inflasi (inflasi tinggi = pajak naik untuk mengurangi spending)
    if (indicators.inflation > 4.0) {
        taxMultiplier += 0.15 // Naikkan pajak 15%
    } else if (indicators.inflation < 1.0) {
        taxMultiplier -= 0.05 // Kurangi pajak 5%
    }
    
    // Faktor Pengangguran (pengangguran tinggi = pajak naik untuk dana sosial)
    if (indicators.unemployment > 8.0) {
        taxMultiplier += 0.25 // Naikkan pajak 25%
    } else if (indicators.unemployment < 3.0) {
        taxMultiplier -= 0.1 // Kurangi pajak 10%
    }
    
    // Faktor Kepercayaan Konsumen
    if (indicators.consumerConfidence < 50) {
        taxMultiplier += 0.1 // Ekonomi lesu, naikkan pajak
    } else if (indicators.consumerConfidence > 80) {
        taxMultiplier -= 0.05 // Ekonomi bagus, kurangi pajak
    }
    
    // Batasi perubahan pajak agar tidak terlalu ekstrem
    taxMultiplier = Math.max(0.5, Math.min(2.0, taxMultiplier))
    
    return Math.max(0.005, Math.min(0.05, baseTax * taxMultiplier)) // Min 0.5%, Max 5%
}

// Menghitung multiplier harga berdasarkan kondisi ekonomi
const calculatePriceMultipliers = (economicData, stockData) => {
    const indicators = economicData.economicIndicators
    let globalMultiplier = 1.0
    const sectorMultipliers = { ...economicData.priceAdjustments.sectorMultipliers }
    
    // Global multiplier berdasarkan inflasi
    globalMultiplier += (indicators.inflation - 2.0) / 100 // Setiap 1% inflasi = 1% kenaikan harga
    
    // Berdasarkan GDP Growth
    if (indicators.gdpGrowth > 4.0) {
        globalMultiplier += 0.02 // Ekonomi baik = harga naik 2%
    } else if (indicators.gdpGrowth < 1.0) {
        globalMultiplier -= 0.03 // Ekonomi buruk = harga turun 3%
    }
    
    // Sektor-specific adjustments berdasarkan market performance
    if (stockData && stockData.markets) {
        Object.values(stockData.markets).forEach(market => {
            Object.values(market.stocks).forEach(stock => {
                const sector = stock.sector
                if (!sectorMultipliers[sector]) {
                    sectorMultipliers[sector] = 1.0
                }
                
                // Sesuaikan berdasarkan performa saham sektor
                const sectorPerformance = stock.changePercent / 100
                sectorMultipliers[sector] += sectorPerformance * 0.1 // 10% dari performa saham
                
                // Batasi perubahan
                sectorMultipliers[sector] = Math.max(0.7, Math.min(1.5, sectorMultipliers[sector]))
            })
        })
    }
    
    // Special adjustments berdasarkan events
    if (indicators.consumerConfidence < 40) {
        sectorMultipliers['Consumer'] *= 0.9 // Konsumen menurun 10%
        sectorMultipliers['Luxury'] *= 0.8 // Luxury menurun 20%
    }
    
    if (indicators.interestRate > 6.0) {
        sectorMultipliers['Real Estate'] *= 0.85 // Real estate turun karena suku bunga tinggi
        sectorMultipliers['Finance'] *= 1.1 // Bank untung dari suku bunga tinggi
    }
    
    // Batasi global multiplier
    globalMultiplier = Math.max(0.8, Math.min(1.3, globalMultiplier))
    
    return { globalMultiplier, sectorMultipliers }
}

// Generate economic events
const generateEconomicEvent = () => {
    const events = [
        {
            type: 'policy_change',
            name: 'Kebijakan Moneter Baru',
            effects: {
                interestRate: { min: -1.0, max: 1.0 },
                inflation: { min: -0.5, max: 0.5 },
                consumerConfidence: { min: -10, max: 10 }
            },
            duration: 30 * 24 * 60 * 60 * 1000 // 30 hari
        },
        {
            type: 'trade_war',
            name: 'Perang Dagang Global',
            effects: {
                gdpGrowth: { min: -2.0, max: -0.5 },
                unemployment: { min: 0.5, max: 2.0 },
                marketSentiment: { min: -20, max: -5 }
            },
            duration: 90 * 24 * 60 * 60 * 1000 // 90 hari
        },
        {
            type: 'tech_boom',
            name: 'Boom Teknologi',
            effects: {
                gdpGrowth: { min: 1.0, max: 3.0 },
                consumerConfidence: { min: 10, max: 25 },
                marketSentiment: { min: 15, max: 30 }
            },
            duration: 60 * 24 * 60 * 60 * 1000 // 60 hari
        },
        {
            type: 'natural_disaster',
            name: 'Bencana Alam',
            effects: {
                gdpGrowth: { min: -1.5, max: -0.3 },
                inflation: { min: 0.5, max: 2.0 },
                unemployment: { min: 0.3, max: 1.5 }
            },
            duration: 45 * 24 * 60 * 60 * 1000 // 45 hari
        },
        {
            type: 'oil_crisis',
            name: 'Krisis Minyak',
            effects: {
                inflation: { min: 1.0, max: 3.0 },
                consumerConfidence: { min: -15, max: -5 },
                gdpGrowth: { min: -1.0, max: -0.2 }
            },
            duration: 120 * 24 * 60 * 60 * 1000 // 120 hari
        }
    ]
    
    const event = events[Math.floor(Math.random() * events.length)]
    const processedEvent = {
        ...event,
        id: Date.now(),
        startTime: Date.now(),
        endTime: Date.now() + event.duration,
        appliedEffects: {}
    }
    
    // Apply random effects within ranges
    Object.keys(event.effects).forEach(indicator => {
        const range = event.effects[indicator]
        const effect = Math.random() * (range.max - range.min) + range.min
        processedEvent.appliedEffects[indicator] = effect
    })
    
    return processedEvent
}

// Update economic indicators
const updateEconomicIndicators = (economicData, stockData) => {
    const now = Date.now()
    const indicators = economicData.economicIndicators
    
    // Check for new events (5% chance every hour)
    if (now - economicData.lastEventCheck > 60 * 60 * 1000) { // 1 hour
        if (Math.random() < 0.05) {
            const newEvent = generateEconomicEvent()
            economicData.economicEvents.push(newEvent)
            console.log(`New economic event: ${newEvent.name}`)
        }
        economicData.lastEventCheck = now
    }
    
    // Apply active events
    const activeEvents = economicData.economicEvents.filter(event => 
        now >= event.startTime && now <= event.endTime
    )
    
    // Natural market fluctuations (small random changes)
    const naturalChanges = {
        gdpGrowth: (Math.random() - 0.5) * 0.1,
        inflation: (Math.random() - 0.5) * 0.1,
        unemployment: (Math.random() - 0.5) * 0.1,
        interestRate: (Math.random() - 0.5) * 0.05,
        consumerConfidence: (Math.random() - 0.5) * 2,
        marketSentiment: (Math.random() - 0.5) * 2
    }
    
    // Apply changes from active events
    activeEvents.forEach(event => {
        Object.keys(event.appliedEffects).forEach(indicator => {
            const dailyEffect = event.appliedEffects[indicator] / (event.duration / (24 * 60 * 60 * 1000))
            naturalChanges[indicator] += dailyEffect
        })
    })
    
    // Apply changes with bounds
    indicators.gdpGrowth = Math.max(-5, Math.min(10, indicators.gdpGrowth + naturalChanges.gdpGrowth))
    indicators.inflation = Math.max(-2, Math.min(15, indicators.inflation + naturalChanges.inflation))
    indicators.unemployment = Math.max(1, Math.min(25, indicators.unemployment + naturalChanges.unemployment))
    indicators.interestRate = Math.max(0, Math.min(15, indicators.interestRate + naturalChanges.interestRate))
    indicators.consumerConfidence = Math.max(0, Math.min(100, indicators.consumerConfidence + naturalChanges.consumerConfidence))
    indicators.marketSentiment = Math.max(0, Math.min(100, indicators.marketSentiment + naturalChanges.marketSentiment))
    
    // Update market sentiment based on stock performance
    if (stockData && stockData.markets) {
        let totalChangePercent = 0
        let stockCount = 0
        
        Object.values(stockData.markets).forEach(market => {
            Object.values(market.stocks).forEach(stock => {
                totalChangePercent += stock.changePercent
                stockCount++
            })
        })
        
        if (stockCount > 0) {
            const avgMarketChange = totalChangePercent / stockCount
            indicators.marketSentiment += avgMarketChange * 0.5 // 50% influence
            indicators.marketSentiment = Math.max(0, Math.min(100, indicators.marketSentiment))
        }
    }
    
    // Update tax rates
    economicData.taxRates.currentTax = calculateDynamicTax(economicData)
    
    // Update price multipliers
    const multipliers = calculatePriceMultipliers(economicData, stockData)
    economicData.priceAdjustments.globalMultiplier = multipliers.globalMultiplier
    economicData.priceAdjustments.sectorMultipliers = multipliers.sectorMultipliers
    
    // Remove expired events
    economicData.economicEvents = economicData.economicEvents.filter(event => now <= event.endTime)
    
    // Keep only last 20 events for history
    if (economicData.economicEvents.length > 20) {
        economicData.economicEvents = economicData.economicEvents.slice(-20)
    }
    
    indicators.lastUpdate = now
    economicData.taxRates.lastUpdate = now
    economicData.priceAdjustments.lastUpdate = now
    
    return economicData
}

// Dynamic tax system
let economicData = initEconomicData()
let lastTaxUpdate = Date.now()

// Function to get current dynamic tax rate
const getCurrentTax = (stockData = null) => {
    const now = Date.now()
    
    // Update economic data every 30 minutes
    if (now - lastTaxUpdate > 30 * 60 * 1000) {
        economicData = updateEconomicIndicators(economicData, stockData)
        lastTaxUpdate = now
        
        // Save updated economic data
        import('fs').then(fs => {
            fs.writeFileSync('./json/ekonomi.json', JSON.stringify(economicData, null, 2))
        })
    }
    
    return economicData.taxRates.currentTax
}

// Function to get economic status for display
const getEconomicStatus = () => {
    return {
        indicators: economicData.economicIndicators,
        taxRates: economicData.taxRates,
        priceAdjustments: economicData.priceAdjustments,
        activeEvents: economicData.economicEvents.filter(event => 
            Date.now() >= event.startTime && Date.now() <= event.endTime
        )
    }
}

const getTaxAlasan = () => {
    const indicators = economicData.economicIndicators
    const baseTax = economicData.taxRates.baseTax
    const currentTax = economicData.taxRates.currentTax
    const changePercent = ((currentTax - baseTax) / baseTax * 100).toFixed(1)
    
    let alasan = `📊 *\`ANALISIS PAJAK DINAMIS\`*\n\n`
    alasan += `• Pajak Dasar: ${(baseTax * 100).toFixed(2)}%\n`
    alasan += `• Pajak Saat Ini: ${(currentTax * 100).toFixed(2)}%\n`
    alasan += `• Perubahan: ${changePercent > 0 ? '+' : ''}${changePercent}%\n\n`
    
    alasan += `📈 *\`INDIKATOR EKONOMI:\`*\n`
    alasan += `• Pertumbuhan GDP: ${indicators.gdpGrowth.toFixed(1)}%\n`
    alasan += `• Inflasi: ${indicators.inflation.toFixed(1)}%\n`
    alasan += `• Pengangguran: ${indicators.unemployment.toFixed(1)}%\n`
    alasan += `• Suku Bunga: ${indicators.interestRate.toFixed(1)}%\n`
    alasan += `• Kepercayaan Konsumen: ${indicators.consumerConfidence.toFixed(0)}/100\n`
    alasan += `• Sentimen Pasar: ${indicators.marketSentiment.toFixed(0)}/100\n\n`
    
    alasan += `🎯 *\`FAKTOR PAJAK:\`*\n`
    
    if (indicators.gdpGrowth > 4.0) {
        alasan += `• ✅ GDP tinggi: Pajak dikurangi\n`
    } else if (indicators.gdpGrowth < 1.0) {
        alasan += `• ❌ GDP rendah: Pajak dinaikkan\n`
    }
    
    if (indicators.inflation > 4.0) {
        alasan += `• 🔥 Inflasi tinggi: Pajak dinaikkan\n`
    } else if (indicators.inflation < 1.0) {
        alasan += `• ❄️ Inflasi rendah: Pajak dikurangi\n`
    }
    
    if (indicators.unemployment > 8.0) {
        alasan += `• 📉 Pengangguran tinggi: Pajak dinaikkan\n`
    } else if (indicators.unemployment < 3.0) {
        alasan += `• 📈 Pengangguran rendah: Pajak dikurangi\n`
    }
    
    if (indicators.consumerConfidence < 50) {
        alasan += `• 😰 Kepercayaan rendah: Pajak dinaikkan\n`
    } else if (indicators.consumerConfidence > 80) {
        alasan += `• 😊 Kepercayaan tinggi: Pajak dikurangi\n`
    }
    
    return alasan
}

const applyEconomicEffects = (basePrice, product, economicData) => {
    const sectorMap = {
        'tshirt': 'Consumer', 'jeans': 'Consumer', 'jacket': 'Consumer', 'hoodie': 'Consumer',
        'shoes': 'Consumer', 'hat': 'Consumer', 'dress': 'Consumer',
        'rice': 'Agriculture', 'oil': 'Agriculture', 'sugar': 'Agriculture', 'flour': 'Agriculture',
        'salt': 'Agriculture', 'coffee': 'Agriculture', 'tea': 'Agriculture', 'milk': 'Agriculture',
        'phone': 'Technology', 'laptop': 'Technology', 'headphone': 'Technology', 'charger': 'Technology',
        'powerbank': 'Technology', 'camera': 'Technology', 'speaker': 'Technology',
        'air': 'Consumer', 'energydrink': 'Consumer', 'omorice': 'Consumer', 'pizza': 'Consumer',
        'snack': 'Consumer', 'burger': 'Consumer', 'fries': 'Consumer'
    }
    
    const sector = sectorMap[product] || 'Consumer'
    const globalMult = economicData.priceAdjustments.globalMultiplier || 1.0
    const sectorMult = economicData.priceAdjustments.sectorMultipliers[sector] || 1.0
    
    return Math.floor(basePrice * globalMult * sectorMult)
}

export {
    initEconomicData,
    updateEconomicIndicators,
    calculateDynamicTax,
    getCurrentTax,
    getEconomicStatus,
    getTaxAlasan,
    applyEconomicEffects,
    generateEconomicEvent
}