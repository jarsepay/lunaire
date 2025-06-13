import fs from 'fs'
import axios from 'axios'
import path from 'path'
import { fileURLToPath } from 'url'
import { getRandomElement, formatTime } from '../src/function.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const characterCachePath = path.join(__dirname, '../../json/character_waifu.json')

const DATING_DATA = {
    locations: [
        'taman kota yang indah', 'pantai saat sunset', 'kafe cozy di sudut kota',
        'festival musim semi', 'aquarium besar', 'museum seni modern',
        'taman hiburan', 'restoran mewah', 'perpustakaan yang tenang',
        'observatorium', 'kebun binatang', 'pasar malam tradisional'
    ],
    reasons: [
        'ingin menghabiskan waktu bersamamu', 'merindukan senyummu',
        'ada tempat baru yang ingin kukunjungi bersamamu', 'cuaca hari ini sempurna untuk berkencan',
        'sudah lama kita tidak quality time', 'ingin membuat kenangan baru'
    ],
    outfits: [
        'dress putih simpel dengan cardigan', 'yukata tradisional dengan motif bunga',
        'rok pendek dengan blouse lucu', 'kimono casual warna pastel',
        'sweater oversized dengan celana jeans', 'seifuku sekolah favoritmu'
    ],
    gifts: [
        'buket bunga sakura', 'coklat buatan sendiri', 'boneka kecil yang lucu',
        'aksesoris rambut cantik', 'novel romantis', 'parfum dengan aroma lembut',
        'gelang friendship', 'polaroid foto kenangan'
    ],
    moods: {
        happy: ['senang sekali!', 'bahagia banget!', 'excited!', 'gembira!'],
        shy: ['agak malu...', 'deg-degan nih...', 'nervous tapi senang...'],
        excited: ['ga sabar!', 'pengen cepet!', 'excited banget!'],
        romantic: ['romantis banget...', 'bikin baper...', 'sweet sekali...']
    }
}

const INTERACTION_DATA = {
    kiss: {
        minExp: 100,
        cooldown: 30 * 60 * 1000, // 30 menit
        expGain: 15,
        responses: [
            '*blush* Kyaa... kamu tiba-tiba aja...',
            'Hmm... rasanya manis... *menutup mata*',
            'Jantungku berdebar kencang... *peluk erat*',
            'Kamu bikin aku malu deh... tapi aku suka...',
            '*muka merah* Peringatan dong sebelumnya!'
        ]
    },
    hug: {
        minExp: 50,
        cooldown: 15 * 60 * 1000, // 15 menit
        expGain: 10,
        responses: [
            '*peluk balik* Hangat sekali pelukanmu...',
            'Aku butuh pelukan ini... terima kasih...',
            '*menenggelamkan wajah di dadamu* Nyaman...',
            'Pelukan terbaik sedunia! *squeeze*',
            'Jangan lepas dulu ya... *peluk erat*'
        ]
    },
    fuck: {
        minExp: 500,
        cooldown: 60 * 60 * 1000, // 1 jam
        expGain: 50,
        responses: [
            '*muka merah parah* Kamu... kamu jahat...',
            'Hmm... intensnya... *gigit bibir*',
            'Aku... aku ga bisa mikir yang lain...',
            '*nafas terengah* Kamu bikin aku lemes...',
            'Jangan berhenti... *mata berkaca-kaca*'
        ]
    },
    date: {
        minExp: 200,
        cooldown: 2 * 60 * 60 * 1000, // 2 jam
        expGain: 25
    }
}

const STATIC_CHARACTERS = {
    'makima': {
        id: 'makima_001',
        name: 'Makima',
        anime: 'Chainsaw Man',
        image: 'https://cdn.myanimelist.net/images/characters/7/494601.jpg',
        description: 'Makima adalah Devil Hunter yang misterius dan berkuasa. Dia memiliki kemampuan mengendalikan devils dan manusia...',
        type: 'waifu'
    },
    'zero two': {
        id: 'zerotwo_001', 
        name: 'Zero Two',
        anime: 'Darling in the FranXX',
        image: 'https://cdn.myanimelist.net/images/characters/2/350323.jpg',
        description: 'Zero Two adalah hybrid manusia-klaxosaur dengan tanduk merah muda. Dia energik, bebas, dan sangat protektif...',
        type: 'waifu'
    },
    'marin': {
        id: 'marin_001',
        name: 'Marin Kitagawa', 
        anime: 'Sono Bisque Doll wa Koi wo Suru',
        image: 'https://cdn.myanimelist.net/images/characters/4/457745.jpg',
        description: 'Marin adalah siswi SMA yang ceria dan suka cosplay. Dia sangat passionate tentang anime dan manga...',
        type: 'waifu'
    },
    'nezuko': {
        id: 'nezuko_001',
        name: 'Nezuko Kamado',
        anime: 'Kimetsu no Yaiba', 
        image: 'https://cdn.myanimelist.net/images/characters/3/392943.jpg',
        description: 'Nezuko adalah adik Tanjiro yang berubah menjadi demon tapi masih mempertahankan kemanusiaannya...',
        type: 'waifu'
    },
    'mai': {
        id: 'mai_001',
        name: 'Mai Sakurajima',
        anime: 'Seishun Buta Yarou wa Bunny Girl Senpai no Yume wo Minai',
        image: 'https://cdn.myanimelist.net/images/characters/2/371542.jpg',
        description: 'Mai adalah aktris dan model terkenal yang mengalami Adolescence Syndrome. Dia tsundere tapi caring...',
        type: 'waifu'
    },
    'rem': {
        id: 'rem_001',
        name: 'Rem',
        anime: 'Re:Zero kara Hajimeru Isekai Seikatsu',
        image: 'https://cdn.myanimelist.net/images/characters/9/317305.jpg',
        description: 'Rem adalah maid demon dengan rambut biru. Dia setia, penyayang, dan sangat mencintai Subaru...',
        type: 'waifu'
    },
    'chika': {
        id: 'chika_001',
        name: 'Chika Fujiwara',
        anime: 'Kaguya-sama wa Kokurasetai',
        image: 'https://cdn.myanimelist.net/images/characters/7/376435.jpg',
        description: 'Chika adalah anggota student council yang ceria dan innocent. Dia suka bermain dan sangat ekspresif...',
        type: 'waifu'
    },
    
    'gojo': {
        id: 'gojo_001',
        name: 'Gojo Satoru',
        anime: 'Jujutsu Kaisen',
        image: 'https://cdn.myanimelist.net/images/characters/15/422168.jpg',
        description: 'Gojo adalah guru di Tokyo Jujutsu High dan penyihir terkuat. Dia percaya diri, playful, tapi sangat peduli...',
        type: 'husbu'
    },
    'levi': {
        id: 'levi_001',
        name: 'Levi Ackerman', 
        anime: 'Shingeki no Kyojin',
        image: 'https://cdn.myanimelist.net/images/characters/2/241413.jpg',
        description: 'Levi adalah Captain terkuat di Survey Corps. Dia pendiam, disiplin, tapi memiliki hati yang lembut...',
        type: 'husbu'
    },
    'tanjiro': {
        id: 'tanjiro_001',
        name: 'Tanjiro Kamado',
        anime: 'Kimetsu no Yaiba',
        image: 'https://cdn.myanimelist.net/images/characters/5/392939.jpg',
        description: 'Tanjiro adalah demon slayer yang baik hati dan peduli. Dia berjuang menyelamatkan adiknya Nezuko...',
        type: 'husbu'
    },
    'deku': {
        id: 'deku_001',
        name: 'Izuku Midoriya',
        anime: 'Boku no Hero Academia',
        image: 'https://cdn.myanimelist.net/images/characters/7/299404.jpg',
        description: 'Deku adalah hero yang bermimpi menyelamatkan semua orang. Dia gigih, baik hati, dan tidak pernah menyerah...',
        type: 'husbu'
    },
    'itadori': {
        id: 'itadori_001',
        name: 'Yuji Itadori',
        anime: 'Jujutsu Kaisen', 
        image: 'https://cdn.myanimelist.net/images/characters/9/416600.jpg',
        description: 'Itadori adalah siswa yang menjadi vessel untuk Raja Kutukan Sukuna. Dia ceria, kuat, dan sangat loyal...',
        type: 'husbu'
    },
    'senku': {
        id: 'senku_001',
        name: 'Senku Ishigami',
        anime: 'Dr. Stone',
        image: 'https://cdn.myanimelist.net/images/characters/2/394247.jpg',
        description: 'Senku adalah genius scientist yang ingin membangun kembali peradaban dengan sains. Dia logis dan sangat pintar...',
        type: 'husbu'
    }
}

const MOOD_SYSTEM = {
    moods: {
        happy: {
            name: 'Senang',
            emoji: '😊',
            duration: 2 * 60 * 60 * 1000, // 2 jam
            expMultiplier: 1.2,
            responses: [
                'Aku lagi senang banget nih! *senyum manis*',
                'Hari ini rasanya indah sekali~',
                'Kamu bikin aku bahagia terus!'
            ]
        },
        excited: {
            name: 'Excited',
            emoji: '🤩',
            duration: 1 * 60 * 60 * 1000, // 1 jam
            expMultiplier: 1.3,
            responses: [
                'Kyaa! Aku excited banget!',
                'Ga sabar deh pengen ngapain aja sama kamu!',
                'Energy aku lagi full nih!'
            ]
        },
        romantic: {
            name: 'Romantis',
            emoji: '💕',
            duration: 3 * 60 * 60 * 1000, // 3 jam
            expMultiplier: 1.5,
            responses: [
                'Rasanya pengen deketin kamu terus...',
                'Jantung aku berdebar kencang nih...',
                'Kamu bikin aku malu tapi senang...'
            ]
        },
        sad: {
            name: 'Sedih',
            emoji: '😢',
            duration: 4 * 60 * 60 * 1000, // 4 jam
            expMultiplier: 0.7,
            responses: [
                'Aku lagi sedih nih... bisa temani aku ga?',
                'Rasanya pengen nangis...',
                'Kamu masih sayang sama aku kan?'
            ]
        },
        angry: {
            name: 'Kesal',
            emoji: '😠',
            duration: 2 * 60 * 60 * 1000, // 2 jam
            expMultiplier: 0.5,
            responses: [
                'Hmph! Aku lagi kesal nih!',
                'Kamu jahat banget sih!',
                'Ga mau ngomong sama kamu!'
            ]
        },
        sleepy: {
            name: 'Ngantuk',
            emoji: '😴',
            duration: 8 * 60 * 60 * 1000, // 8 jam (malam)
            expMultiplier: 0.8,
            responses: [
                'Aku ngantuk... *yawn*',
                'Boleh ga aku tidur di pangkuanmu?',
                'Mata aku udah berat nih...'
            ]
        }
    }
}

const GIFT_SYSTEM = {
    gifts: {
        'bunga': {
            name: 'Buket Bunga',
            emoji: '💐',
            price: 50,
            mood: 'happy',
            expBonus: 5,
            rarity: 'common',
            responses: [
                'Wah! Bunganya cantik banget! Makasih ya~',
                'Aku suka banget sama bunga! *peluk*',
                'Harum sekali... seperti perasaanku ke kamu~'
            ]
        },
        'coklat': {
            name: 'Coklat Handmade',
            emoji: '🍫',
            price: 75,
            mood: 'excited',
            expBonus: 8,
            rarity: 'common',
            responses: [
                'Coklat buatan sendiri? Kyaa! Romantis banget!',
                'Manis... tapi ga semanis kamu~',
                'Aku bakal simpen ini baik-baik!'
            ]
        },
        'boneka': {
            name: 'Boneka Lucu',
            emoji: '🧸',
            price: 100,
            mood: 'happy',
            expBonus: 10,
            rarity: 'uncommon',
            responses: [
                'Lucu banget! Aku bakal tidur sama boneka ini~',
                'Mirip kaya kamu... imut dan menggemaskan!',
                'Makasih ya! Aku bakal jaga boneka ini!'
            ]
        },
        'perhiasan': {
            name: 'Perhiasan Cantik',
            emoji: '💎',
            price: 200,
            mood: 'romantic',
            expBonus: 20,
            rarity: 'rare',
            responses: [
                'Indah sekali! Kamu punya selera yang bagus~',
                'Aku bakal pake ini setiap hari!',
                'Mahal banget ini... aku ga nyangka...'
            ]
        },
        'cincin': {
            name: 'Cincin Janji',
            emoji: '💍',
            price: 500,
            mood: 'romantic',
            expBonus: 50,
            rarity: 'legendary',
            responses: [
                'Cincin? Ini... ini artinya...? *muka merah*',
                'Aku... aku mau jadi milik kamu selamanya!',
                'Kyaa! Aku ga nyangka hari ini akan datang!'
            ]
        }
    }
}

const EVENT_SYSTEM = {
    events: {
        birthday: {
            name: 'Ulang Tahun',
            duration: 24 * 60 * 60 * 1000, // 24 jam
            expMultiplier: 2.0,
            specialGift: 'kue_ulang_tahun',
            story: (waifu) => `
🎂 *\`ULANG TAHUN ${waifu.name.toUpperCase()}\`*

"Eh? Kamu inget ulang tahun aku?" *mata berkaca-kaca*

Hari ini adalah hari spesial ${waifu.name}! Dia bangun pagi dengan senyum yang lebih cerah dari biasanya. Ternyata, dia sudah menunggu apakah kamu akan mengingat hari istimewanya.

"Makasih ya udah inget... aku pikir kamu lupa..." *peluk erat*

Kamu memberikan kejutan kecil untuknya, dan dia terlihat sangat bahagia. Hari ini, semua interaksi dengan ${waifu.name} akan memberikan EXP double!

🎉 *BONUS ULANG TAHUN AKTIF!*
• EXP dari semua interaksi x2
• Mood otomatis jadi "Happy"
• Berlaku selama 24 jam
            `
        },
        anniversary: {
            name: 'Anniversary',
            duration: 24 * 60 * 60 * 1000,
            expMultiplier: 1.5,
            specialGift: 'foto_kenangan',
            story: (waifu, days) => `
💕 *\`ANNIVERSARY ${days} HARI BERSAMA\`*

"Udah ${days} hari ya kita bersama..." *senyum nostalgia*

${waifu.name} mengeluarkan album foto kecil berisi kenangan kalian berdua. Dari pertama kali bertemu, kencan pertama, sampai momen-momen manis yang pernah kalian lalui bersama.

"Waktu cepet banget ya... tapi aku bahagia bisa kenal kamu..."

Dia memelukmu erat, dan kamu bisa merasakan kehangatan perasaannya. Hari ini adalah hari untuk merayakan perjalanan cinta kalian.

🎊 *BONUS ANNIVERSARY AKTIF!*
• EXP dari semua interaksi +50%
• Unlock memori khusus
• Berlaku selama 24 jam
            `
        },
        valentine: {
            name: 'Valentine Day',
            duration: 24 * 60 * 60 * 1000,
            expMultiplier: 1.8,
            specialGift: 'love_letter',
            story: (waifu) => `
💌 *\`VALENTINE'S DAY\`*

"Hari kasih sayang..." *muka memerah*

${waifu.name} terlihat lebih malu dari biasanya. Dia menggenggam sesuatu di belakang punggungnya, seperti menyembunyikan sesuatu.

"Ini... ini buat kamu..." *memberikan surat cinta*

Surat yang ditulis tangan dengan hati-hati, berisi perasaan terdalam ${waifu.name}. Kamu bisa merasakan betapa tulus perasaannya kepadamu.

"Aku... aku sayang banget sama kamu..."

💝 *BONUS VALENTINE AKTIF!*
• EXP dari semua interaksi +80%
• Mood otomatis jadi "Romantic"
• Unlock interaksi khusus
            `
        }
    }
}

const MINI_GAMES = {
    suitGame: {
        name: 'Suit (Batu Gunting Kertas)',
        cooldown: 10 * 60 * 1000, // 10 menit
        winReward: { exp: 15, money: 25 },
        loseReward: { exp: 5, money: 10 },
        drawReward: { exp: 8, money: 15 },
        responses: {
            win: [
                'Eh? Aku kalah... kamu hebat banget!',
                'Aww... aku ga beruntung hari ini...',
                'Kamu pinter main suit ya~'
            ],
            lose: [
                'Yeay! Aku menang! *loncat-loncat*',
                'Hehe~ aku beruntung nih!',
                'Kamu kalah! Harus traktir aku ya~'
            ],
            draw: [
                'Wah seri! Kita kompak banget ya~',
                'Hehe sama-sama jago nih!',
                'Satu lagi yuk!'
            ]
        }
    },
    guessGame: {
        name: 'Tebak Angka',
        cooldown: 15 * 60 * 1000, // 15 menit
        winReward: { exp: 25, money: 40 },
        loseReward: { exp: 10, money: 15 },
        responses: {
            win: [
                'Wah! Kamu bisa nebak angka yang aku pikirin!',
                'Hebat banget! Kamu bisa baca pikiran aku ya?',
                'Amazing! Kamu pinter banget!'
            ],
            lose: [
                'Hehe~ angka yang aku pikirin itu ${answer}!',
                'Ga kena! Coba lagi ya~',
                'Aku menang! Kamu harus kiss aku sebagai hukuman~'
            ]
        }
    }
}

const RELATIONSHIP_LEVELS = {
    1: { name: 'Stranger', exp: 0, unlocks: ['hug'] },
    2: { name: 'Acquaintance', exp: 50, unlocks: ['gift'] },
    3: { name: 'Friend', exp: 100, unlocks: ['kiss', 'game'] },
    4: { name: 'Close Friend', exp: 200, unlocks: ['date'] },
    5: { name: 'Crush', exp: 350, unlocks: ['confession'] },
    6: { name: 'Dating', exp: 500, unlocks: ['fuck', 'sleepover'] },
    7: { name: 'Couple', exp: 750, unlocks: ['proposal'] },
    8: { name: 'Engaged', exp: 1000, unlocks: ['wedding'] },
    9: { name: 'Married', exp: 1500, unlocks: ['honeymoon'] },
    10: { name: 'Soulmate', exp: 2000, unlocks: ['all'] }
}

class CharacterManager {
    constructor() {
        this.cache = this.loadCache()
        this.initializeStaticData()
    }

    loadCache() {
        try {
            if (fs.existsSync(characterCachePath)) {
                return JSON.parse(fs.readFileSync(characterCachePath, 'utf-8'))
            }
            return { characters: {}, lastUpdate: 0 }
        } catch (e) {
            return { characters: {}, lastUpdate: 0 }
        }
    }

    saveCache() {
        try {
            const dir = path.dirname(characterCachePath)
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true })
            }
            
            fs.writeFileSync(characterCachePath, JSON.stringify(this.cache, null, 2))
        } catch (e) {
            console.log('Error saving character cache:', e)
        }
    }

    initializeStaticData() {
        this.cache.characters = { ...STATIC_CHARACTERS, ...this.cache.characters }
        this.saveCache()
    }

    async searchWeebAPI(query) {
        try {
            const staticResults = this.searchStatic(query)
            if (staticResults.length > 0) {
                return staticResults
            }

            const searchUrl = `https://weeb-api.vercel.app/character?search=${encodeURIComponent(query)}`
            
            const response = await axios.get(searchUrl, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; AnimeBot/1.0)'
                }
            })

            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                const characters = response.data.slice(0, 5).map(char => ({
                    id: char.id ? char.id.toString() : Math.random().toString(36).substr(2, 9),
                    name: char.name?.full || char.name?.native || 'Unknown',
                    anime: this.extractAnimeTitle(char),
                    image: char.imageUrl || char.image || '',
                    description: this.cleanDescription(char.description) || 'Tidak ada deskripsi.',
                    age: char.age || '-',
                    gender: char.gender || '-',
                    bloodType: char.bloodType || '-',
                    dateOfBirth: char.dateOfBirth || '-',
                    url: char.siteUrl || '',
                    type: this.determineCharacterType(char)
                }))

                characters.forEach(char => {
                    this.cache.characters[char.name.toLowerCase()] = char
                })
                this.saveCache()

                return characters
            }

            return []
        } catch (e) {
            console.log('Weeb API search error:', e.message)
            return this.searchStatic(query)
        }
    }

    extractAnimeTitle(char) {
        if (char.anime) {
            if (Array.isArray(char.anime) && char.anime.length > 0) {
                return char.anime[0].title || char.anime[0].name || char.anime[0]
            }
            if (typeof char.anime === 'string') {
                return char.anime
            }
            if (char.anime.title) {
                return char.anime.title
            }
        }
        
        // Fallback to media field if available
        if (char.media && Array.isArray(char.media) && char.media.length > 0) {
            return char.media[0].title || char.media[0].name || '-'
        }
        
        return '-'
    }

    cleanDescription(description) {
        if (!description) return null
        
        let cleaned = description
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/__(.*?)__/g, '$1')     // Remove underline
            .replace(/~!(.*?)!~/g, '')       // Remove spoiler tags
            .replace(/\n{3,}/g, '\n\n')      // Reduce multiple newlines
            .trim()

        if (cleaned.length > 300) {
            cleaned = cleaned.substring(0, 300) + '...'
        }

        return cleaned
    }

    determineCharacterType(char) {
        if (char.gender) {
            return char.gender.toLowerCase() === 'female' ? 'waifu' : 'husbu'
        }
        return 'character'
    }

    searchStatic(query) {
        const results = []
        const searchQuery = query.toLowerCase()
        
        for (const [key, char] of Object.entries(STATIC_CHARACTERS)) {
            if (char.name.toLowerCase().includes(searchQuery) || 
                key.includes(searchQuery) || 
                char.anime.toLowerCase().includes(searchQuery)) {
                results.push(char)
            }
        }
        
        return results.slice(0, 5)
    }

    async getCharacterDetails(characterData) {
        try {
            if (characterData.id && STATIC_CHARACTERS[Object.keys(STATIC_CHARACTERS).find(k => STATIC_CHARACTERS[k].id === characterData.id)]) {
                return characterData
            }

            if (characterData.description) {
                return {
                    name: characterData.name,
                    image: characterData.image,
                    description: characterData.description,
                    anime: characterData.anime,
                    url: characterData.url || '',
                    type: characterData.type || 'character',
                    age: characterData.age,
                    gender: characterData.gender,
                    bloodType: characterData.bloodType
                }
            }

            return characterData
        } catch (e) {
            console.log('Character details error:', e)
            return characterData
        }
    }

    getRandomCharacters(count = 5, type = null) {
        const chars = Object.values(STATIC_CHARACTERS)
        const filtered = type ? chars.filter(c => c.type === type) : chars
        
        const shuffled = filtered.sort(() => 0.5 - Math.random())
        return shuffled.slice(0, count)
    }
}

function canInteract(user, interactionType) {
    const interaction = INTERACTION_DATA[interactionType]
    if (!interaction) return { can: false, reason: 'Interaksi tidak valid' }

    const waifu = user.playerStatus.waifu
    if (!hasValidWaifu(user)) return { can: false, reason: 'Kamu belum punya waifu/husbu.' }

    if (interactionType === 'hug') {
        const lastInteraction = waifu.interactions[interactionType] || 0
        const timePassed = Date.now() - lastInteraction
        
        if (timePassed < interaction.cooldown) {
            const remaining = interaction.cooldown - timePassed
            return { can: false, reason: `Tunggu ${formatTime(remaining)} lagi.` }
        }
        
        return { can: true }
    }

    if (waifu.exp < interaction.minExp) {
        return { can: false, reason: `Butuh minimal ${interaction.minExp} exp untuk interaksi ini.` }
    }

    const lastInteraction = waifu.interactions[interactionType] || 0
    const timePassed = Date.now() - lastInteraction
    
    if (timePassed < interaction.cooldown) {
        const remaining = interaction.cooldown - timePassed
        return { can: false, reason: `Tunggu ${formatTime(remaining)} lagi.` }
    }

    return { can: true }
}

async function generateDatingStory(waifu) {
    const timeOfDay = ['pagi', 'siang', 'malam'][Math.floor(Math.random() * 3)]
    const location = getRandomElement(DATING_DATA.locations)
    const reason = getRandomElement(DATING_DATA.reasons)
    const outfit = getRandomElement(DATING_DATA.outfits)
    const gift = getRandomElement(DATING_DATA.gifts)
    const mood = getRandomElement(DATING_DATA.moods.happy)

    const story = `
🌸 *\`Kencan dengan ${waifu.name}\`*

*${timeOfDay.toUpperCase()} HARI INI*

*Ting!* Hp kamu bunyi, ada pesan dari ${waifu.name}:

"Hai sayang! ${reason} nih... Gimana kalau kita ke ${location} ${timeOfDay} ini? Aku udah siap-siap pakai ${outfit} lho~ 💕"

*30 MENIT KEMUDIAN...*

Kamu sampai di lokasi dan melihat ${waifu.name} sudah menunggu. Mata kalian bertemu dan dia langsung tersenyum manis sambil melambaikan tangan.

"Kamu dateng! Aku kira kamu lupa..." *dia menunduk malu*

Kamu menghampiri dan memberikan ${gift} sebagai kejutan. Matanya langsung berbinar!

"Eh? Buat aku? Waaah... makasih banget! Aku ${mood}" *peluk erat*

*SEPANJANG KENCAN...*

Kalian menghabiskan waktu dengan${timeOfDay === 'pagi' ? ' sarapan bersama dan jalan-jalan santai' : timeOfDay === 'siang' ? ' makan siang romantis dan foto-foto lucu' : ' makan malam candlelight dan ngobrol panjang'}.

${waifu.name} terlihat sangat bahagia. Sesekali dia melirik kamu dengan senyum malu, dan tangannya perlahan merapat ke tanganmu.

"Hari ini... hari terbaik minggu ini deh. Makasih ya sudah mau menemani aku..." *squeeze tangan*

*PULANG KE RUMAH*

"Udah mau pulang nih... Aku pengen hari ini ga usah berakhir..." *mata berkaca-kaca*

Kamu peluk dia erat sebelum berpisah.

"Besok kita kencan lagi ya? Promise?" *kelingking*

💕 *Exp +${INTERACTION_DATA.date.expGain}*
💝 *${waifu.name} semakin sayang sama kamu!*
    `

    return story.trim()
}

function getCurrentMood(waifu) {
    if (!waifu.currentMood) return null
    
    const mood = MOOD_SYSTEM.moods[waifu.currentMood.type]
    const timeLeft = (waifu.currentMood.startTime + mood.duration) - Date.now()
    
    if (timeLeft <= 0) {
        return null // Mood expired
    }
    
    return {
        type: waifu.currentMood.type,
        name: mood.name,
        emoji: mood.emoji,
        timeLeft: timeLeft,
        multiplier: mood.expMultiplier
    }
}

function setMood(waifu, moodType, reason = null) {
    waifu.currentMood = {
        type: moodType,
        startTime: Date.now(),
        reason: reason
    }
}

function checkActiveEvents(waifu) {
    const now = new Date()
    const waifuDate = new Date(waifu.dateSelected)
    const activeEvents = []
    
    // Cek Anniversary
    if (now.getDate() === waifuDate.getDate() && now.getMonth() === waifuDate.getMonth()) {
        const daysTogether = Math.floor((now - waifuDate) / (1000 * 60 * 60 * 24))
        if (daysTogether > 0) {
            activeEvents.push({
                type: 'anniversary',
                data: { days: daysTogether }
            })
        }
    }
    
    // Cek Valentine (14 Februari)
    if (now.getDate() === 14 && now.getMonth() === 1) {
        activeEvents.push({ type: 'valentine' })
    }
    
    // Cek Birthday (acak, bisa ditentukan per karakter)
    const birthdayMonth = Math.abs(waifu.name.charCodeAt(0) % 12)
    const birthdayDate = Math.abs(waifu.name.charCodeAt(1) % 28) + 1
    
    if (now.getDate() === birthdayDate && now.getMonth() === birthdayMonth) {
        activeEvents.push({ type: 'birthday' })
    }
    
    return activeEvents
}

function calculateExpGain(baseExp, waifu, eventMultiplier = 1) {
    let totalExp = baseExp
    
    // Mood multiplier
    const mood = getCurrentMood(waifu)
    if (mood) {
        totalExp *= mood.multiplier
    }
    
    // Event multiplier
    totalExp *= eventMultiplier
    
    return Math.floor(totalExp)
}

function getRelationshipLevel(exp) {
    let level = 1
    for (const [lvl, data] of Object.entries(RELATIONSHIP_LEVELS)) {
        if (exp >= data.exp) {
            level = parseInt(lvl)
        }
    }
    return level
}

function isUnlocked(waifu, feature) {
    const level = getRelationshipLevel(waifu.exp)
    const levelData = RELATIONSHIP_LEVELS[level]
    return levelData.unlocks.includes(feature) || levelData.unlocks.includes('all')
}

const DAILY_QUESTS = {
    'hug_quest': {
        name: 'Peluk 3 kali',
        description: 'Berikan pelukan hangat sebanyak 3 kali',
        target: 3,
        reward: { exp: 50, money: 100 },
        type: 'hug'
    },
    'gift_quest': {
        name: 'Beri hadiah',
        description: 'Berikan hadiah kepada partner',
        target: 1,
        reward: { exp: 75, money: 150 },
        type: 'gift'
    },
    'game_quest': {
        name: 'Main game bareng',
        description: 'Mainkan mini game bersama',
        target: 2,
        reward: { exp: 100, money: 200 },
        type: 'game'
    }
}

function initializeDailyQuests(user) {
    const today = new Date().toDateString()
    
    if (!user.dailyQuests || user.dailyQuests.date !== today) {
        user.dailyQuests = {
            date: today,
            quests: {},
            completed: []
        }
        
        const questKeys = Object.keys(DAILY_QUESTS)
        const selectedQuests = questKeys.sort(() => 0.5 - Math.random()).slice(0, 2)
        
        selectedQuests.forEach(questKey => {
            user.dailyQuests.quests[questKey] = {
                ...DAILY_QUESTS[questKey],
                progress: 0,
                completed: false
            }
        })
    }
}

function hasValidWaifu(user) {
    return user.playerStatus?.waifu && 
           user.playerStatus.waifu.name && 
           user.playerStatus.waifu.name !== '' &&
           user.playerStatus.waifu.name !== null &&
           user.playerStatus.waifu.name !== undefined
}

export {
    INTERACTION_DATA,
    MOOD_SYSTEM,
    GIFT_SYSTEM,
    EVENT_SYSTEM,
    MINI_GAMES,
    RELATIONSHIP_LEVELS,
    CharacterManager,
    canInteract,
    generateDatingStory,
    getCurrentMood,
    setMood,
    checkActiveEvents,
    calculateExpGain,
    getRelationshipLevel,
    isUnlocked,
    initializeDailyQuests,
    hasValidWaifu
}