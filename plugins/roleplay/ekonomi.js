import { 
    getCurrentTax, 
    getEconomicStatus, 
    getTaxAlasan
} from '../../lib/databases/economy.js'
import { initStockData, updateStockPrices } from '../../lib/databases/stock-market.js'

export const cmd = {
    name: ['tax', 'economy'],
    command: ['tax', 'economy'],
    category: ['roleplay'],
    detail: {
        desc: 'Dynamic Tax & Economic System'
    },
    setting: {
        isRegister: true,
        isBanned: false,
        isJail: false
    },
    async start({ m, prefix, command, conn, args }) {
        const subCommand = args[0]?.toLowerCase() || ''
        let caption = ''

        try {
            const stockData = updateStockPrices(initStockData())
            const economicData = getEconomicStatus()
            const currentTax = getCurrentTax(stockData)

            if (command === 'tax') {
                switch (subCommand) {
                    case 'info':
                    case 'rate': {
                        caption = `💰 *\`INFORMASI PAJAK DINAMIS\`*\n\n`
                        caption += `• Pajak Saat Ini: ${(currentTax * 100).toFixed(2)}%\n`
                        caption += `• Status: ${currentTax > 0.02 ? '🔴 TINGGI' : currentTax > 0.015 ? '🟡 SEDANG' : '🟢 RENDAH'}\n`
                        caption += `• Terakhir Update: ${new Date(economicData.taxRates.lastUpdate).toLocaleString('id-ID')}\n\n`
                        
                        caption += `📊 *\`PERBANDINGAN TARIF:\`*\n`
                        caption += `• Pajak Dasar: ${(economicData.taxRates.baseTax * 100).toFixed(2)}%\n`
                        caption += `• Pajak Bisnis: ${(economicData.taxRates.businessTax * 100).toFixed(1)}%\n`
                        caption += `• Pajak Capital Gains: ${(economicData.taxRates.capitalGainsTax * 100).toFixed(1)}%\n\n`
                        
                        const changePercent = ((currentTax - economicData.taxRates.baseTax) / economicData.taxRates.baseTax * 100)
                        caption += `📈 *\`PERUBAHAN:\`* ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`
                        break
                    }

                    case 'analysis': {
                        caption = getTaxAlasan()
                        break
                    }

                    case 'history': {
                        caption = `📜 *\`RIWAYAT PAJAK HARIAN\`*\n\n`
                        caption += `• Saat Ini: ${(currentTax * 100).toFixed(2)}%\n`
                        caption += `• 1 Jam Lalu: ${((currentTax + (Math.random() - 0.5) * 0.002) * 100).toFixed(2)}%\n`
                        caption += `• 2 Jam Lalu: ${((currentTax + (Math.random() - 0.5) * 0.003) * 100).toFixed(2)}%\n`
                        caption += `• 6 Jam Lalu: ${((currentTax + (Math.random() - 0.5) * 0.005) * 100).toFixed(2)}%\n`
                        caption += `• 12 Jam Lalu: ${((currentTax + (Math.random() - 0.5) * 0.008) * 100).toFixed(2)}%\n`
                        caption += `• 1 Hari Lalu: ${((currentTax + (Math.random() - 0.5) * 0.01) * 100).toFixed(2)}%\n\n`
                        
                        caption += `📊 *\`TREND:\`* ${Math.random() > 0.5 ? '📈 Naik' : '📉 Turun'}\n`
                        caption += `🔄 *\`UPDATE BERIKUTNYA:\`* ${Math.floor(Math.random() * 25 + 5)} menit`
                        break
                    }

                    case 'calculate': {
                        const amount = parseFloat(args[1])
                        if (!amount || amount <= 0) {
                            caption = `Gunakan: \`${ prefix + command } ${subCommand} [jumlah]\``
                            break
                        }

                        const taxAmount = amount * currentTax
                        const afterTax = amount - taxAmount

                        caption = `🧮 *\`KALKULATOR PAJAK\`*\n\n`
                        caption += `• Jumlah Asli: $${amount.toLocaleString()}\n`
                        caption += `• Tarif Pajak: ${(currentTax * 100).toFixed(2)}%\n`
                        caption += `• Jumlah Pajak: $${taxAmount.toFixed(2)}\n`
                        caption += `• Setelah Pajak: $${afterTax.toFixed(2)}\n\n`
                        
                        if (currentTax > 0.025) {
                            caption += `⚠️ *Pajak sedang tinggi!* Pertimbangkan untuk menunda transaksi besar.`
                        } else if (currentTax < 0.01) {
                            caption += `✅ *Pajak sedang rendah!* Saat yang baik untuk bertransaksi.`
                        }
                        break
                    }

                    default: {
                        caption = `💰 *\`SISTEM PAJAK DINAMIS\`*\n\n`
                        caption += `• Tarif Saat Ini: ${(currentTax * 100).toFixed(2)}%\n`
                        caption += `• Status Ekonomi: ${economicData.indicators.gdpGrowth > 3 ? '🟢 Baik' : economicData.indicators.gdpGrowth > 1 ? '🟡 Sedang' : '🔴 Buruk'}\n`
                        caption += `• Inflasi: ${economicData.indicators.inflation.toFixed(1)}%\n`
                        caption += `• Pengangguran: ${economicData.indicators.unemployment.toFixed(1)}%\n\n`
                        
                        caption += `📋 *\`DAFTAR PERINTAH\`*\n\n`

                        caption += `*Contoh:* \`${prefix + command} info\`\n`
                        caption += `*Prefix:* \`${prefix}\`\n\n`

                        caption += `• \`${command} info\` - Info detail pajak\n`
                        caption += `• \`${command} analysis\` - Analisis faktor pajak\n`
                        caption += `• \`${command} history\` - Riwayat perubahan\n`
                        caption += `• \`${command} calculate\` - Hitung pajak\n`
                        caption += `• \`economy status\` - Status ekonomi lengkap`
                        break
                    }
                }
            }

            else if (command === 'economy') {
                switch (subCommand) {
                    case 'status': {
                        const indicators = economicData.indicators
                        
                        caption = `🌍 *\`STATUS EKONOMI GLOBAL\`*\n\n`
                        
                        // GDP Growth
                        const gdpIcon = indicators.gdpGrowth > 3 ? '🟢' : indicators.gdpGrowth > 1 ? '🟡' : '🔴'
                        caption += `${gdpIcon} *Pertumbuhan GDP:* ${indicators.gdpGrowth.toFixed(1)}%\n`
                        
                        // Inflation
                        const inflationIcon = indicators.inflation < 3 ? '🟢' : indicators.inflation < 5 ? '🟡' : '🔴'
                        caption += `${inflationIcon} *Inflasi:* ${indicators.inflation.toFixed(1)}%\n`
                        
                        // Unemployment
                        const unemploymentIcon = indicators.unemployment < 5 ? '🟢' : indicators.unemployment < 8 ? '🟡' : '🔴'
                        caption += `${unemploymentIcon} *Pengangguran:* ${indicators.unemployment.toFixed(1)}%\n`
                        
                        // Interest Rate
                        const interestIcon = indicators.interestRate < 4 ? '🟢' : indicators.interestRate < 7 ? '🟡' : '🔴'
                        caption += `${interestIcon} *Suku Bunga:* ${indicators.interestRate.toFixed(1)}%\n\n`
                        
                        // Confidence Indicators
                        caption += `📊 *\`INDIKATOR KEPERCAYAAN:\`*\n`
                        const confIcon = indicators.consumerConfidence > 70 ? '😊' : indicators.consumerConfidence > 50 ? '😐' : '😰'
                        caption += `${confIcon} *Konsumen:* ${indicators.consumerConfidence.toFixed(0)}/100\n`
                        
                        const sentIcon = indicators.marketSentiment > 70 ? '📈' : indicators.marketSentiment > 50 ? '📊' : '📉'
                        caption += `${sentIcon} *Pasar:* ${indicators.marketSentiment.toFixed(0)}/100\n\n`
                        
                        // Overall Economic Health
                        const healthScore = (
                            (indicators.gdpGrowth > 3 ? 25 : indicators.gdpGrowth > 1 ? 15 : 5) +
                            (indicators.inflation < 3 ? 25 : indicators.inflation < 5 ? 15 : 5) +
                            (indicators.unemployment < 5 ? 25 : indicators.unemployment < 8 ? 15 : 5) +
                            (indicators.consumerConfidence / 4)
                        )
                        
                        const healthIcon = healthScore > 80 ? '🟢' : healthScore > 60 ? '🟡' : '🔴'
                        const healthStatus = healthScore > 80 ? 'SANGAT BAIK' : healthScore > 60 ? 'BAIK' : healthScore > 40 ? 'SEDANG' : 'BURUK'
                        
                        caption += `${healthIcon} *\`KESEHATAN EKONOMI: ${healthStatus}\`*\n`
                        caption += `Skor: ${healthScore.toFixed(0)}/100`
                        break
                    }

                    case 'events': {
                        caption = `🎯 *\`EVENT EKONOMI AKTIF\`*\n\n`
                        
                        if (economicData.activeEvents && economicData.activeEvents.length > 0) {
                            economicData.activeEvents.forEach((event, index) => {
                                const timeLeft = event.endTime - Date.now()
                                const daysLeft = Math.ceil(timeLeft / (24 * 60 * 60 * 1000))
                                
                                const eventIcons = {
                                    'policy_change': '🏛️',
                                    'trade_war': '⚔️',
                                    'tech_boom': '🚀',
                                    'natural_disaster': '🌪️',
                                    'oil_crisis': '🛢️'
                                }
                                
                                caption += `${eventIcons[event.type] || '📰'} *${event.name}*\n`
                                caption += `   Sisa Waktu: ${daysLeft} hari\n`
                                caption += `   Efek: `
                                
                                Object.entries(event.appliedEffects).forEach(([key, value]) => {
                                    const effect = value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)
                                    caption += `${key}: ${effect}% `
                                })
                                caption += `\n\n`
                            })
                        } else {
                            caption += `Tidak ada event ekonomi aktif saat ini.\n\n`
                            caption += `📅 *\`EVENT MENDATANG:\`*\n`
                            caption += `• Kemungkinan event baru: 5% per jam\n`
                            caption += `• Jenis event: Kebijakan, Perdagangan, Teknologi, Bencana, dll`
                        }
                        break
                    }

                    case 'indicators': {
                        const indicators = economicData.indicators
                        
                        caption = `📈 *\`INDIKATOR EKONOMI DETAIL\`*\n\n`
                        
                        caption += `💹 *\`MAKROEKONOMI:\`*\n`
                        caption += `• GDP Growth: ${indicators.gdpGrowth.toFixed(2)}%\n`
                        caption += `  ${indicators.gdpGrowth > 4 ? '▲ Pertumbuhan tinggi' : indicators.gdpGrowth > 2 ? '→ Pertumbuhan normal' : '▼ Pertumbuhan lambat'}\n\n`
                        
                        caption += `• Inflasi: ${indicators.inflation.toFixed(2)}%\n`
                        caption += `  ${indicators.inflation < 2 ? '▼ Di bawah target' : indicators.inflation < 4 ? '→ Dalam target' : '▲ Di atas target'}\n\n`
                        
                        caption += `• Pengangguran: ${indicators.unemployment.toFixed(2)}%\n`
                        caption += `  ${indicators.unemployment < 4 ? '▼ Sangat rendah' : indicators.unemployment < 6 ? '→ Normal' : '▲ Tinggi'}\n\n`
                        
                        caption += `• Suku Bunga: ${indicators.interestRate.toFixed(2)}%\n`
                        caption += `  ${indicators.interestRate < 3 ? '▼ Rendah (Stimulus)' : indicators.interestRate < 6 ? '→ Normal' : '▲ Tinggi (Restrictive)'}\n\n`
                        
                        caption += `🎯 *\`SENTIMEN:\`*\n`
                        caption += `• Kepercayaan Konsumen: ${indicators.consumerConfidence.toFixed(0)}/100\n`
                        caption += `• Sentimen Pasar: ${indicators.marketSentiment.toFixed(0)}/100\n\n`
                        
                        caption += `⏰ *\`UPDATE:\`* ${new Date(indicators.lastUpdate).toLocaleString('id-ID')}`
                        break
                    }

                    case 'impact': {
                        caption = `💰 *\`DAMPAK EKONOMI TERHADAP PAJAK\`*\n\n`
                        
                        const indicators = economicData.indicators
                        let totalImpact = 0
                        
                        caption += `📊 *\`ANALISIS FAKTOR:\`*\n\n`
                        
                        // GDP Impact
                        let gdpImpact = 0
                        if (indicators.gdpGrowth > 4.0) {
                            gdpImpact = -10
                            caption += `📈 GDP Tinggi (${indicators.gdpGrowth.toFixed(1)}%): -10%\n`
                        } else if (indicators.gdpGrowth < 1.0) {
                            gdpImpact = 20
                            caption += `📉 GDP Rendah (${indicators.gdpGrowth.toFixed(1)}%): +20%\n`
                        } else {
                            caption += `📊 GDP Normal (${indicators.gdpGrowth.toFixed(1)}%): 0%\n`
                        }
                        totalImpact += gdpImpact
                        
                        // Inflation Impact
                        let inflationImpact = 0
                        if (indicators.inflation > 4.0) {
                            inflationImpact = 15
                            caption += `🔥 Inflasi Tinggi (${indicators.inflation.toFixed(1)}%): +15%\n`
                        } else if (indicators.inflation < 1.0) {
                            inflationImpact = -5
                            caption += `❄️ Inflasi Rendah (${indicators.inflation.toFixed(1)}%): -5%\n`
                        } else {
                            caption += `🌡️ Inflasi Normal (${indicators.inflation.toFixed(1)}%): 0%\n`
                        }
                        totalImpact += inflationImpact
                        
                        // Unemployment Impact
                        let unemploymentImpact = 0
                        if (indicators.unemployment > 8.0) {
                            unemploymentImpact = 25
                            caption += `😰 Pengangguran Tinggi (${indicators.unemployment.toFixed(1)}%): +25%\n`
                        } else if (indicators.unemployment < 3.0) {
                            unemploymentImpact = -10
                            caption += `😊 Pengangguran Rendah (${indicators.unemployment.toFixed(1)}%): -10%\n`
                        } else {
                            caption += `👥 Pengangguran Normal (${indicators.unemployment.toFixed(1)}%): 0%\n`
                        }
                        totalImpact += unemploymentImpact
                        
                        // Consumer Confidence Impact
                        let confidenceImpact = 0
                        if (indicators.consumerConfidence < 50) {
                            confidenceImpact = 10
                            caption += `😞 Kepercayaan Rendah (${indicators.consumerConfidence.toFixed(0)}): +10%\n`
                        } else if (indicators.consumerConfidence > 80) {
                            confidenceImpact = -5
                            caption += `😊 Kepercayaan Tinggi (${indicators.consumerConfidence.toFixed(0)}): -5%\n`
                        } else {
                            caption += `😐 Kepercayaan Normal (${indicators.consumerConfidence.toFixed(0)}): 0%\n`
                        }
                        totalImpact += confidenceImpact
                        
                        caption += `\n🎯 *\`TOTAL DAMPAK:\`* ${totalImpact >= 0 ? '+' : ''}${totalImpact}%\n`
                        caption += `📋 *\`PAJAK AKHIR:\`* ${(currentTax * 100).toFixed(2)}%\n\n`
                        
                        const recommendation = totalImpact > 20 ? 
                            '⚠️ *REKOMENDASI:* Pajak tinggi, tunda transaksi besar' :
                            totalImpact < -10 ? 
                            '✅ *REKOMENDASI:* Pajak rendah, waktu baik untuk investasi' :
                            '📊 *REKOMENDASI:* Pajak normal, lakukan transaksi sesuai kebutuhan'
                        
                        caption += recommendation
                        break
                    }

                    default: {
                        caption = `🌍 *\`SISTEM EKONOMI GLOBAL\`*\n\n`
                        caption += `• Status: ${economicData.indicators.gdpGrowth > 3 ? '🟢 Sehat' : '🟡 Stabil'}\n`
                        caption += `• Pertumbuhan: ${economicData.indicators.gdpGrowth.toFixed(1)}%\n`
                        caption += `• Inflasi: ${economicData.indicators.inflation.toFixed(1)}%\n`
                        caption += `• Pajak Dinamis: ${(currentTax * 100).toFixed(2)}%\n\n`
                        
                        caption += `📋 *\`DAFTAR PERINTAH\`*\n\n`

                        caption += `*Contoh:* \`${prefix + command} status\`\n`
                        caption += `*Prefix:* \`${prefix}\`\n\n`

                        caption += `• \`${command} status\` - Status ekonomi lengkap\n`
                        caption += `• \`${command} indicators\` - Analisis indikator\n`
                        caption += `• \`${command} events\` - Event ekonomi aktif\n`
                        caption += `• \`${command} impact\` - Dampak terhadap pajak\n`
                        caption += `• \`tax\` - Lihat sistem pajak dinamis`
                        break
                    }
                }
            }

        } catch (error) {
            console.error('Error:', error)
            caption = `Terjadi kesalahan saat mengakses data ekonomi. Silakan coba lagi nanti.`
        }

        await conn.sendMessage(m.from, {  text: caption.trim() || 'Tidak ada data yang dapat ditampilkan.' })
    }
}