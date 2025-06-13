import { createCanvas } from 'canvas'
import { pajak } from '../../setting.js'
import { factionGovData, saveFactionUsers } from '../../lib/databases/faction.js'
import { getCurrentDateTime } from '../../lib/src/function.js'

export const cmd = {
    name: ['maps', 'travel', 'cuaca', 'hotel', 'passport', 'visa', 'world'],
    command: ['maps', 'travel', 'cuaca', 'hotel', 'passport', 'visa', 'world'],
    category: ['roleplay'],
    detail: {
        desc: 'Sistem peta dan perjalanan.'
    },
    setting: {
        isRegister: true,
        isBanned: false,
        isJail: false
    },
    async start({ m, db, prefix, command, conn, text }) {
        const user = db.users.get(m.sender)
        const currentLocation = user.playerLocation.city
        const dateTime = getCurrentDateTime()

        const locations = {
            'Los Angeles': {
                country: 'United States',
                state: 'California',
                type: 'Metropolis',
                population: '3.9M',
                facilities: ['Airport', 'Hospital', 'University', 'Police Station', 'Shopping Mall', 'Beach', 'Port'],
                specialties: ['Entertainment Industry', 'Tourism', 'Finance'],
                connections: {
                    'Toronto': { distance: 3500, methods: ['plane', 'car', 'bus'] },
                    'Las Vegas': { distance: 270, methods: ['walk', 'bike', 'car', 'bus', 'plane'] },
                    'New York': { distance: 3900, methods: ['plane'] },
                    'Miami': { distance: 3500, methods: ['plane'] }
                },
                color: '#ff6b6b'
            },
            'Toronto': {
                country: 'Canada',
                state: 'Ontario',
                type: 'City',
                population: '2.9M',
                facilities: ['Airport', 'CN Tower', 'University', 'Hospital', 'Subway System'],
                specialties: ['Finance', 'Technology', 'Education'],
                connections: {
                    'Los Angeles': { distance: 3500, methods: ['plane', 'car', 'bus'] },
                    'Las Vegas': { distance: 3200,methods: ['plane'] },
                    'New York': { distance: 550, methods: ['plane', 'car', 'bus'] }
                },
                color: '#4ecdc4'
            },
            'Las Vegas': {
                country: 'United States',
                state: 'Nevada',
                type: 'City',
                population: '650K',
                facilities: ['Casino', 'Airport', 'Hospital', 'Strip Club', 'Hotel'],
                specialties: ['Gambling', 'Entertainment', 'Tourism'],
                connections: {
                    'Los Angeles': { distance: 270, methods: ['walk', 'bike', 'car', 'bus', 'plane'] },
                    'Toronto': { distance: 3200, methods: ['plane'] },
                    'New York': { distance: 2200, methods: ['plane', 'car', 'bus'] }
                },
                color: '#ffd93d'
            },
            'New York': {
                country: 'United States',
                state: 'New York',
                type: 'Metropolis',
                population: '8.4M',
                facilities: ['Airport', 'Subway', 'Stock Exchange', 'Central Park', 'Hospital', 'University'],
                specialties: ['Finance', 'Media', 'Fashion', 'Arts'],
                connections: {
                    'Los Angeles': { distance: 3900, methods: ['plane'] },
                    'Miami': { distance: 1800, methods: ['plane', 'car', 'bus'] },
                    'London': { distance: 5500, methods: ['plane'] }
                },
                color: '#a8e6cf'
            },
            'London': {
                country: 'United Kingdom',
                state: 'England',
                type: 'Capital',
                population: '9.5M',
                facilities: ['Underground', 'Big Ben', 'Tower Bridge', 'Airport', 'Palace', 'Museum'],
                specialties: ['Finance', 'History', 'Culture', 'Education'],
                connections: {
                    'New York': { distance: 5500, methods: ['plane'] },
                    'Paris': { distance: 450, methods: ['plane', 'train'] },
                    'Amsterdam': { distance: 360, methods: ['plane', 'train'] }
                },
                color: '#74b9ff'
            },
            'Tokyo': {
                country: 'Japan',
                state: 'Tokyo',
                type: 'Capital',
                population: '14M',
                facilities: ['JR Train', 'Subway', 'Airport', 'Temple', 'Tech District', 'Hospital'],
                specialties: ['Technology', 'Anime', 'Gaming', 'Electronics'],
                connections: {
                    'Seoul': { distance: 1150, methods: ['plane'] },
                    'Shanghai': { distance: 1750, methods: ['plane'] },
                    'Los Angeles': { distance: 8800, methods: ['plane'] }
                },
                color: '#fd79a8'
            },
            'Miami': {
                country: 'United States',
                state: 'Florida',
                type: 'City',
                population: '470K',
                facilities: ['Airport', 'Beach', 'Port', 'Hospital', 'Nightclub'],
                specialties: ['Tourism', 'Cruise Hub', 'Nightlife'],
                connections: {
                    'Los Angeles': { distance: 3500, methods: ['plane'] },
                    'New York': { distance: 1800, methods: ['plane', 'car', 'bus'] }
                },
                color: '#00d2d3'
            },
            'Paris': {
                country: 'France',
                state: '-',
                type: 'Capital',
                population: '2.1M',
                facilities: ['Airport', 'Metro', 'Museum', 'Eiffel Tower', 'University', 'Cafe'],
                specialties: ['Fashion', 'Art', 'Cuisine', 'Tourism'],
                connections: {
                    'London': { distance: 450, methods: ['plane', 'train'] },
                    'Amsterdam': { distance: 510, methods: ['plane', 'train'] }
                },
                color: '#feca57'
            },
           'Amsterdam': {
                country: 'Netherlands',
                state: '-',
                type: 'Capital',
                population: '870K',
                facilities: ['Airport', 'Canal', 'Museum', 'University', 'Bike Paths'],
                specialties: ['Art', 'Cycling', 'Trade'],
                connections: {
                    'London': { distance: 360, methods: ['plane', 'train'] },
                    'Paris': { distance: 510, methods: ['plane', 'train'] }
                },
                color: '#1dd1a1'
            },
            'Seoul': {
                country: 'South Korea',
                state: '-',
                type: 'Capital',
                population: '9.7M',
                facilities: ['Subway', 'Airport', 'Palace', 'Hospital', 'Shopping District'],
                specialties: ['Technology', 'Pop Culture', 'Cuisine'],
                connections: {
                    'Tokyo': { distance: 1150, methods: ['plane'] },
                    'Shanghai': { distance: 870, methods: ['plane'] }
                },
                color: '#5f27cd'
            },
            'Shanghai': {
                country: 'China',
                state: '-',
                type: 'Metropolis',
                population: '24M',
                facilities: ['Airport', 'Metro', 'Port', 'Skyscraper', 'Museum'],
                specialties: ['Finance', 'Trade', 'Technology'],
                connections: {
                    'Tokyo': { distance: 1750, methods: ['plane'] },
                    'Seoul': { distance: 870, methods: ['plane'] }
                },
                color: '#222f3e'
            }
        }

        const weatherData = {
            'Los Angeles': { temp: 25, condition: 'Sunny', timezone: 'PST', humidity: 65 },
            'Toronto': { temp: 18, condition: 'Cloudy', timezone: 'EST', humidity: 78 },
            'Las Vegas': { temp: 32, condition: 'Hot', timezone: 'PST', humidity: 45 },
            'New York': { temp: 15, condition: 'Cloudy', timezone: 'EST', humidity: 70 },
            'London': { temp: 12, condition: 'Rainy', timezone: 'GMT', humidity: 85 },
            'Tokyo': { temp: 22, condition: 'Clear', timezone: 'JST', humidity: 60 },
            'Miami': { temp: 29, condition: 'Sunny', timezone: 'EST', humidity: 70 },
            'Paris': { temp: 20, condition: 'Partly Cloudy', timezone: 'CET', humidity: 65 },
            'Amsterdam': { temp: 16, condition: 'Cloudy', timezone: 'CET', humidity: 75 },
            'Seoul': { temp: 27, condition: 'Sunny', timezone: 'KST', humidity: 40 },
            'Shanghai': { temp: 28, condition: 'Humid', timezone: 'CST', humidity: 73 }
        }

        const hotelData = {
            'Los Angeles': [
                { name: 'Beverly Hills Hotel', rating: 5, price: 600, energyRestore: 100 },
                { name: 'Hollywood Inn', rating: 4, price: 350, energyRestore: 80 },
                { name: 'Budget Motel', rating: 3, price: 180, energyRestore: 60 }
            ],
            'Toronto': [
                { name: 'Royal York Hotel', rating: 4, price: 280, energyRestore: 75 },
                { name: 'Downtown Toronto Hotel', rating: 3, price: 200, energyRestore: 65 }
            ],
            'Las Vegas': [
                { name: 'Bellagio Resort', rating: 5, price: 700, energyRestore: 100 },
                { name: 'Strip Hotel', rating: 4, price: 450, energyRestore: 85 }
            ],
            'New York': [
                { name: 'Manhattan Plaza', rating: 5, price: 800, energyRestore: 100 },
                { name: 'Times Square Inn', rating: 3, price: 200, energyRestore: 70 }
            ],
            'London': [
                { name: 'Royal Hotel', rating: 5, price: 700, energyRestore: 100 },
                { name: 'Thames View', rating: 4, price: 350, energyRestore: 80 }
            ],
            'Tokyo': [
                { name: 'Tokyo Grand', rating: 5, price: 650, energyRestore: 100 },
                { name: 'Shibuya Hotel', rating: 4, price: 300, energyRestore: 75 }
            ],
            'Miami': [
                { name: 'Fontainebleau Miami Beach', rating: 5, price: 500, energyRestore: 100 },
                { name: 'Eden Roc Miami Beach', rating: 4, price: 320, energyRestore: 80 },
                { name: 'Miami Budget Inn', rating: 3, price: 120, energyRestore: 60 }
            ],
            'Paris': [
                { name: 'Le Meurice', rating: 5, price: 700, energyRestore: 100 },
                { name: 'Hotel Le Six', rating: 4, price: 350, energyRestore: 80 },
                { name: 'Ibis Paris', rating: 3, price: 150, energyRestore: 60 }
            ],
            'Amsterdam': [
                { name: 'Hotel Okura Amsterdam', rating: 5, price: 480, energyRestore: 100 },
                { name: 'NH Collection Amsterdam', rating: 4, price: 250, energyRestore: 80 },
                { name: 'The Student Hotel', rating: 3, price: 110, energyRestore: 60 }
            ],
            'Seoul': [
                { name: 'Signiel Seoul', rating: 5, price: 400, energyRestore: 100 },
                { name: 'Lotte City Hotel', rating: 4, price: 200, energyRestore: 80 },
                { name: 'Seoul Backpackers', rating: 3, price: 70, energyRestore: 60 }
            ],
            'Shanghai': [
                { name: 'The Peninsula Shanghai', rating: 5, price: 550, energyRestore: 100 },
                { name: 'Radisson Blu Shanghai', rating: 4, price: 260, energyRestore: 80 },
                { name: 'Shanghai Fish Inn', rating: 3, price: 90, energyRestore: 60 }
            ]
        }

        const visaRequirements = {
            'United States': ['United Kingdom', 'Japan', 'Canada', 'France', 'Netherlands', 'South Korea', 'China'],
            'United Kingdom': ['United States', 'Japan', 'Canada', 'France', 'Netherlands', 'South Korea', 'China'],
            'Japan': ['United States', 'United Kingdom', 'Canada', 'France', 'Netherlands', 'South Korea', 'China'],
            'Canada': ['United States', 'United Kingdom', 'Japan', 'France', 'Netherlands', 'South Korea', 'China'],
            'France': ['United States', 'United Kingdom', 'Japan', 'Canada', 'Netherlands', 'South Korea', 'China'],
            'Netherlands': ['United States', 'United Kingdom', 'Japan', 'Canada', 'France', 'South Korea', 'China'],
            'South Korea': ['United States', 'United Kingdom', 'Japan', 'Canada', 'France', 'Netherlands', 'China'],
            'China': ['United States', 'United Kingdom', 'Japan', 'Canada', 'France', 'Netherlands', 'South Korea']
        }

        const travelEncounters = [
            { type: 'bonus', message: 'Kamu menemukan uang di jalan.', reward: { uang: 100 } },
            { type: 'bonus', message: 'Seorang turis memberikan tip.', reward: { uang: 50 } },
            { type: 'energy', message: 'Kamu menemukan minuman energi gratis.', reward: { energy: 20 } },
            { type: 'neutral', message: 'Perjalanan berjalan lancar tanpa kejadian khusus.', reward: {} }
        ]

        function getWeatherRecommendation(temp) {
            if (temp < 10) return '🧥 Jaket tebal, sarung tangan'
            if (temp < 20) return '🧥 Jaket ringan, celana panjang'
            if (temp < 30) return '👕 Kaos, celana pendek'
            return '🩱 Pakaian tipis, topi, sunscreen'
        }

        function checkPassportAndVisa(user, destination) {
            const destCountry = locations[destination].country
            const currentCountry = locations[user.playerLocation.city].country

            if (destCountry === currentCountry) return {
                valid: true
            }

            if (!user.playerInventory.items.passport) {
                return {
                    valid: false,
                    reason: 'passport',
                    message: `🛂 *\`TRAVEL RESTRICTION\`*\nPaspor diperlukan untuk perjalanan internasional.\n\nGunakan: \`${prefix}passport buy\``
                }
            }

            const passportExpiry = new Date(user.playerInventory.items.passport.expiryDate)
            if (passportExpiry < new Date()) {
                return {
                    valid: false,
                    reason: 'passport_expired',
                    message: `🛂 *\`TRAVEL RESTRICTION\`*\nPaspor kamu telah kedaluwarsa.\n\nGunakna: \`${prefix}passport buy\``
                }
            }

            const needsVisa = visaRequirements[destCountry]?.includes(currentCountry)
            const visaKey = `visa_${destCountry.replace(' ', '_').toLowerCase()}`

            if (needsVisa && !user.playerInventory.items[visaKey]) {
                return {
                    valid: false,
                    reason: 'visa',
                    message: `🛂 *\`TRAVEL RESTRICTION\`*\nVisa diperlukan untuk ${destCountry}.\n\nGunakan: \`${prefix}visa ${destCountry.replace(' ', '_').toLowerCase()}\``
                }
            }

            if (needsVisa && user.playerInventory.items[visaKey]) {
                const visa = user.playerInventory.items[visaKey]
                if (typeof visa === 'object' && visa.validUntil) {
                    const visaExpiry = new Date(visa.validUntil)
                    if (visaExpiry < new Date()) {
                        return {
                            valid: false,
                            reason: 'visa_expired',
                            message: `🛂 *\`TRAVEL RESTRICTION\`*\nVisa ${destCountry} kamu telah kedaluwarsa.\n\nGunakan: \`${prefix}visa ${destCountry.replace(' ', '_').toLowerCase()}\``
                        }
                    }
                }
            }

            return {
                valid: true
            }
        }

        function getRandomEncounter() {
            return travelEncounters[Math.floor(Math.random() * travelEncounters.length)]
        }

        const args = text ? text.toLowerCase().split(' ') : []
        const isTravel = command === 'travel'

        if (command === 'cuaca') {
            const targetCity = text ? Object.keys(locations).find(key =>
                key.toLowerCase().includes(text.toLowerCase())
            ) : currentLocation

            if (!targetCity || !weatherData[targetCity]) {
                conn.sendMessage(m.from, { text: `Kota '${text || 'unknown'}' tidak ditemukan..` })
                return
            }

            const weather = weatherData[targetCity]
            const recommendation = getWeatherRecommendation(weather.temp)

            let caption = `🌤️ *\`CUACA ${targetCity.toUpperCase()}\`*\n\n`
            caption += `• *Suhu:* ${weather.temp}°C\n`
            caption += `• *Kondisi:* ${weather.condition}\n`
            caption += `• *Kelembaban:* ${weather.humidity}%\n`
            caption += `• *Timezone:* ${weather.timezone}\n\n`
            caption += `• *Rekomendasi Pakaian:*\n${recommendation}\n\n`

            if (weather.temp > 30) caption += `*Peringatan:* Cuaca sangat panas!`
            if (weather.condition === 'Rainy') caption += `*Tips:* Bawa payung!`

            conn.sendMessage(m.from, { text: caption.trim() })
            return
        }

        if (command === 'hotel') {
            const hotels = hotelData[currentLocation] || []

            if (hotels.length === 0) {
                conn.sendMessage(m.from, { text: `Tidak ada hotel tersedia di ${currentLocation}.` })
                return
            }

            if (text && text.includes('book')) {
                const hotelIndex = parseInt(text.split(' ')[1]) - 1
                const hotel = hotels[hotelIndex]

                if (!hotel) {
                    conn.sendMessage(m.from, { text: `Hotel tidak ditemukan. Gunakan nomor 1-${hotels.length}` })
                    return
                }

                if (user.playerInventory.items.uang < hotel.price) {
                    conn.sendMessage(m.from, { text: `Uang tidak cukup. Kamu butuh $${hotel.price}.` })
                    return
                }

                const updates = {
                    playerInfo: {
                        ...user.playerInfo,
                        energy: Math.min(100, user.playerInfo.energy + hotel.energyRestore)
                    },
                    playerInventory: {
                        ...user.playerInventory,
                        items: {
                            ...user.playerInventory.items,
                            uang: user.playerInventory.items.uang - hotel.price
                        }
                    }
                }

                db.users.update(m.sender, updates)
                db.save()

                let caption = `✅ *\`BOOKING BERHASIL\`*\n\n`
                caption += `• Hotel: ${hotel.name}\n`
                caption += `• Rating: ${'⭐'.repeat(hotel.rating)}\n`
                caption += `• Biaya: $${hotel.price}\n`
                caption += `• Energy Restored: +${hotel.energyRestore}\n\n`
                caption += `• Selamat beristirahat!\n`
                caption += `• Energy sekarang: ${updates.playerInfo.energy}/100`

                conn.sendMessage(m.from, { text: caption.trim() })
                return
            }

            let caption = `🏨 *\`HOTEL DI ${currentLocation.toUpperCase()}\`*\n\n`

            hotels.forEach((hotel, index) => {
                const canAfford = user.playerInventory.items.uang >= hotel.price ? '✅' : '❌'
                caption += `${index + 1}. ${canAfford} *${hotel.name}*\n`
                caption += `   • Rating: ${'⭐'.repeat(hotel.rating)}\n`
                caption += `   • Harga: $${hotel.price}/malam\n`
                caption += `   • Energy: +${hotel.energyRestore}\n\n`
            })

            caption += `*Cara booking:*\n`
            caption += `*Contoh:* \`${prefix + command} book [nomor]\`\n`
            caption += `*Prefix:* \`${prefix}\``

            conn.sendMessage(m.from, { text: caption.trim() })
            return
        }

        if (command === 'passport') {
            const cost = 5000
            const costPajak = cost + (pajak * cost)

            if (text === 'buy' || text === 'beli') {
                if (user.playerInventory.items.passport) {
                    conn.sendMessage(m.from, { text: 'Kamu sudah memiliki passport.' })
                    return
                }

                if (user.playerInventory.items.uang < 500) {
                    conn.sendMessage(m.from, { text: `Uang tidak cukup. Kamu butuh $${costPajak}.`  })
                    return
                }

                const updates = {
                    playerInventory: {
                        ...user.playerInventory,
                        items: {
                            ...user.playerInventory.items,
                            uang: user.playerInventory.items.uang - costPajak,
                            passport: {
                                number: 'P' + Math.random().toString(36).substr(2, 8).toUpperCase(),
                                issueDate: new Date().toLocaleDateString(),
                                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                                nationality: locations[user.playerLocation.city].country
                            },
                            passportStamps: []
                        }
                    }
                }

                if (!factionGovData.Storage) {
                    factionGovData.Storage = {
                        balance: 0,
                        transactions: []
                    }
                }

                factionGovData.Storage.transactions.push({
                    type: 'passport',
                    amount: costPajak,
                    by: user.PlayerInfo.namaLengkap,
                    role: user.playerStatus.pekerjaan[0],
                    date: `${dateTime.date} ${dateTime.time}`,
                    timestamp: dateTime.timestamp
                })

                factionGovData.Storage.balance += costPajak

                saveFactionUsers(factionGovData)

                db.users.update(m.sender, updates)
                db.save()

                let caption = `✅ *\`PASPOR BERHASIL DITERBITKAN\`*\n`
                caption += `*Detail Paspor:*\n`
                caption += `• Nomor: ${updates.playerInventory.items.passport.number}\n`
                caption += `• Tanggal Terbit: ${updates.playerInventory.items.passport.issueDate}\n`
                caption += `• Berlaku Hingga: ${updates.playerInventory.items.passport.expiryDate}\n`
                caption += `• Kewarganegaraan: ${updates.playerInventory.items.passport.nationality}\n`
                caption += `• Dikeluarkan oleh: International Travel Authority\n\n`

                caption += `• Biaya: $${costPajak} _(termasuk pajak)_\n`
                caption += `• Status: Aktif & Valid`

                conn.sendMessage(m.from, { text: caption.trim() })
                return
            }

            if (!user.playerInventory.items.passport) {
                let caption = `📘 *\`PASSPORT APPLICATION\`*\n`
                caption += `*Status:* No Passpor\n\n`
                caption += `*\`Keuntungan Paspor:\`*\n`
                caption += `• Perjalanan Internasional\n`
                caption += `• Pendaftaran Visa\n`
                caption += `• Penyeberangan Perbatasan\n`
                caption += `• Koleksi Stamps Perjalanan\n\n`

                caption += `• *Biaya:* $${costPajak} _(termasuk pajak)_\n`
                caption += `• *Validitas:* 10 Tahun\n`
                caption += `• *Proses:* Instan\n\n`

                caption += `*Cara Mendaftar:*\n`
                caption += `${prefix + command} buy`

                conn.sendMessage(m.from, { text: caption.trim() })
                return
            }

            const passport = user.playerInventory.items.passport
            const stamps = user.playerInventory.items.passportStamps || []

            let caption = `📘 *\`PASPOR KAMU\`*\n`
            caption += `• *Nomor Paspor:* ${passport.number}\n`
            caption += `• *Tanggal Terbit:* ${passport.issueDate}\n`
            caption += `• *Berlaku Hingga:* ${passport.expiryDate}\n`
            caption += `• *Kewarganegaraan:* ${passport.nationality}\n`
            caption += `• *Dikeluarkan oleh:* International Travel Authority\n\n`

            caption += `• *Status:* Aktif & Valid\n`
            caption += `• *Negara Dikunjungi:* ${stamps.length}\n\n`

            if (stamps.length > 0) {
                caption += `🗺️ *\`TRAVEL STAMPS\`*\n`

                stamps.slice(-5).forEach((stamp, index) => {
                    const countryEmoji = {
                        'United States': '🇺🇸',
                        'United Kingdom': '🇬🇧',
                        'Japan': '🇯🇵',
                        'Canada': '🇨🇦',
                        'France': '🇫🇷',
                        'Netherlands': '🇳🇱',
                        'South Korea': '🇰🇷',
                        'China': '🇨🇳'
                    } [stamp.country] || '🌍'

                    caption += `• ${countryEmoji} ${stamp.country} ${stamp.date}\n`
                    caption += `- ${stamp.city}\n`
                })

                if (stamps.length > 5) {
                    caption += `\n... dan ${stamps.length - 5} stamps lainnya`
                }
            } else {
                caption += `*Belum ada stamps perjalanan.*\n`
                caption += `Mulai perjalanan kamu untuk mengumpulkan stamps.`
            }

            conn.sendMessage(m.from, { text: caption.trim() })
            return
        }

        if (command === 'visa') {
            const availableVisas = [
                { key: 'united_states', display: 'United States', price: 700, emoji: '🇺🇸' },
                { key: 'united_kingdom', display: 'United Kingdom', price: 750, emoji: '🇬🇧' },
                { key: 'japan', display: 'Japan', price: 680, emoji: '🇯🇵' },
                { key: 'canada', display: 'Canada', price: 650, emoji: '🇨🇦' },
                { key: 'france', display: 'France', price: 690, emoji: '🇫🇷' },
                { key: 'netherlands', display: 'Netherlands', price: 670, emoji: '🇳🇱' },
                { key: 'south_korea', display: 'South Korea', price: 660, emoji: '🇰🇷' },
                { key: 'china', display: 'China', price: 720, emoji: '🇨🇳' }
            ]

            if (text) {
                const selectedVisa = availableVisas.find(visa =>
                    text.toLowerCase().includes(visa.key.replace('_', ' ')) ||
                    text.toLowerCase().includes(visa.key)
                )

                if (selectedVisa) {
                    const visaKey = `visa_${selectedVisa.key}`

                    if (user.playerInventory.items[visaKey]) {
                        conn.sendMessage(m.from, { text: `Kamu sudah memiliki visa ${selectedVisa.display}.` })
                        return
                    }

                    if (user.playerInventory.items.uang < selectedVisa.price) {
                        conn.sendMessage(m.from, { text: `Uang tidak cukup. Visa ${selectedVisa.display} membutuhkan $${selectedVisa.price}` })
                        return
                    }

                    const updates = {
                        playerInventory: {
                            ...user.playerInventory,
                            items: {
                                ...user.playerInventory.items,
                                uang: user.playerInventory.items.uang - selectedVisa.price,
                                [visaKey]: {
                                    country: selectedVisa.display,
                                    issueDate: new Date().toLocaleDateString(),
                                    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                                    type: 'Tourist Visa'
                                }
                            }
                        }
                    }

                    db.users.update(m.sender, updates)
                    db.save()

                    let caption = `✅ *\`VISA BERHASIL DITERBITKAN\`*\n\n`
                    caption += `${selectedVisa.emoji} *${selectedVisa.display} Tourist Visa*\n\n`
                    caption += `• Tanggal Terbit: ${updates.playerInventory.items[visaKey].issueDate}\n`
                    caption += `• Berlaku Hingga: ${updates.playerInventory.items[visaKey].validUntil}\n`
                    caption += `• Biaya: $${selectedVisa.price}\n`
                    caption += `• Status: Aktif\n\n`
                    caption += `Sekarang kamu bisa masuk ke ${selectedVisa.display} tanpa hambatan.`

                    conn.sendMessage(m.from, { text: caption.trim() })
                    return
                }
            }

            let caption = `*\`•══ 🌍 VISA SERVICES 🌍══•\`*\n`
            caption += `Fast • Reliable • Worldwide\n\n`

            caption += `🎫 *Tipe Visa Tersedia:*\n\n`

            availableVisas.forEach((visa, index) => {
                const hasVisa = user.playerInventory.items[`visa_${visa.key}`] ? '✅' : '❌'
                const canAfford = user.playerInventory.items.uang >= visa.price ? '💰' : '💸'

                caption += `${index + 1}. ${hasVisa} ${canAfford} ${visa.emoji} *${visa.display}*\n`
                caption += `   • Harga: $${visa.price}\n`
                caption += `   • Validitas: 1 Tahun\n`
                caption += `   • Tipe: Tourist Visa\n\n`
            })

            caption += `*Proses Pendaftaran:*\n`
            caption += `• *Contoh:* \`${prefix + command} united_states\`\n`
            caption += `• *Prefix:* \`${prefix}\`\n\n`

            caption += `*Syarat:*\n`
            caption += `• Paspor Valid\n`
            caption += `• Dana Mencukupi\n`
            caption += `• Catatan Perjalanan Bersih`

            conn.sendMessage(m.from, { text: caption.trim() })
            return
        }

        if (command === 'world') {
            const weather = weatherData[currentLocation]
            const hasPassport = user.playerInventory.items.passport ? '✅' : '❌'

            let caption = `🎯 *\`TRAVEL DASHBOARD\`*\n`
            caption += `• Nama: ${user.playerInfo.namaLengkap}\n`
            caption += `• Paspor: ${hasPassport}\n`

            caption += `\n🚀 *\`DAFTAR PERINTAH\`*\n`
            caption += `• \`maps\` - Peta dunia\n`
            caption += `• \`travel\` - Perjalanan\n`
            caption += `• \`cuaca\` - Info cuaca\n`
            caption += `• \`hotel\` - Daftar hotel\n`
            caption += `• \`passport\` - Info passport\n`
            caption += `• \`visa\` - Daftar visa\n\n`

            caption += `📊 *\`STATUS SAAT INI\`*\n`
            caption += `• Lokasi: ${currentLocation}\n`
            caption += `• Negara: ${locations[currentLocation].country}\n`
            caption += `• Energy: ${user.playerInfo.energy}/100\n`
            caption += `• Uang: $${user.playerInventory.items.uang.toLocaleString()}\n`
            caption += `• Cuaca: ${weather.temp}°C, ${weather.condition}`

            conn.sendMessage(m.from, { text: caption.trim() })
            return
        }

        if (isTravel && args.length >= 2) {
            const destination = args[0]
            const method = args[1]

            const destinationKey = Object.keys(locations).find(key =>
                key.toLowerCase().includes(destination) ||
                locations[key].country.toLowerCase().includes(destination)
            )

            if (destinationKey && locations[currentLocation] && locations[currentLocation].connections[destinationKey]) {
                const travelInfo = locations[currentLocation].connections[destinationKey]
                const destInfo = locations[destinationKey]

                if (!travelInfo.methods.includes(method)) {
                    let caption = `Metode transportasi '${method}' tidak tersedia untuk rute ini.\n\n`
                    caption += `*Metode yang tersedia:*\n`
                    travelInfo.methods.forEach(m => caption += `• ${m}\n`)

                    conn.sendMessage(m.from, { text: caption.trim() })
                    return
                }

                const passportCheck = checkPassportAndVisa(user, destinationKey)
                if (!passportCheck.valid) {
                    conn.sendMessage(m.from, { text: passportCheck.message })
                    return
                }

                let cost = 0, stamina = 0, time = 0, methodName = ''

                switch (method) {
                    case 'walk':
                        methodName = 'Jalan Kaki'
                        time = Math.ceil(travelInfo.distance / 5)
                        cost = 0
                        stamina = travelInfo.distance * 2
                        break
                    case 'bike':
                        methodName = 'Sepeda'
                        time = Math.ceil(travelInfo.distance / 15)
                        cost = 0
                        stamina = travelInfo.distance * 1
                        break
                    case 'car':
                        methodName = 'Mobil'
                        time = Math.ceil(travelInfo.distance / 80)
                        cost = travelInfo.distance * 500
                        stamina = Math.ceil(travelInfo.distance / 10)
                        break
                    case 'bus':
                        methodName = 'Bus'
                        time = Math.ceil(travelInfo.distance / 60)
                        cost = travelInfo.distance * 200
                        stamina = Math.ceil(travelInfo.distance / 20)
                        break
                    case 'train':
                        methodName = 'Kereta'
                        time = Math.ceil(travelInfo.distance / 120)
                        cost = travelInfo.distance * 300
                        stamina = Math.ceil(travelInfo.distance / 50)
                        break
                    case 'plane':
                        methodName = 'Pesawat'
                        time = Math.ceil(travelInfo.distance / 800)
                        cost = travelInfo.distance * 1000
                        stamina = Math.ceil(travelInfo.distance / 100)
                        break
                    case 'boat':
                        methodName = 'Kapal'
                        time = Math.ceil(travelInfo.distance / 30)
                        cost = travelInfo.distance * 400
                        stamina = Math.ceil(travelInfo.distance / 30)
                        break
                }

                if (user.playerInventory.items.uang < cost) {
                    conn.sendMessage(m.from, { text: `Uang tidak cukup. Kamu butuh $${cost.toLocaleString()}` })
                    return
                }

                if (user.playerInfo.energy < stamina) {
                    conn.sendMessage(m.from, { text: `Energy tidak cukup. kamu butuh ${stamina} energy.` })
                    return
                }

                const encounter = getRandomEncounter()
                const destCountry = locations[destinationKey].country
                const currentCountry = locations[currentLocation].country

                const encounterReward = encounter.reward
                const updates = {
                    playerLocation: {
                        city: destinationKey,
                        country: destInfo.country,
                        street: 'Central District',
                        houseNumber: 0,
                        postalCode: 0
                    },
                    playerInfo: {
                        ...user.playerInfo,
                        energy: Math.max(0, Math.min(100, user.playerInfo.energy - stamina + (encounterReward.energy || 0)))
                    },
                    playerInventory: {
                        ...user.playerInventory,
                        items: {
                            ...user.playerInventory.items,
                            uang: Math.max(0, user.playerInventory.items.uang - cost + (encounterReward.uang || 0))
                        }
                    }
                }

                if (destCountry !== currentCountry && user.playerInventory.items.passport) {
                    const stamps = user.playerInventory.items.passportStamps || []
                    stamps.push({
                        country: destCountry,
                        city: destinationKey,
                        date: new Date().toLocaleDateString()
                    })
                    updates.playerInventory.items.passportStamps = stamps
                }

                db.users.update(m.sender, updates)
                db.save()

                let caption = `✅ *\`PERJALANAN BERHASIL\`*\n\n`
                caption += `Kamu telah berpergian dengan ${methodName}\n`
                caption += `• Dari: ${currentLocation}\n`
                caption += `• Tujuan: ${destinationKey}\n`
                caption += `• Jarak: ${travelInfo.distance} km\n`
                caption += `• Waktu Tempuh: ${time} jam\n`
                caption += `• Biaya: $${cost.toLocaleString()}\n`
                caption += `• Energy Terpakai: ${stamina}\n\n`

                caption += `🎲 *\`ENCOUNTER REWARD\`*\n`
                caption += `${encounter.message}\n`
                if (encounterReward.uang) caption += `• Bonus uang: +$${encounterReward.uang}\n`
                if (encounterReward.energy) caption += `• Bonus energy: +${encounterReward.energy}\n`
                caption += `\n`

                if (destCountry !== currentCountry) {
                    caption += `• *Passport Stamp:* ${destCountry} ✅\n\n`
                }

                caption += `🎯 *\`STATUS SETELAH PERJALANAN\`*\n`
                caption += `• Lokasi: ${destinationKey}\n`
                caption += `• Energy: ${updates.playerInfo.energy}/100\n`
                caption += `• Uang: $${updates.playerInventory.items.uang.toLocaleString()}\n\n`

                caption += `*Selamat datang di ${destinationKey}.*\n`
                caption += `${destInfo.map}\n\n`
                caption += `• Cuaca: ${weatherData[destinationKey].temp}°C, ${weatherData[destinationKey].condition}`

                conn.sendMessage(m.from, { text: caption.trim() })
                return
            } else {
                let caption = `❌ *\`TUJUAN TIDAK DITEMUKAN\`*\n\n`
                caption += `Tujuan '${destination}' tidak ditemukan atau tidak dapat dicapai dari ${currentLocation}.\n\n`
                caption += `Gunakan: \`${prefix}maps\` untuk melihat tujuan yang tersedia.`

                conn.sendMessage(m.from, { text: caption.trim() })
                return
            }
        }

        if (command === 'maps' && args[0]) {
            const destination = text.toLowerCase()
            const destinationKey = Object.keys(locations).find(key =>
                key.toLowerCase().includes(destination) ||
                locations[key].country.toLowerCase().includes(destination)
            )

            if (destinationKey && locations[currentLocation] && locations[currentLocation].connections[destinationKey]) {
                const travelInfo = locations[currentLocation].connections[destinationKey]
                const destInfo = locations[destinationKey]

                let caption = `🗺️ *\`PERJALANAN KE ${destinationKey.toUpperCase()}\`*\n\n`
                caption += `• Dari: ${currentLocation}\n`
                caption += `• Tujuan: ${destinationKey}\n`
                caption += `• Jarak: ${travelInfo.distance} km\n`
                caption += `• Negara: ${destInfo.country}\n`
                caption += `• Wilayah: ${destInfo.state}\n\n`

                caption += `🚶‍♂️ *\`METODE PERJALANAN\`*\n`

                travelInfo.methods.forEach((method, index) => {
                    let icon, name, time, cost, stamina

                    switch (method) {
                        case 'walk':
                            icon = '🚶‍♂️'
                            name = 'Jalan Kaki'
                            time = Math.ceil(travelInfo.distance / 5)
                            cost = 0
                            stamina = travelInfo.distance * 2
                            break
                        case 'bike':
                            icon = '🚲'
                            name = 'Sepeda'
                            time = Math.ceil(travelInfo.distance / 15)
                            cost = 0
                            stamina = travelInfo.distance * 1
                            break
                        case 'car':
                            icon = '🚗'
                            name = 'Mobil'
                            time = Math.ceil(travelInfo.distance / 80)
                            cost = travelInfo.distance * 500
                            stamina = Math.ceil(travelInfo.distance / 10)
                            break
                        case 'bus':
                            icon = '🚌'
                            name = 'Bus'
                            time = Math.ceil(travelInfo.distance / 60)
                            cost = travelInfo.distance * 200
                            stamina = Math.ceil(travelInfo.distance / 20)
                            break
                        case 'train':
                            icon = '🚄'
                            name = 'Kereta'
                            time = Math.ceil(travelInfo.distance / 120)
                            cost = travelInfo.distance * 300
                            stamina = Math.ceil(travelInfo.distance / 50)
                            break
                        case 'plane':
                            icon = '✈️'
                            name = 'Pesawat'
                            time = Math.ceil(travelInfo.distance / 800)
                            cost = travelInfo.distance * 1000
                            stamina = Math.ceil(travelInfo.distance / 100)
                            break
                        case 'boat':
                            icon = '⛵'
                            name = 'Kapal'
                            time = Math.ceil(travelInfo.distance / 30)
                            cost = travelInfo.distance * 400
                            stamina = Math.ceil(travelInfo.distance / 30)
                            break
                    }

                    const canAfford = user.playerInventory.items.uang >= cost
                    const hasEnergy = user.playerInfo.energy >= stamina
                    const status = canAfford && hasEnergy ? '✅' : '❌'

                    caption += `${index + 1}. ${status} ${icon} *${name}*\n`
                    caption += `   • Waktu: ${time} jam\n`
                    caption += `   • Biaya: ${cost.toLocaleString()}\n`
                    caption += `   • Stamina: -${stamina}\n\n`
                })

                caption += `\n🛣️ *\`TUJUAN TERSEDIA\`*\n`
                Object.entries(locations[destinationKey].connections).forEach(([dest, info], index) => {
                    const destData = locations[dest]
                    caption += `${index + 1}. 🏙️ *${dest}*\n`
                    caption += `   • Jarak: ${info.distance} km\n`
                    caption += `   • Negara: ${destData.country}\n`
                    caption += `   • Metode: ${info.methods.length} pilihan\n\n`
                })

                caption += `Pastikan kamu memiliki cukup energy dan uang untuk perjalanan.\n`
                caption += `   Gunakan: \`${prefix}travel ${destinationKey} [metode]\` untuk melakukan perjalanan.\n`
                caption += `   Contoh: \`${prefix}travel ${destinationKey} plane\``

                const cityInfo = await cityCanvas(destinationKey, locations[destinationKey])

                await conn.sendMessage(m.from, {
                image: cityInfo,
                caption: caption
            })
                return
            }
        }

        if (!text && command === 'maps') {
            const currentLocationData = locations[currentLocation]

            try {
                const worldMap = await mapWG(currentLocation, locations)

                let locInfo = `🗺️ *\`GOOMILE MAPS\`*\n\n`
                locInfo += `• *Lokasi Saat Ini: ${currentLocation.toUpperCase()}*\n\n`
                locInfo += `*Informasi Kota:*\n`
                locInfo += `• Negara: ${currentLocationData.country}\n`
                locInfo += `• Provinsi: ${currentLocationData.state}\n`
                locInfo += `• Tipe: ${currentLocationData.type}\n`
                locInfo += `• Populasi: ${currentLocationData.population}\n\n`
                locInfo += `• *Daftar Perintah:*\n• \`${prefix}maps [kota] - Info detail\`\n`
                locInfo += `• \`${prefix}travel [kota] [metode]\` - Perjalanan\n\n`
                locInfo += `⚡ Status: Energy ${user.playerInfo.energy}/100 | 💰 $${user.playerInventory.items.uang.toLocaleString()}`

                await conn.sendMessage(m.from, { image: worldMap, caption: locInfo })
                return
            } catch (error) {
                console.error('Error creating world map:', error)
            }
        }
    }
}

async function mapWG(currentLocation, locations) {
    const canvas = createCanvas(800, 600)
    const ctx = canvas.getContext('2d')
    
    // Ocean background dengan gradient
    const oceanGradient = ctx.createRadialGradient(400, 300, 0, 400, 300, 500)
    oceanGradient.addColorStop(0, '#1e3a8a') // Deep blue
    oceanGradient.addColorStop(0.5, '#1e40af') // Medium blue
    oceanGradient.addColorStop(1, '#1e293b') // Dark blue-gray
    ctx.fillStyle = oceanGradient
    ctx.fillRect(0, 0, 800, 600)
    
    // Water texture effect dengan ripple
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * 800
        const y = Math.random() * 600
        const size = Math.random() * 1 + 0.5
        const opacity = Math.random() * 0.3 + 0.1
        
        ctx.fillStyle = `rgba(135, 206, 235, ${opacity})`
        ctx.beginPath()
        ctx.arc(x, y, size, 0, 2 * Math.PI)
        ctx.fill()
    }
    
    // Function untuk membuat tekstur daratan
    function drawLandMass(points, color = '#22c55e', shadowColor = '#16a34a') {
        // Shadow/depth effect
        ctx.save()
        ctx.translate(2, 2)
        ctx.fillStyle = shadowColor
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        points.forEach(point => ctx.lineTo(point.x, point.y))
        ctx.closePath()
        ctx.fill()
        ctx.restore()
        
        // Main land mass dengan gradient
        const landGradient = ctx.createLinearGradient(
            Math.min(...points.map(p => p.x)), 
            Math.min(...points.map(p => p.y)),
            Math.max(...points.map(p => p.x)), 
            Math.max(...points.map(p => p.y))
        )
        landGradient.addColorStop(0, color)
        landGradient.addColorStop(0.3, '#16a34a') // Forest green
        landGradient.addColorStop(0.6, '#15803d') // Darker green
        landGradient.addColorStop(1, '#166534') // Deep green
        
        ctx.fillStyle = landGradient
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        points.forEach(point => ctx.lineTo(point.x, point.y))
        ctx.closePath()
        ctx.fill()
        
        // Coastline detail
        ctx.strokeStyle = '#0f766e'
        ctx.lineWidth = 1
        ctx.stroke()
        
        // Terrain texture
        points.forEach(point => {
            if (Math.random() < 0.1) {
                ctx.fillStyle = `rgba(34, 197, 94, ${Math.random() * 0.3 + 0.2})`
                ctx.beginPath()
                ctx.arc(point.x + (Math.random() - 0.5) * 20, point.y + (Math.random() - 0.5) * 20, Math.random() * 3 + 1, 0, 2 * Math.PI)
                ctx.fill()
            }
        })
    }
    
    const northAmerica = [
        {x: 50, y: 150}, {x: 80, y: 130}, {x: 120, y: 140}, {x: 150, y: 160},
        {x: 200, y: 180}, {x: 250, y: 190}, {x: 280, y: 200}, {x: 300, y: 220},
        {x: 310, y: 250}, {x: 300, y: 280}, {x: 290, y: 320}, {x: 280, y: 360},
        {x: 270, y: 400}, {x: 250, y: 440}, {x: 220, y: 460}, {x: 180, y: 470},
        {x: 140, y: 465}, {x: 100, y: 450}, {x: 70, y: 420}, {x: 50, y: 380},
        {x: 40, y: 340}, {x: 35, y: 300}, {x: 30, y: 260}, {x: 35, y: 220},
        {x: 45, y: 180}
    ]
    drawLandMass(northAmerica, '#22c55e', '#16a34a')
    
    const europe = [
        {x: 420, y: 180}, {x: 450, y: 170}, {x: 480, y: 175}, {x: 510, y: 185},
        {x: 530, y: 200}, {x: 540, y: 220}, {x: 545, y: 250}, {x: 540, y: 280},
        {x: 530, y: 310}, {x: 510, y: 330}, {x: 480, y: 340}, {x: 450, y: 335},
        {x: 425, y: 320}, {x: 410, y: 300}, {x: 405, y: 270}, {x: 410, y: 240},
        {x: 415, y: 210}
    ]
    drawLandMass(europe, '#10b981', '#059669')
    
    const asia = [
        {x: 540, y: 160}, {x: 580, y: 150}, {x: 620, y: 155}, {x: 660, y: 165},
        {x: 700, y: 175}, {x: 730, y: 190}, {x: 750, y: 210}, {x: 760, y: 240},
        {x: 755, y: 270}, {x: 745, y: 300}, {x: 730, y: 330}, {x: 710, y: 350},
        {x: 680, y: 365}, {x: 650, y: 370}, {x: 620, y: 365}, {x: 590, y: 350},
        {x: 570, y: 330}, {x: 555, y: 300}, {x: 550, y: 270}, {x: 545, y: 240},
        {x: 540, y: 210}, {x: 538, y: 180}
    ]
    drawLandMass(asia, '#059669', '#047857')
    
    ctx.shadowColor = '#00d4ff'
    ctx.shadowBlur = 20
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('🌍 WORLD MAP 🌍', 400, 50)
    ctx.shadowBlur = 0
    
    // Define city position dengan layout sesuai benua
    const cityPositions = {
        'Los Angeles': { x: 150, y: 350, region: 'America' },
        'Toronto': { x: 200, y: 200, region: 'America' },
        'Las Vegas': { x: 120, y: 380, region: 'America' },
        'New York': { x: 250, y: 300, region: 'America' },
        'Miami': { x: 265, y: 410, region: 'America' },
        'London': { x: 450, y: 250, region: 'Europe' },
        'Paris': { x: 480, y: 300, region: 'Europe' },
        'Amsterdam': { x: 470, y: 220, region: 'Europe' },
        'Tokyo': { x: 700, y: 200, region: 'Asia' },
        'Seoul': { x: 680, y: 180, region: 'Asia' },
        'Shanghai': { x: 650, y: 250, region: 'Asia' }
    }
    
    // Glow region label effect
    const regionColors = {
        'America': '#ff6b6b',
        'Europe': '#4ecdc4', 
        'Asia': '#ffd93d'
    }
    
    ctx.font = 'bold 20px Arial'
    ctx.shadowBlur = 15
    
    ctx.shadowColor = regionColors['America']
    ctx.fillStyle = regionColors['America']
    ctx.fillText('🌎 AMERICA', 200, 120)
    
    ctx.shadowColor = regionColors['Europe']
    ctx.fillStyle = regionColors['Europe']
    ctx.fillText('🌍 EUROPE', 450, 120)
    
    ctx.shadowColor = regionColors['Asia']
    ctx.fillStyle = regionColors['Asia']
    ctx.fillText('🌏 ASIA', 650, 120)
    
    ctx.shadowBlur = 0
    
    // Gradient dan glow connection lines
    Object.entries(locations).forEach(([cityName, cityData]) => {
        const cityPos = cityPositions[cityName]
        if (!cityPos) return
        
        Object.keys(cityData.connections || {}).forEach(connectedCity => {
            const connectedPos = cityPositions[connectedCity]
            if (!connectedPos) return
            
            // Gradient line
            const lineGradient = ctx.createLinearGradient(
                cityPos.x, cityPos.y, 
                connectedPos.x, connectedPos.y
            )
            lineGradient.addColorStop(0, cityData.color || '#00d4ff')
            lineGradient.addColorStop(1, locations[connectedCity]?.color || '#00d4ff')
            
            // Glow effect untuk connection lines
            ctx.shadowColor = '#00d4ff'
            ctx.shadowBlur = 5
            ctx.strokeStyle = lineGradient
            ctx.lineWidth = 2
            ctx.setLineDash([5, 5])
            
            ctx.beginPath()
            ctx.moveTo(cityPos.x, cityPos.y)
            ctx.lineTo(connectedPos.x, connectedPos.y)
            ctx.stroke()
            
            ctx.setLineDash([])
            ctx.shadowBlur = 0
        })
    })
    
    Object.entries(cityPositions).forEach(([cityName, pos]) => {
        const isCurrentLocation = cityName === currentLocation
        const cityData = locations[cityName]
        const cityColor = cityData?.color || '#00d4ff'
        
        // Pulsing effect untuk current location
        if (isCurrentLocation) {
            // Outer glow ring
            ctx.shadowColor = '#ff4757'
            ctx.shadowBlur = 30
            ctx.beginPath()
            ctx.arc(pos.x, pos.y, 20, 0, 2 * Math.PI)
            ctx.strokeStyle = 'rgba(255, 71, 87, 0.5)'
            ctx.lineWidth = 3
            ctx.stroke()
            ctx.shadowBlur = 0
        }
        
        // City circle dengan gradient
        const cityGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, isCurrentLocation ? 15 : 10)
        cityGradient.addColorStop(0, cityColor)
        cityGradient.addColorStop(1, isCurrentLocation ? '#ff4757' : cityColor)
        
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, isCurrentLocation ? 15 : 10, 0, 2 * Math.PI)
        ctx.fillStyle = cityGradient
        ctx.fill()
        
        // Glow Border
        ctx.shadowColor = cityColor
        ctx.shadowBlur = 10
        ctx.strokeStyle = isCurrentLocation ? '#ffffff' : cityColor
        ctx.lineWidth = isCurrentLocation ? 4 : 3
        ctx.stroke()
        ctx.shadowBlur = 0
        
        // City name dengan styling
        ctx.fillStyle = '#ffffff'
        ctx.font = isCurrentLocation ? 'bold 14px Arial' : 'bold 11px Arial'
        ctx.textAlign = 'center'
        ctx.shadowColor = '#000000'
        ctx.shadowBlur = 3
        ctx.fillText(cityName, pos.x, pos.y + 35)
        ctx.shadowBlur = 0
        
        // Current location indicator dengan animation effect
        if (isCurrentLocation) {
            ctx.fillStyle = '#ff4757'
            ctx.font = 'bold 12px Arial'
            ctx.shadowColor = '#ff4757'
            ctx.shadowBlur = 10
            ctx.fillText('↡ YOU ARE HERE', pos.x, pos.y - 30)
            ctx.shadowBlur = 0
        }
        
        // Population indicator sebagai small badge
        if (cityData) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(pos.x - 20, pos.y + 45, 40, 15)
            ctx.fillStyle = '#ffffff'
            ctx.font = '8px Arial'
            ctx.fillText(cityData.population, pos.x, pos.y + 55)
        }
    })
    
    // Legend dengan styling modern
    const legendBg = ctx.createLinearGradient(0, 520, 0, 580)
    legendBg.addColorStop(0, 'rgba(0, 0, 0, 0.8)')
    legendBg.addColorStop(1, 'rgba(0, 0, 0, 0.9)')
    ctx.fillStyle = legendBg
    ctx.fillRect(0, 520, 800, 80)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('↡ = Current Location', 30, 550)
    ctx.fillText('🔵 = Available Destinations', 30, 570)
    ctx.fillText('- - - = Travel Routes', 350, 550)
    ctx.fillText('👥 = Population', 350, 570)
    
    return canvas.toBuffer('image/png')
}

async function cityCanvas(cityName, cityData) {
    const canvas = createCanvas(700, 500)
    const ctx = canvas.getContext('2d')
    
    const mainGradient = ctx.createLinearGradient(0, 0, 0, 500)
    mainGradient.addColorStop(0, '#2c3e50')
    mainGradient.addColorStop(0.5, '#34495e')
    mainGradient.addColorStop(1, '#2c3e50')
    ctx.fillStyle = mainGradient
    ctx.fillRect(0, 0, 700, 500)
    
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * 700
        const y = Math.random() * 500
        const size = Math.random() * 3 + 1
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`
        ctx.beginPath()
        ctx.arc(x, y, size, 0, 2 * Math.PI)
        ctx.fill()
    }
    
    ctx.shadowColor = cityData.color || '#ecf0f1'
    ctx.shadowBlur = 20
    ctx.strokeStyle = cityData.color || '#ecf0f1'
    ctx.lineWidth = 4
    ctx.strokeRect(15, 15, 670, 470)
    ctx.shadowBlur = 0
    
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px Arial'
    ctx.textAlign = 'center'
    ctx.shadowColor = cityData.color || '#ffffff'
    ctx.shadowBlur = 20
    ctx.fillText(`🏙️ ${cityName.toUpperCase()}`, 350, 70)
    ctx.shadowBlur = 0
    
    ctx.font = 'bold 18px Arial'
    ctx.fillStyle = cityData.color || '#ecf0f1'
    ctx.fillText(`${cityData.country} • ${cityData.state}`, 350, 100)
    
    const facilities = cityData.facilities || []
    const facilityIcons = {
        'Airport': '✈️', 'Hospital': '🏥', 'University': '📚', 
        'Police Station': '🚔', 'Shopping Mall': '🛍️', 'Beach': '🏖️', 
        'Port': '🚢', 'Casino': '🎰', 'Hotel': '🏨', 'Subway': '🚇', 
        'Stock Exchange': '📈', 'Central Park': '🌳', 'Big Ben': '🕰️', 
        'Tower Bridge': '🌉', 'Palace': '🏰', 'Museum': '🏛️', 
        'Underground': '🚇', 'JR Train': '🚄', 'Temple': '🏯', 
        'Tech District': '📱', 'CN Tower': '🗼', 'Subway System': '🚇', 
        'Strip Club': '🎭', 'Nightclub': '🎉', 'Canal': '🚤', 
        'Bike Paths': '🚴', 'Shopping District': '🛒', 'Skyscraper': '🏙️', 
        'Cafe': '☕', 'Cruise Hub': '🛳️'
    }
    
    const cols = 4
    const startX = 120
    const startY = 150
    const spacingX = 140
    const spacingY = 80
    
    facilities.forEach((facility, index) => {
        const row = Math.floor(index / cols)
        const col = index % cols
        const x = startX + (col * spacingX)
        const y = startY + (row * spacingY)
        
        const icon = facilityIcons[facility] || '🏢'
        
        const cardGradient = ctx.createLinearGradient(x - 50, y - 25, x + 50, y + 25)
        cardGradient.addColorStop(0, `${cityData.color || '#3498db'}40`)
        cardGradient.addColorStop(1, `${cityData.color || '#3498db'}20`)
        
        ctx.fillStyle = cardGradient
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
        ctx.shadowBlur = 10
        ctx.fillRect(x - 50, y - 25, 100, 50)
        ctx.shadowBlur = 0
        
        ctx.strokeStyle = cityData.color || '#3498db'
        ctx.lineWidth = 2
        ctx.strokeRect(x - 50, y - 25, 100, 50)
        
        ctx.fillStyle = '#ffffff'
        ctx.font = '24px Arial'
        ctx.textAlign = 'center'
        ctx.shadowColor = '#000000'
        ctx.shadowBlur = 5
        ctx.fillText(icon, x, y + 5)
        ctx.shadowBlur = 0
        
        ctx.font = 'bold 10px Arial'
        ctx.fillStyle = '#ffffff'
        ctx.fillText(facility, x, y + 35)
    })
    
    const infoPanelGradient = ctx.createLinearGradient(0, 380, 0, 450)
    infoPanelGradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)')
    infoPanelGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)')
    ctx.fillStyle = infoPanelGradient
    ctx.fillRect(30, 380, 640, 70)
    
    ctx.strokeStyle = cityData.color || '#ecf0f1'
    ctx.lineWidth = 2
    ctx.strokeRect(30, 380, 640, 70)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`👥 Population: ${cityData.population}`, 50, 410)
    ctx.fillText(`🏛️ Type: ${cityData.type}`, 350, 410)
    
    const specialties = cityData.specialties || []
    ctx.font = 'bold 14px Arial'
    ctx.fillStyle = cityData.color || '#ecf0f1'
    ctx.fillText(`🎯 Specialties: ${specialties.join(' • ')}`, 50, 435)
    
    ctx.fillStyle = cityData.color || '#3498db'
    ctx.beginPath()
    ctx.arc(650, 50, 15, 0, 2 * Math.PI)
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.stroke()
    
    return canvas.toBuffer('image/png')
}