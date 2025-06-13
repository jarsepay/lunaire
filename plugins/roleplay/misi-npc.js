const npcDatabase = {
    'amelia': {
        name: 'Amelia Stone',
        nickname: 'Amy',
        age: 24,
        job: 'Barista',
        personality: 'Ramah, ceria, dan penuh semangat',
        location: 'Coffee Bean Shop',
        specialty: 'Membuat kopi dan memberikan saran',
        background: 'Mahasiswi seni yang bekerja paruh waktu untuk membayar kuliah',
        helpTypes: ['coffee_recommendation', 'art_advice', 'local_events'],
        dialogue: {
            greeting: "Hai! Selamat datang! Ada yang bisa saya bantu?",
            helping: "Oke, saya akan buatkan kopi yang paling enak untukmu!",
            thanks: "Semoga harimu menyenangkan!",
            personality_trait: "Hidup itu seperti secangkir kopi, nikmati setiap tegukan."
        },
        rewards: {
            helper: { uang: 50, exp: 5, mood: 10 },
            reputation: 5
        }
    },
    'benjamin': {
        name: 'Benjamin Carter',
        nickname: 'Ben',
        age: 35,
        job: 'Guru Musik',
        personality: 'Sabar, perhatian, dan berdedikasi',
        location: 'Music School',
        specialty: 'Mengajar bermain piano dan gitar',
        background: 'Musisi profesional yang ingin berbagi ilmunya',
        helpTypes: ['music_lessons', 'instrument_advice', 'song_recommendation'],
        dialogue: {
            greeting: "Selamat datang di sekolah musik! Apakah kamu tertarik untuk belajar musik?",
            helping: "Ayo kita mulai dengan dasar-dasarnya.",
            thanks: "Kamu sudah belajar dengan baik hari ini!",
            personality_trait: "Musik adalah bahasa universal yang menghubungkan semua orang."
        },
        rewards: {
            helper: { uang: 100, exp: 10, mood: 15 },
            reputation: 8
        }
    },
    'chloe': {
        name: 'Chloe Davis',
        nickname: 'Coco',
        age: 29,
        job: 'Desainer Grafis',
        personality: 'Kreatif, inovatif, dan perfeksionis',
        location: 'Design Studio',
        specialty: 'Membuat desain logo dan materi promosi',
        background: 'Lulusan desain yang memiliki studio sendiri',
        helpTypes: ['design_advice', 'logo_creation', 'branding'],
        dialogue: {
            greeting: "Halo! Ada ide desain yang ingin kamu wujudkan?",
            helping: "Saya akan buatkan desain yang paling menarik untukmu!",
            thanks: "Semoga desain ini bisa membantu bisnismu!",
            personality_trait: "Desain yang baik adalah seni yang bisa menjual."
        },
        rewards: {
            helper: { uang: 150, exp: 12, mood: 12 },
            reputation: 10
        }
    },
    'daniel': {
        name: 'Daniel Wilson',
        nickname: 'Dan',
        age: 42,
        job: 'Detektif Swasta',
        personality: 'Misterius, cerdas, dan penuh perhitungan',
        location: 'Private Detective Agency',
        specialty: 'Memecahkan kasus dan mencari informasi',
        background: 'Mantan polisi yang membuka biro detektif sendiri',
        helpTypes: ['investigation', 'finding_people', 'solving_mysteries'],
        dialogue: {
            greeting: "Ada masalah yang ingin kamu pecahkan?",
            helping: "Saya akan mencari tahu kebenaran di balik ini.",
            thanks: "Kasus ini sudah selesai. Terima kasih atas bantuanmu.",
            personality_trait: "Kebenaran selalu ada, tinggal bagaimana cara kita menemukannya."
        },
        rewards: {
            helper: { uang: 200, exp: 15, mood: 8 },
            reputation: 15
        }
    },
    'eleanor': {
        name: 'Eleanor Hughes',
        nickname: 'Ellie',
        age: 22,
        job: 'Penulis Lepas',
        personality: 'Pendiam, imajinatif, dan idealis',
        location: 'Bookstore',
        specialty: 'Menulis cerita dan puisi',
        background: 'Mahasiswi sastra yang bercita-cita menjadi penulis terkenal',
        helpTypes: ['writing_advice', 'story_creation', 'poetry'],
        dialogue: {
            greeting: "Selamat datang di toko buku! Apakah kamu mencari buku tertentu?",
            helping: "Saya akan menulis cerita yang paling indah untukmu!",
            thanks: "Semoga cerita ini bisa menginspirasi kamu!",
            personality_trait: "Kata-kata adalah jendela menuju dunia lain."
        },
        rewards: {
            helper: { uang: 75, exp: 8, mood: 13 },
            reputation: 7
        }
    },
    'finn': {
        name: 'Finn Taylor',
        nickname: 'Finny',
        age: 27,
        job: 'Programmer',
        personality: 'Logis, analitis, dan sedikit kuper',
        location: 'Tech Startup Office',
        specialty: 'Membuat aplikasi dan website',
        background: 'Lulusan IT yang bekerja di perusahaan startup',
        helpTypes: ['coding_help', 'debugging', 'website_creation'],
        dialogue: {
            greeting: "Ada masalah dengan kode kamu?",
            helping: "Saya akan perbaiki bug ini secepat mungkin.",
            thanks: "Aplikasi ini sudah berjalan dengan lancar. Terima kasih!",
            personality_trait: "Kode adalah bahasa masa depan."
        },
        rewards: {
            helper: { uang: 120, exp: 11, mood: 9 },
            reputation: 9
        }
    },
    'grace': {
        name: 'Grace Bennett',
        nickname: 'Gray',
        age: 31,
        job: 'Koki',
        personality: 'Kreatif, bersemangat, dan perfeksionis',
        location: 'Restaurant',
        specialty: 'Memasak makanan lezat dan menciptakan resep baru',
        background: 'Lulusan sekolah kuliner yang bekerja sebagai koki di restoran mewah',
        helpTypes: ['cooking_advice', 'recipe_creation', 'catering'],
        dialogue: {
            greeting: "Selamat datang di restoran kami! Ada menu yang ingin kamu coba?",
            helping: "Saya akan masak makanan yang paling istimewa untukmu!",
            thanks: "Semoga kamu menikmati hidangan kami!",
            personality_trait: "Makanan adalah cinta yang bisa dimakan."
        },
        rewards: {
            helper: { uang: 180, exp: 14, mood: 11 },
            reputation: 12
        }
    },
    'henry': {
        name: 'Henry Clarke',
        nickname: 'Hank',
        age: 50,
        job: 'Pengacara',
        personality: 'Serius, tegas, dan berwibawa',
        location: 'Law Firm',
        specialty: 'Membela klien di pengadilan',
        background: 'Pengacara senior yang memiliki firma hukum sendiri',
        helpTypes: ['legal_advice', 'representation', 'negotiation'],
        dialogue: {
            greeting: "Ada masalah hukum yang ingin kamu konsultasikan?",
            helping: "Saya akan membela hak-hak kamu di pengadilan.",
            thanks: "Kasus ini sudah selesai. Keadilan sudah ditegakkan.",
            personality_trait: "Hukum adalah pagar yang melindungi hak-hak kita."
        },
        rewards: {
            helper: { uang: 250, exp: 18, mood: 6 },
            reputation: 18
        }
    },
    'isabella': {
        name: 'Isabella Green',
        nickname: 'Izzy',
        age: 25,
        job: 'Fotografer',
        personality: 'Artistik, sensitif, dan observatif',
        location: 'Photography Studio',
        specialty: 'Mengambil foto potret dan landscape',
        background: 'Lulusan fotografi yang memiliki studio sendiri',
        helpTypes: ['photography_advice', 'photo_shoot', 'editing'],
        dialogue: {
            greeting: "Selamat datang di studio foto saya! Ada konsep foto yang kamu inginkan?",
            helping: "Saya akan ambil foto yang paling indah untukmu!",
            thanks: "Semoga kamu suka dengan hasilnya!",
            personality_trait: "Foto adalah cara untuk mengabadikan momen."
        },
        rewards: {
            helper: { uang: 90, exp: 9, mood: 14 },
            reputation: 8
        }
    },
    'jack': {
        name: 'Jack Robinson',
        nickname: 'JR',
        age: 38,
        job: 'Agen Real Estate',
        personality: 'Persuasif, ambisius, dan ramah',
        location: 'Real Estate Agency',
        specialty: 'Menjual dan menyewakan properti',
        background: 'Agen real estate sukses yang memiliki banyak koneksi',
        helpTypes: ['finding_property', 'selling_property', 'investment_advice'],
        dialogue: {
            greeting: "Selamat datang di agen real estate kami! Ada properti yang kamu cari?",
            helping: "Saya akan carikan properti yang paling sesuai untukmu!",
            thanks: "Semoga kamu senang dengan properti barumu!",
            personality_trait: "Properti adalah investasi yang paling aman."
        },
        rewards: {
            helper: { uang: 160, exp: 13, mood: 10 },
            reputation: 11
        }
    },
    'kate': {
        name: 'Kate Walker',
        nickname: 'Kat',
        age: 23,
        job: 'Perawat',
        personality: 'Penyayang, sabar, dan perhatian',
        location: 'City Hospital',
        specialty: 'Merawat pasien dan memberikan pertolongan pertama',
        background: 'Lulusan keperawatan yang bekerja di rumah sakit',
        helpTypes: ['medical_advice', 'first_aid', 'health_tips'],
        dialogue: {
            greeting: "Selamat datang di rumah sakit! Ada yang bisa saya bantu?",
            helping: "Saya akan merawat kamu dengan sebaik mungkin.",
            thanks: "Semoga kamu cepat sembuh!",
            personality_trait: "Kesehatan adalah harta yang paling berharga."
        },
        rewards: {
            helper: { uang: 60, exp: 7, mood: 15 },
            reputation: 6
        }
    },
    'liam': {
        name: 'Liam O\'Connell',
        nickname: 'Liam',
        age: 29,
        job: 'Bartender',
        personality: 'Santai, ramah, dan suka bercanda',
        location: 'Local Pub',
        specialty: 'Meracik minuman dan menghibur pelanggan',
        background: 'Bartender berpengalaman yang tahu banyak tentang minuman',
        helpTypes: ['drink_recommendations', 'listening_ear', 'local_gossip'],
        dialogue: {
            greeting: "Hai! Mau pesan apa?",
            helping: "Saya akan buatkan minuman yang paling enak untukmu!",
            thanks: "Semoga kamu suka dengan minumannya!",
            personality_trait: "Hidup itu seperti koktail, nikmati setiap campuran."
        },
        rewards: {
            helper: { uang: 40, exp: 4, mood: 12 },
            reputation: 4
        }
    },
        'mia': {
        name: 'Mia Johnson',
        nickname: 'MJ',
        age: 26,
        job: 'Instruktur Yoga',
        personality: 'Tenang, sabar, dan penuh perhatian',
        location: 'Yoga Studio',
        specialty: 'Mengajar yoga dan meditasi',
        background: 'Instruktur yoga bersertifikat yang memiliki studio sendiri',
        helpTypes: ['yoga_lessons', 'meditation_advice', 'stress_relief'],
        dialogue: {
            greeting: "Selamat datang di studio yoga! Siap untuk relaksasi?",
            helping: "Mari kita mulai dengan pernapasan yang dalam.",
            thanks: "Semoga kamu merasa lebih baik setelah sesi ini!",
            personality_trait: "Ketenangan pikiran adalah kunci kebahagiaan."
        },
        rewards: {
            helper: { uang: 80, exp: 8, mood: 16 },
            reputation: 7
        }
    },
    'noah': {
        name: 'Noah Williams',
        nickname: 'Noy',
        age: 33,
        job: 'Penjual Bunga',
        personality: 'Romantis, sensitif, dan artistik',
        location: 'Flower Shop',
        specialty: 'Merangkai bunga dan memberikan saran',
        background: 'Penjual bunga yang mewarisi toko dari keluarganya',
        helpTypes: ['flower_arrangements', 'plant_care', 'romantic_advice'],
        dialogue: {
            greeting: "Selamat datang di toko bunga kami! Ada bunga yang ingin kamu beli?",
            helping: "Saya akan rangkai bunga yang paling indah untukmu!",
            thanks: "Semoga bunga ini bisa membuat harimu lebih cerah!",
            personality_trait: "Bunga adalah bahasa cinta yang paling indah."
        },
        rewards: {
            helper: { uang: 55, exp: 6, mood: 13 },
            reputation: 5
        }
    },
    'olivia': {
        name: 'Olivia Brown',
        nickname: 'Liv',
        age: 24,
        job: 'Pemandu Wisata',
        personality: 'Enerjik, antusias, dan informatif',
        location: 'Tourist Information Center',
        specialty: 'Memberikan informasi wisata dan memandu tur',
        background: 'Lulusan pariwisata yang suka menjelajahi tempat-tempat baru',
        helpTypes: ['tourist_information', 'guided_tours', 'local_tips'],
        dialogue: {
            greeting: "Selamat datang di kota kami! Ada tempat wisata yang ingin kamu kunjungi?",
            helping: "Saya akan bawa kamu ke tempat-tempat yang paling menarik!",
            thanks: "Semoga kamu menikmati liburanmu!",
            personality_trait: "Perjalanan adalah cara untuk memperluas wawasan."
        },
        rewards: {
            helper: { uang: 70, exp: 7, mood: 14 },
            reputation: 6
        }
    },
    'peter': {
        name: 'Peter Jones',
        nickname: 'Pete',
        age: 40,
        job: 'Mekanik',
        personality: 'Jujur, pekerja keras, dan sedikit bicara',
        location: 'Auto Repair Shop',
        specialty: 'Memperbaiki mobil dan memberikan saran',
        background: 'Mekanik berpengalaman yang memiliki bengkel sendiri',
        helpTypes: ['car_repair', 'maintenance_advice', 'used_car_inspections'],
        dialogue: {
            greeting: "Ada masalah dengan mobil kamu?",
            helping: "Saya akan perbaiki mobil kamu dengan sebaik mungkin.",
            thanks: "Semoga mobil kamu awet!",
            personality_trait: "Mobil yang terawat adalah investasi yang baik."
        },
        rewards: {
            helper: { uang: 130, exp: 12, mood: 8 },
            reputation: 10
        }
    },
    'quinn': {
        name: 'Quinn Garcia',
        nickname: 'Q',
        age: 27,
        job: 'Pelatih Pribadi',
        personality: 'Motivator, disiplin, dan berpengetahuan',
        location: 'Local Gym',
        specialty: 'Membuat program latihan dan memberikan motivasi',
        background: 'Pelatih pribadi bersertifikat yang memiliki banyak klien',
        helpTypes: ['workout_plans', 'nutrition_advice', 'motivation'],
        dialogue: {
            greeting: "Siap untuk berolahraga?",
            helping: "Saya akan bantu kamu mencapai tujuanmu!",
            thanks: "Semoga kamu tetap semangat!",
            personality_trait: "Kesehatan adalah kekayaan yang sejati."
        },
        rewards: {
            helper: { uang: 95, exp: 9, mood: 15 },
            reputation: 8
        }
    },
    'ryan': {
        name: 'Ryan Harris',
        nickname: 'Ry',
        age: 31,
        job: 'Guru Sejarah',
        personality: 'Cerdas, sabar, dan bersemangat',
        location: 'Local High School',
        specialty: 'Mengajar sejarah dan memberikan inspirasi',
        background: 'Guru sejarah yang suka berbagi pengetahuannya',
        helpTypes: ['history_lessons', 'research_help', 'inspiring_stories'],
        dialogue: {
            greeting: "Selamat datang di kelas sejarah!",
            helping: "Saya akan bantu kamu memahami masa lalu.",
            thanks: "Semoga kamu terinspirasi oleh sejarah!",
            personality_trait: "Sejarah adalah guru kehidupan."
        },
        rewards: {
            helper: { uang: 65, exp: 7, mood: 13 },
            reputation: 6
        }
    },
    'sophia': {
        name: 'Sophia Lewis',
        nickname: 'So',
        age: 28,
        job: 'Pramuniaga Toko Buku',
        personality: 'Cerdas, ramah, dan suka membaca',
        location: 'Bookstore',
        specialty: 'Merekomendasikan buku dan membantu menemukan buku',
        background: 'Pramuniaga yang mencintai buku dan sastra',
        helpTypes: ['book_recommendations', 'finding_books', 'literary_advice'],
        dialogue: {
            greeting: "Selamat datang di toko buku! Ada buku yang sedang kamu cari?",
            helping: "Saya akan bantu kamu menemukan buku yang tepat.",
            thanks: "Semoga kamu menikmati bukunya!",
            personality_trait: "Buku adalah jendela dunia."
        },
        rewards: {
            helper: { uang: 45, exp: 5, mood: 11 },
            reputation: 4
        }
    },
    'thomas': {
        name: 'Thomas Martinez',
        nickname: 'Tom',
        age: 35,
        job: 'Koki',
        personality: 'Kreatif, bersemangat, dan perfeksionis',
        location: 'Restaurant',
        specialty: 'Memasak makanan lezat dan menciptakan resep baru',
        background: 'Koki berbakat yang menciptakan hidangan inovatif',
        helpTypes: ['cooking_advice', 'recipe_creation', 'catering'],
        dialogue: {
            greeting: "Selamat datang di restoran kami! Apa yang ingin kamu pesan hari ini?",
            helping: "Saya akan siapkan hidangan yang istimewa untukmu!",
            thanks: "Semoga kamu menikmati makanannya!",
            personality_trait: "Makanan yang enak adalah seni yang bisa dinikmati."
        },
        rewards: {
            helper: { uang: 140, exp: 13, mood: 9 },
            reputation: 11
        }
    },
    'ursula': {
        name: 'Ursula Kim',
        nickname: 'Ulla',
        age: 29,
        job: 'Fashion Designer',
        personality: 'Kreatif, trendi, dan percaya diri',
        location: 'Design Studio',
        specialty: 'Merancang pakaian dan memberikan saran fashion',
        background: 'Desainer fashion yang memiliki butik sendiri',
        helpTypes: ['fashion_advice', 'clothing_design', 'personal_styling'],
        dialogue: {
            greeting: "Selamat datang di butik saya! Ada pakaian yang ingin kamu coba?",
            helping: "Saya akan bantu kamu menemukan gaya yang cocok.",
            thanks: "Semoga kamu suka dengan pakaiannya!",
            personality_trait: "Fashion adalah cara untuk mengekspresikan diri."
        },
        rewards: {
            helper: { uang: 110, exp: 10, mood: 12 },
            reputation: 9
        }
    },
    'victor': {
        name: 'Victor Rossi',
        nickname: 'Vic',
        age: 42,
        job: 'Pengacara',
        personality: 'Tegas, cerdas, dan berpengalaman',
        location: 'Law Firm',
        specialty: 'Membela klien di pengadilan',
        background: 'Pengacara yang berdedikasi untuk keadilan',
        helpTypes: ['legal_advice', 'court_representation', 'negotiation'],
        dialogue: {
            greeting: "Selamat datang di kantor hukum saya! Apa masalahmu?",
            helping: "Saya akan membela hak-hak kamu.",
            thanks: "Keadilan telah ditegakkan!",
            personality_trait: "Hukum adalah pilar masyarakat."
        },
        rewards: {
            helper: { uang: 170, exp: 14, mood: 7 },
            reputation: 13
        }
    },
    'wendy': {
        name: 'Wendy Chen',
        nickname: 'Wen',
        age: 25,
        job: 'Programmer Game',
        personality: 'Kreatif, logis, dan tekun',
        location: 'Game Development Studio',
        specialty: 'Membuat game dan memperbaiki bug',
        background: 'Programmer game yang suka tantangan',
        helpTypes: ['game_development', 'debugging', 'coding_advice'],
        dialogue: {
            greeting: "Selamat datang di studio game kami! Siap untuk membuat game?",
            helping: "Saya akan bantu kamu mengembangkan game yang keren.",
            thanks: "Game ini sangat menyenangkan!",
            personality_trait: "Game adalah seni interaktif."
        },
        rewards: {
            helper: { uang: 100, exp: 9, mood: 10 },
            reputation: 8
        }
    },
    'xavier': {
        name: 'Xavier Dubois',
        nickname: 'Xav',
        age: 38,
        job: 'Art Dealer',
        personality: 'Cerdas, berpengalaman, dan memiliki selera tinggi',
        location: 'Art Gallery',
        specialty: 'Menilai seni dan menjual lukisan',
        background: 'Penjual seni yang memiliki galeri seni terkenal',
        helpTypes: ['art_appraisal', 'selling_art', 'artistic_advice'],
        dialogue: {
            greeting: "Selamat datang di galeri seni saya! Apa yang menarik perhatianmu?",
            helping: "Saya akan bantu kamu menemukan karya seni yang sempurna.",
            thanks: "Semoga kamu menikmati seni yang kamu beli!",
            personality_trait: "Seni adalah cerminan jiwa."
        },
        rewards: {
            helper: { uang: 150, exp: 12, mood: 8 },
            reputation: 11
        }
    },
    'yasmine': {
        name: 'Yasmine Patel',
        nickname: 'Yas',
        age: 27,
        job: 'Jurnalis',
        personality: 'Kritis, analitis, dan jujur',
        location: 'News Office',
        specialty: 'Menulis berita dan mewawancarai orang',
        background: 'Jurnalis yang berdedikasi untuk kebenaran',
        helpTypes: ['news_reporting', 'interviewing', 'investigative_advice'],
        dialogue: {
            greeting: "Selamat datang di kantor berita kami! Apa yang ingin kamu laporkan?",
            helping: "Saya akan bantu kamu menulis berita yang akurat.",
            thanks: "Berita ini sangat informatif!",
            personality_trait: "Kebenaran adalah fondasi jurnalisme."
        },
        rewards: {
            helper: { uang: 120, exp: 10, mood: 9 },
            reputation: 10
        }
    },
    'zachary': {
        name: 'Zachary Lee',
        nickname: 'Zach',
        age: 31,
        job: 'Arsitek',
        personality: 'Kreatif, detail, dan visioner',
        location: 'Architecture Studio',
        specialty: 'Merancang bangunan dan memberikan saran desain',
        background: 'Arsitek yang menciptakan bangunan inovatif',
        helpTypes: ['architectural_design', 'design_advice', 'building_planning'],
        dialogue: {
            greeting: "Selamat datang di studio arsitektur kami! Apa yang ingin kamu bangun?",
            helping: "Saya akan bantu kamu merancang bangunan yang indah.",
            thanks: "Bangunan ini sangat mengagumkan!",
            personality_trait: "Arsitektur adalah seni yang fungsional."
        },
        rewards: {
            helper: { uang: 160, exp: 13, mood: 7 },
            reputation: 12
        }
    }
}

export const cmd = {
    name: ['tolong'],
    command: ['tolong'],
    category: ['roleplay'],
    detail: {
        desc: 'Membantu NPC dan menambah progress misi sosial serta reputasi',
    },
    setting: {
        isRegister: true,
        isBanned: false,
        isJail: false
    },
    async start({ m, db, prefix, command, args, conn }) {
        const user = db.users.get(m.sender)
        
        if (!user.playerStats) {
            user.playerStats = {
                helpCount: 0,
                healthyDays: 0,
                lastHealthCheck: Date.now(),
                npcReputation: {},
                helpHistory: []
            }
        }
        
        const subCommand = args[0] ? args[0].toLowerCase() : ''
        let caption = ''
        
        switch (subCommand) {
            case 'npc':
                const npcId = args[1] ? args[1].toLowerCase() : ''
                if (!npcId) {
                    caption = getNPCList(prefix, command)
                    break
                }
                
                const npc = npcDatabase[npcId]
                if (!npc) {
                    caption = `NPC '${npcId}' tidak ditemukan.\n\nGunakan: \`${prefix + command} npc\` untuk melihat daftar NPC.`
                    break
                }
                
                const today = new Date().toDateString()
                if (!user.playerStats.helpCooldown) {
                    user.playerStats.helpCooldown = {}
                }
                
                if (user.playerStats.helpCooldown[npcId] === today) {
                    caption = `Kamu sudah membantu ${npc.name} hari ini.\n\n` +
                             `💭 *${npc.name}:* "${getRandomMessage(npc, 'already_helped')}"\n\n` +
                             `Coba lagi besok!`
                    break
                }
                
                const helpResult = await helpNPC(user, npc, npcId, today, db, m.sender)
                caption = helpResult
                break
                
            case 'stats':
            case 'statistik':
                caption = getHelpStats(user)
                break
                
            case 'reputation':
            case 'reputasi':
                caption = getReputationStatus(user)
                break
                
            case 'history':
            case 'riwayat':
                caption = getHelpHistory(user)
                break
                
            default:
                caption = getHelpMenu(prefix, command, user)
                break
        }
        
        conn.sendMessage(m.from, { text: caption })
    }
}

async function helpNPC(user, npc, npcId, today, db, senderId) {
    // Random help type
    const helpType = npc.helpTypes[Math.floor(Math.random() * npc.helpTypes.length)]
    const activity = getSpecificActivity(helpType, npc)
    
    // Update stats
    user.playerStats.helpCount = (user.playerStats.helpCount || 0) + 1
    user.playerStats.helpCooldown[npcId] = today
    
    // Update reputation
    if (!user.playerStats.npcReputation) {
        user.playerStats.npcReputation = {}
    }
    user.playerStats.npcReputation[npcId] = (user.playerStats.npcReputation[npcId] || 0) + npc.rewards.reputation
    
    // Apply rewards
    user.playerInventory.items.uang += npc.rewards.helper.uang
    user.playerInfo.exp += npc.rewards.helper.exp
    user.playerInfo.mood = Math.min(100, user.playerInfo.mood + npc.rewards.helper.mood)
    
    // Level up check
    const requiredExp = user.playerInfo.level * 100
    if (user.playerInfo.exp >= requiredExp) {
        user.playerInfo.level += 1
        user.playerInfo.exp -= requiredExp
    }
    
    // Add to history
    if (!user.playerStats.helpHistory) {
        user.playerStats.helpHistory = []
    }
    user.playerStats.helpHistory.unshift({
        npcId,
        npcName: npc.name,
        helpType,
        activity: activity.action,
        date: new Date().toLocaleDateString('id-ID'),
        rewards: npc.rewards.helper
    })
    
    // Keep only last 20 history entries
    if (user.playerStats.helpHistory.length > 20) {
        user.playerStats.helpHistory = user.playerStats.helpHistory.slice(0, 20)
    }
    
    // Save to database
    db.users.update(senderId, user)
    db.save()
    
    // Generate detailed response
    let response = `🎭 *\`MEMBANTU ${npc.name.toUpperCase()}\`*\n\n`
    
    // NPC Info
    response += `👤 *Profil NPC:*\n`
    response += `   Nama: ${npc.name} (${npc.nickname})\n`
    response += `   Umur: ${npc.age} tahun\n`
    response += `   Pekerjaan: ${npc.job}\n`
    response += `   Lokasi: ${npc.location}\n`
    response += `   Kepribadian: ${npc.personality}\n\n`
    
    // NPC Greeting
    response += `💭 *${npc.name}:* "${npc.dialogue.greeting}"\n\n`
    
    // Specific Activity
    response += `🎯 *Aktivitas yang Dilakukan:*\n`
    response += `${activity.action}\n\n`
    
    response += `⚡ *Proses Bantuan:*\n`
    response += `${activity.process}\n\n`
    
    // Help process with personality
    response += `💭 *${npc.name}:* "${npc.dialogue.helping}"\n\n`
    response += `🔄 *Sedang ${activity.action.toLowerCase()}...*\n\n`
    
    // Completion with result
    response += `✅ *BANTUAN SELESAI!*\n\n`
    response += `🎊 *Hasil:* ${activity.result}\n\n`
    response += `💭 *${npc.name}:* "${npc.dialogue.thanks}"\n\n`
    
    // Personality insight
    response += `🧠 *Wisdom dari ${npc.nickname}:*\n`
    response += `"${npc.dialogue.personality_trait}"\n\n`
    
    // Rewards
    response += `🎁 *Reward yang Diterima:*\n`
    response += `   • Uang: +${npc.rewards.helper.uang.toLocaleString('id-ID')}\n`
    response += `   • EXP: +${npc.rewards.helper.exp}\n`
    response += `   • Mood: +${npc.rewards.helper.mood}\n`
    response += `   • Reputasi dengan ${npc.name}: +${npc.rewards.reputation}\n\n`
    
    // Relationship status
    const currentRep = user.playerStats.npcReputation[npcId]
    const relationshipLevel = getRelationshipLevel(currentRep)
    const relationshipIcon = getRelationshipIcon(currentRep)
    response += `${relationshipIcon} *Status Hubungan:* ${relationshipLevel}\n\n`
    
    // Stats update
    const totalReputation = Object.values(user.playerStats.npcReputation).reduce((a, b) => a + b, 0)
    response += `📊 *Update Statistik:*\n`
    response += `   • Total bantuan: ${user.playerStats.helpCount}\n`
    response += `   • Total reputasi: ${totalReputation}\n`
    response += `   • Status: ${getReputationTitle(totalReputation)}\n\n`
    
    // Encouragement
    response += `💪 *${npc.name}:* "${getRandomMessage(npc, 'encouragement')}"`
    
    return response
}

function getNPCList(prefix, command) {
    let caption = `🎭 *\`DAFTAR NPC YANG BISA DIBANTU\`*\n\n`
    
    Object.entries(npcDatabase).forEach(([id, npc], index) => {
        caption += `${index + 1}. *${npc.name}* (${npc.nickname})\n`
        caption += `   • Umur: ${npc.age} tahun\n`
        caption += `   • Pekerjaan: ${npc.job}\n`
        caption += `   • Lokasi: ${npc.location}\n`
        caption += `   • Keahlian: ${npc.specialty}\n`
        caption += `   • Reward: ${npc.rewards.helper.uang.toLocaleString('id-ID')} uang\n`
        caption += `   • ID: \`${id}\`\n\n`
    })
    
    caption += `Gunakan: \`${prefix + command} npc <id>\` untuk membantu NPC tertentu\n\n`
    caption += `Batasan 1x per hari per NPC`
    
    return caption
}

function getHelpStats(user) {
    const helpCount = user.playerStats.helpCount || 0
    const totalReputation = user.playerStats.npcReputation ? 
        Object.values(user.playerStats.npcReputation).reduce((a, b) => a + b, 0) : 0
    
    const helpToday = user.playerStats.helpCooldown ? 
        Object.values(user.playerStats.helpCooldown)
            .filter(date => date === new Date().toDateString()).length : 0
    
    let caption = `📊 *STATISTIK BANTUAN*\n\n`
    caption += `• Total bantuan: ${helpCount}\n`
    caption += `• Bantuan hari ini: ${helpToday}\n`
    caption += `• Total reputasi: ${totalReputation}\n`
    caption += `• Status: ${getReputationTitle(totalReputation)}\n\n`
    
    // NPC individual reputation
    if (user.playerStats.npcReputation) {
        caption += `👥 *Reputasi per NPC:*\n`
        Object.entries(user.playerStats.npcReputation).forEach(([npcId, rep]) => {
            const npc = npcDatabase[npcId]
            if (npc) {
                const relationshipLevel = getRelationshipLevel(rep)
                caption += `   ${npc.name}: ${rep} (${relationshipLevel})\n`
            }
        })
        caption += `\n`
    }
    
    // Progress misi community service
    const communityMission = user.playerStatus.missions?.active?.find(m => m.id === 'community_service')
    if (communityMission) {
        const objective = communityMission.objectives[0]
        const percentage = Math.min(100, (objective.progress / objective.target) * 100)
        caption += `🎯 Progress Misi "Pelayanan Masyarakat":\n`
        caption += `   ${generateProgressBar(percentage)} ${percentage.toFixed(1)}%\n`
        caption += `   (${objective.progress}/${objective.target})\n`
    }
    
    return caption
}

function getReputationStatus(user) {
    const totalReputation = user.playerStats.npcReputation ? 
        Object.values(user.playerStats.npcReputation).reduce((a, b) => a + b, 0) : 0
    
    let caption = `👑 *STATUS REPUTASI*\n\n`
    caption += `• Total Reputasi: ${totalReputation}\n`
    caption += `• Title: ${getReputationTitle(totalReputation)}\n\n`
    
    if (user.playerStats.npcReputation) {
        caption += `👥 *Hubungan dengan NPC:*\n\n`
        Object.entries(user.playerStats.npcReputation).sort((a, b) => b[1] - a[1]).forEach(([npcId, rep]) => {
            const npc = npcDatabase[npcId]
            if (npc) {
                const relationshipLevel = getRelationshipLevel(rep)
                const relationshipIcon = getRelationshipIcon(rep)
                caption += `${relationshipIcon} *${npc.name}*\n`
                caption += `   Reputasi: ${rep}\n`
                caption += `   Status: ${relationshipLevel}\n`
                caption += `   Pekerjaan: ${npc.job}\n\n`
            }
        })
    } else {
        caption += `Belum ada hubungan dengan NPC. Mulai bantu NPC untuk membangun reputasi.`
    }
    
    return caption
}

function getHelpHistory(user) {
    if (!user.playerStats.helpHistory || user.playerStats.helpHistory.length === 0) {
        return `Belum ada riwayat bantuan. Mulai bantu NPC untuk melihat riwayat.`
    }
    
    let caption = `📋 *\`RIWAYAT BANTUAN\`*\n\n`
    
    user.playerStats.helpHistory.slice(0, 10).forEach((help, index) => {
        caption += `${index + 1}. *${help.npcName}*\n`
        caption += `   • Tanggal: ${help.date}\n`
        caption += `   • Aktivitas: ${help.activity}\n`
        caption += `   • Reward: ${help.rewards.uang.toLocaleString('id-ID')} uang\n`
        caption += `   • EXP: +${help.rewards.exp} | 😊 Mood: +${help.rewards.mood}\n\n`
    })
    
    if (user.playerStats.helpHistory.length > 10) {
        caption += `... dan ${user.playerStats.helpHistory.length - 10} bantuan lainnya.`
    }
    
    return caption
}

function getHelpMenu(prefix, command, user) {
    const helpCount = user.playerStats.helpCount || 0
    const totalReputation = user.playerStats.npcReputation ? 
        Object.values(user.playerStats.npcReputation).reduce((a, b) => a + b, 0) : 0
    
    let caption = `🎭 *\`DAFTAR PERINTAH\`*\n\n`
    
    caption += `📊 *Status Kamu:*\n`
    caption += `   • Total bantuan: ${helpCount}\n`
    caption += `   • Total reputasi: ${totalReputation}\n`
    caption += `   • Title: ${getReputationTitle(totalReputation)}\n\n`
    
    caption += `*General Command:*\n`
    caption += `• \`${prefix + command} npc\` - Lihat daftar NPC\n`
    caption += `• \`${prefix + command} npc <id>\` - Bantu NPC tertentu\n`
    caption += `• \`${prefix + command} stats\` - Lihat statistik bantuan\n`
    caption += `• \`${prefix + command} reputation\` - Status reputasi\n`
    caption += `• \`${prefix + command} history\` - Riwayat bantuan\n\n`
    
    caption += `• Setiap NPC punya kepribadian dan dialog berbeda\n`
    caption += `• Reward bervariasi sesuai karakter NPC\n`
    caption += `• Sistem reputasi individual per NPC\n`
    caption += `• Riwayat bantuan tersimpan\n\n`
    
    caption += `Batasan 1x per hari per NPC`
    
    return caption
}

function getSpecificActivity(helpType, npc) {
    const activities = {
        // Amelia - Barista activities
        'coffee_recommendation': {
            action: '☕ Merekomendasi jenis kopi yang sesuai dengan selera pelanggan',
            process: 'Menanyakan preferensi rasa, mencicipi berbagai blend, menjelaskan asal biji kopi',
            result: 'Pelanggan mendapat rekomendasi kopi yang sempurna'
        },
        'art_advice': {
            action: '🎨 Memberikan saran tentang seni dan kreativitas',
            process: 'Mendiskusikan teknik melukis, berbagi inspirasi, menunjukkan karya seni',
            result: 'Mendapat insight baru tentang dunia seni'
        },
        'local_events': {
            action: '📅 Menginformasikan acara-acara lokal yang menarik',
            process: 'Mengecek kalender event, menjelaskan detail acara, memberikan rekomendasi',
            result: 'Mengetahui event-event menarik di sekitar area'
        },

        // Benjamin - Music Teacher activities
        'music_lessons': {
            action: '🎵 Mengajar bermain alat musik dengan sabar',
            process: 'Menjelaskan teori musik, praktek chord, latihan rhythm dan tempo',
            result: 'Kemampuan bermain musik meningkat'
        },
        'instrument_advice': {
            action: '🎸 Memberikan saran tentang pemilihan dan perawatan alat musik',
            process: 'Menjelaskan karakteristik instrumen, tips perawatan, rekomendasi brand',
            result: 'Mendapat pengetahuan mendalam tentang instrumen musik'
        },
        'song_recommendation': {
            action: '🎼 Merekomendasikan lagu sesuai mood dan genre favorit',
            process: 'Menanyakan preferensi musik, memainkan sample lagu, menjelaskan sejarah musik',
            result: 'Playlist musik baru yang sesuai selera'
        },

        // Chloe - Graphic Designer activities
        'design_advice': {
            action: '🖌️ Memberikan konsultasi desain dan tips kreatif',
            process: 'Menganalisis brief, sketching ide, menjelaskan prinsip desain',
            result: 'Konsep desain yang matang dan profesional'
        },
        'logo_creation': {
            action: '🎯 Membuat logo yang memorable dan representatif',
            process: 'Riset brand, brainstorming konsep, digital drafting, revisi',
            result: 'Logo yang unik dan sesuai brand identity'
        },
        'branding': {
            action: '📊 Mengembangkan strategi branding yang komprehensif',
            process: 'Analisis target market, define brand personality, create guideline',
            result: 'Brand identity yang kuat dan konsisten'
        },

        // Daniel - Private Detective activities
        'investigation': {
            action: '🔍 Melakukan investigasi kasus dengan metodis',
            process: 'Mengumpulkan bukti, wawancara saksi, analisis data, menyusun laporan',
            result: 'Kasus terungkap dengan bukti yang kuat'
        },
        'finding_people': {
            action: '👤 Mencari orang hilang atau yang sulit ditemukan',
            process: 'Tracking digital footprint, surveilans, networking informan',
            result: 'Berhasil menemukan orang yang dicari'
        },
        'solving_mysteries': {
            action: '🧩 Memecahkan misteri yang membingungkan',
            process: 'Analisis pola, rekonstruksi kejadian, connect the dots',
            result: 'Misteri terpecahkan dengan penjelasan logis'
        },

        // Eleanor - Writer activities
        'writing_advice': {
            action: '📝 Memberikan tips dan feedback untuk tulisan',
            process: 'Review draft, diskusi plot, editing, sharing technique',
            result: 'Kualitas tulisan meningkat signifikan'
        },
        'story_creation': {
            action: '📚 Membantu mengembangkan cerita yang menarik',
            process: 'Brainstorming plot, character development, world building',
            result: 'Cerita dengan alur yang engaging'
        },
        'poetry': {
            action: '🌟 Mengajarkan seni puisi dan ekspresi sastra',
            process: 'Diskusi metafora, rhythm dalam puisi, ekspresi emosi',
            result: 'Puisi yang indah dan bermakna'
        },

        // Finn - Programmer activities
        'coding_help': {
            action: '💻 Membantu menyelesaikan masalah programming',
            process: 'Code review, debugging, explaining algorithm, best practices',
            result: 'Code yang bersih dan efisien'
        },
        'debugging': {
            action: '🐛 Mencari dan memperbaiki bug dalam kode',
            process: 'Error analysis, step-by-step debugging, testing solution',
            result: 'Aplikasi berjalan tanpa error'
        },
        'website_creation': {
            action: '🌐 Membuat website yang responsive dan user-friendly',
            process: 'Design mockup, coding frontend/backend, testing, deployment',
            result: 'Website yang profesional dan fungsional'
        },

        // Grace & Thomas - Chef activities
        'cooking_advice': {
            action: '👨‍🍳 Memberikan tips memasak dan teknik kuliner',
            process: 'Demo teknik memasak, tips seasoning, food presentation',
            result: 'Skill memasak meningkat drastis'
        },
        'recipe_creation': {
            action: '📖 Mengembangkan resep baru yang inovatif',
            process: 'Eksperimen bahan, testing rasa, dokumentasi resep',
            result: 'Resep signature yang unik'
        },
        'catering': {
            action: '🍽️ Menyiapkan catering untuk acara khusus',
            process: 'Menu planning, food prep, presentation setup, service',
            result: 'Event catering yang berkesan'
        },

        // Henry & Victor - Lawyer activities
        'legal_advice': {
            action: '⚖️ Memberikan konsultasi hukum profesional',
            process: 'Analisis kasus, riset precedent, strategy planning',
            result: 'Solusi hukum yang tepat dan legal'
        },
        'representation': {
            action: '🏛️ Mewakili klien di pengadilan',
            process: 'Persiapan dokumen, argumentasi, cross-examination',
            result: 'Representasi hukum yang kuat'
        },
        'court_representation': {
            action: '🏛️ Membela klien dalam persidangan',
            process: 'Penyusunan pleidoi, presentasi bukti, argumentasi hukum',
            result: 'Pembelaan yang meyakinkan di pengadilan'
        },
        'negotiation': {
            action: '🤝 Melakukan negosiasi untuk kepentingan klien',
            process: 'Analisis posisi, strategy negotiation, deal making',
            result: 'Negosiasi yang menguntungkan'
        },

        // Isabella - Photographer activities
        'photography_advice': {
            action: '📸 Memberikan tips fotografi dan komposisi',
            process: 'Diskusi teknik, lighting tips, composition rules',
            result: 'Kemampuan fotografi meningkat'
        },
        'photo_shoot': {
            action: '📷 Mengadakan sesi foto profesional',
            process: 'Setup lighting, directing pose, multiple shots, editing',
            result: 'Foto-foto berkualitas tinggi'
        },
        'editing': {
            action: '🎨 Mengedit foto dengan teknik profesional',
            process: 'Color correction, retouching, artistic enhancement',
            result: 'Foto yang memukau dan siap publish'
        },

        // Jack - Real Estate activities
        'finding_property': {
            action: '🏠 Mencari properti sesuai kebutuhan dan budget',
            process: 'Survey lokasi, property viewing, market analysis',
            result: 'Properti impian yang sesuai kriteria'
        },
        'selling_property': {
            action: '💰 Membantu menjual properti dengan harga terbaik',
            process: 'Property valuation, marketing strategy, buyer screening',
            result: 'Properti terjual dengan harga optimal'
        },
        'investment_advice': {
            action: '📈 Memberikan saran investasi properti',
            process: 'Market trend analysis, ROI calculation, risk assessment',
            result: 'Strategi investasi properti yang menguntungkan'
        },

        // Kate - Nurse activities
        'medical_advice': {
            action: '🏥 Memberikan saran kesehatan dan medis',
            process: 'Konsultasi gejala, rekomendasi treatment, health tips',
            result: 'Informasi kesehatan yang akurat'
        },
        'first_aid': {
            action: '🚑 Memberikan pertolongan pertama',
            process: 'Assessment kondisi, tindakan darurat, stabilisasi',
            result: 'Kondisi darurat tertangani dengan baik'
        },
        'health_tips': {
            action: '💊 Sharing tips hidup sehat',
            process: 'Edukasi gaya hidup, prevention tips, wellness advice',
            result: 'Gaya hidup yang lebih sehat'
        },

        // Liam - Bartender activities
        'drink_recommendations': {
            action: '🍹 Merekomendasikan minuman sesuai suasana hati',
            process: 'Menanyakan preferensi, mixing cocktail, presentation',
            result: 'Minuman yang sempurna untuk mood'
        },
        'listening_ear': {
            action: '👂 Menjadi pendengar yang baik untuk keluh kesah',
            process: 'Active listening, empathy, supportive advice',
            result: 'Perasaan lega dan terdengar'
        },
        'local_gossip': {
            action: '💬 Berbagi informasi dan gosip lokal terkini',
            process: 'Sharing local news, community updates, social insight',
            result: 'Update terbaru tentang komunitas'
        },

        // Mia - Yoga Instructor activities
        'yoga_lessons': {
            action: '🧘‍♀️ Mengajar gerakan yoga untuk kesehatan',
            process: 'Warm up, pose instruction, breathing technique, cool down',
            result: 'Tubuh lebih fleksibel dan pikiran tenang'
        },
        'meditation_advice': {
            action: '🕯️ Memberikan panduan meditasi dan mindfulness',
            process: 'Guided meditation, breathing exercise, mindfulness tips',
            result: 'Ketenangan pikiran dan fokus meningkat'
        },
        'stress_relief': {
            action: '😌 Membantu mengelola stress dan anxiety',
            process: 'Stress assessment, relaxation technique, coping strategy',
            result: 'Tingkat stress berkurang signifikan'
        }
    }

    return activities[helpType] || {
        action: `🤝 Membantu ${npc.name} dengan ${helpType}`,
        process: 'Melakukan aktivitas sesuai kebutuhan',
        result: 'Bantuan berhasil diberikan'
    }
}

function getNPCByCategory(category) {
    const categories = {
        'food': ['grace', 'thomas', 'amelia'],
        'tech': ['finn', 'wendy'],
        'health': ['kate', 'mia', 'quinn'],
        'creative': ['chloe', 'isabella', 'eleanor', 'ursula', 'xavier'],
        'service': ['benjamin', 'ryan', 'olivia', 'liam', 'noah'],
        'professional': ['daniel', 'henry', 'victor', 'jack', 'yasmine', 'zachary'],
        'education': ['benjamin', 'ryan'],
        'entertainment': ['benjamin', 'liam']
    }
    
    return categories[category] || Object.keys(npcDatabase)
}

function getReputationTitle(totalRep) {
    if (totalRep >= 1000) return 'Legend of the City 👑'
    if (totalRep >= 750) return 'Community Champion 🏆'
    if (totalRep >= 500) return 'Neighborhood Hero 🦸‍♂️'
    if (totalRep >= 350) return 'Local Celebrity 🌟'
    if (totalRep >= 250) return 'Respected Citizen 🏅'
    if (totalRep >= 150) return 'Good Samaritan 🤝'
    if (totalRep >= 100) return 'Helpful Person 😊'
    if (totalRep >= 50) return 'Kind Soul 💝'
    if (totalRep >= 25) return 'Friendly Neighbor 🏘️'
    return 'Newbie Helper 🌱'
}

function getRelationshipLevel(rep) {
    if (rep >= 100) return 'Best Friend'
    if (rep >= 75) return 'Close Friend'
    if (rep >= 50) return 'Good Friend'
    if (rep >= 25) return 'Friend'
    if (rep >= 10) return 'Acquaintance'
    return 'Stranger'
}

function getRelationshipIcon(rep) {
    if (rep >= 100) return '💎'
    if (rep >= 75) return '💛'
    if (rep >= 50) return '💚'
    if (rep >= 25) return '💙'
    if (rep >= 10) return '🤍'
    return '⚪'
}

function getRandomMessage(npc, type) {
    const messages = {
        'already_helped': [
            "Terima kasih sudah membantu tadi, tapi aku sudah cukup untuk hari ini.",
            "Kamu sudah banyak membantu hari ini, istirahatlah. Besok kita lanjut lagi.",
            "Aku sangat menghargai bantuanmu, tapi sekarang aku bisa handle sendiri.",
            "Thanks for today's help! Datang lagi besok ya.",
            "Sudah cukup untuk hari ini, teman. Sampai jumpa besok!"
        ],
        'working_hard': [
            "Wah, kamu bekerja keras sekali hari ini!",
            "Aku kagum dengan dedikasimu!",
            "Terima kasih sudah membantu dengan sungguh-sungguh.",
            "Kamu orang yang bisa diandalkan!"
        ],
        'encouragement': [
            `Seperti yang selalu ku bilang: "${npc.dialogue.personality_trait}"`,
            "Tetap semangat ya!",
            "Kamu pasti bisa!",
            "Aku percaya sama kamu!"
        ]
    }
    
    const typeMessages = messages[type] || ["Terima kasih atas bantuannya!"]
    return typeMessages[Math.floor(Math.random() * typeMessages.length)]
}

function generateProgressBar(percentage, length = 10) {
    const filled = Math.floor((percentage / 100) * length)
    const empty = length - filled
    return '█'.repeat(filled) + '░'.repeat(empty)
}