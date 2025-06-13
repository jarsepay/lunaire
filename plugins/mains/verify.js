import { forbiddenWords } from '../../setting.js'

export const cmd = {
    name: ['verify'],
    command: ['verify'],
    category: ['main'],
    detail: {
        desc: 'Verifikasikan diri ke database bot.'
    },
    setting: {
        isBanned: false,
        isJail: false
    },
    async start({ m, db, prefix, command, args, conn }) {
        const forMembership = ['clark', 'yehaziel']
        const user = db.users.get(m.sender)
        const cmd = args[0]?.toLowerCase() || ''
        const nameText = args.slice(1).join(' ').trim()

        const membershipBenefits = {
            basic: {
                nameChangesPerMonth: 0,
                maxNameLength: 40,
                specialCharacters: false,
                changeCooldown: 14 * 24 * 60 * 60 * 1000 // 14 hari
            },
            plus: {
                nameChangesPerMonth: 3,
                maxNameLength: 50,
                specialCharacters: true,
                changeCooldown: 7 * 24 * 60 * 60 * 1000 // 7 hari
            },
            pro: {
                nameChangesPerMonth: 10,
                maxNameLength: 60,
                specialCharacters: true,
                changeCooldown: 1 * 24 * 60 * 60 * 1000 // 1 hari
            }
        }

        const getUserMembershipLevel = () => {
            if (user.membership?.pro?.status) return 'pro'
            if (user.membership?.plus?.status) return 'plus'
            return 'basic'
        }

        const getCurrentBenefits = () => {
            return membershipBenefits[getUserMembershipLevel()]
        }

        const capitalizeFirstLetter = (str) => {
            return str.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ')
        }

        const suggestSimilarNames = (invalidName) => {
            if (!invalidName) return []
            
            const suggestions = []
            
            // Remove invalid characters
            const cleanName = invalidName.replace(/[^a-zA-Z\s]/g, '').trim()
            if (cleanName && cleanName !== invalidName) {
                suggestions.push(cleanName)
            }
            
            // Split into words and take first two
            const words = cleanName.split(/\s+/).filter(w => w.length > 0)
            if (words.length > 2) {
                suggestions.push(`${words[0]} ${words[1]}`)
            }
            
            // If only one word, suggest common last names
            if (words.length === 1 && words[0].length >= 3) {
                const commonLastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson']
                suggestions.push(`${words[0]} ${commonLastNames[Math.floor(Math.random() * commonLastNames.length)]}`)
            }
            
            // Length adjustments
            if (cleanName.length > getCurrentBenefits().maxNameLength) {
                const truncated = cleanName.substring(0, getCurrentBenefits().maxNameLength).trim()
                if (truncated.split(' ').length >= 2) {
                    suggestions.push(truncated)
                }
            }
            
            return [...new Set(suggestions)].filter(name => validateName(name) === null).slice(0, 3)
        }

        const validateName = (name) => {
            if (!name) return 'Nama tidak boleh kosong.'
            
            const benefits = getCurrentBenefits()
            
            if (name.length < 3 || name.length > benefits.maxNameLength) {
                return `Nama harus 3-${benefits.maxNameLength} karakter`
            }
            
            const nameRegex = benefits.specialCharacters ? /^[a-zA-Z\s.'"-]+$/ : /^[a-zA-Z\s]+$/
            if (!nameRegex.test(name)) {
                return benefits.specialCharacters 
                    ? 'Nama hanya boleh berisi huruf, spasi, dan karakter khusus (.\'"-).' 
                    : 'Nama hanya boleh berisi huruf dan spasi.'
            }
            
            const nameParts = name.split(/\s+/).filter(part => part.length > 0)
            if (nameParts.length !== 2) return 'Format: nama_depan nama_belakang'
            
            if (forbiddenWords.some(word => name.toLowerCase().includes(word))) {
                db.users.update(m.sender, { warn: (user.warn || 0) + 1 })
                db.save()
                return 'Kata yang digunakan dilarang, gunakan kata positif.'
            }
            
            return null
        }

        const checkNameChangeCooldown = () => {
            const lastChange = user.playerStats?.lastNameChange || 0
            const cooldown = getCurrentBenefits().changeCooldown
            const timeLeft = cooldown - (Date.now() - lastChange)
            
            if (timeLeft > 0) {
                const days = Math.ceil(timeLeft / (24 * 60 * 60 * 1000))
                const hours = Math.ceil((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
                return {
                    blocked: true,
                    timeLeft: days > 0 ? `${days} hari` : `${hours} jam`
                }
            }
            
            return { blocked: false }
        }

        const checkMembershipName = (name) => {
            return forMembership.some(nama => name.toLowerCase().includes(nama)) && 
                   !user.membership?.plus?.status && 
                   !user.membership?.pro?.status
        }

        const getRandomLocation = () => {
            const locations = [
                'Los Angeles:United States', 'Toronto:Canada', 'Las Vegas:United States',
                'New York:United States', 'London:United Kingdom', 'Tokyo:Japan',
                'Miami:United States', 'Paris:France', 'Amsterdam:Netherlands',
                'Seoul:South Korea', 'Shanghai:China'
            ]
            const [city, region] = locations[Math.floor(Math.random() * locations.length)].split(':')
            return { city, region }
        }

        const displayMembershipBenefits = () => {
            const currentLevel = getUserMembershipLevel()
            const benefits = getCurrentBenefits()
            
            let benefitText = `\n\n💎 *\`MEMBERSHIP BENEFIT (${currentLevel.toUpperCase()})\`*\n`
            benefitText += `• Max nama: ${benefits.maxNameLength} karakter\n`
            benefitText += `• Perubahan nama: ${benefits.nameChangesPerMonth === 0 ? 'Tidak tersedia' : benefits.nameChangesPerMonth + '/bulan'}\n`
            benefitText += `• Karakter khusus: ${benefits.specialCharacters ? '✅' : '❌'}\n`
            benefitText += `• Cooldown: ${benefits.changeCooldown / (24 * 60 * 60 * 1000)} hari\n`
            
            if (currentLevel === 'basic') {
                benefitText += `\n🔥 *Upgrade ke PLUS/PRO untuk mengakses lebih banyak fitur dan benefit!*`
            }
            
            return benefitText
        }

        let caption = ''

        switch (cmd) {
            case 'name':
                if (!nameText) {
                    caption = `Gunakan: \`${prefix + command} ${cmd} Andy Morris\``
                    caption += displayMembershipBenefits()
                    break
                }

                const nameError = validateName(nameText)
                if (nameError) {
                    caption = `❌ ${nameError}`
                    
                    const suggestions = suggestSimilarNames(nameText)
                    if (suggestions.length > 0) {
                        caption += `\n\n*Saran Nama:*\n`
                        suggestions.forEach((suggestion, index) => {
                            caption += `${index + 1}. ${capitalizeFirstLetter(suggestion)}\n`
                        })
                    }
                    
                    caption += displayMembershipBenefits()
                    break
                }

                if (user.playerInfo?.namaLengkap) {
                    caption = `Nama sudah terdaftar: *${user.playerInfo.namaLengkap}*\n`
                    caption += `Gunakan: \`${prefix + command} changename\` untuk mengubah nama.`
                    
                    if (!user.membership?.plus?.status && !user.membership?.pro?.status) {
                        caption += ` (khusus Membership Plus/Pro)`
                    }
                    break
                }

                if (checkMembershipName(nameText)) {
                    caption = 'Nama/marga ini khusus untuk pengguna Membership Plus/Pro'
                    caption += displayMembershipBenefits()
                    break
                }

                const location = getRandomLocation()
                const formattedName = capitalizeFirstLetter(nameText)

                db.users.update(m.sender, {
                    nama: m.pushName,
                    playerStatus: { 
                        registered: true, 
                        kewarganegaraan: location.region 
                    },
                    playerInfo: { 
                        namaLengkap: formattedName,
                        exp: (user.playerInfo?.exp || 0) + 100
                    },
                    playerLocation: { city: location.city, country: location.region },
                    playerStats: {
                        ...user.playerStats,
                        registrationDate: Date.now(),
                        nameChanges: 0
                    },
                    playerInventory: {
                        ...user.playerInventory,
                        items: {
                            ...user.playerInventory?.items,
                            uang: (user.playerInventory?.items?.uang || 0) + 100
                        }
                    }
                })
                db.save()
                
                caption = `Nama berhasil dibuat: *${formattedName}*`
                caption += `\n*Bonus Registrasi:*`
                caption += `\n• +100 EXP`
                caption += `\n• +$100`
                caption += `\n• Lokasi: ${location.city}, ${location.region}`
                break

            case 'changename':
            case 'cn':
                if (!user.membership?.plus?.status && !user.membership?.pro?.status) {
                    caption = 'Fitur ini hanya untuk pengguna Membership Plus/Pro'
                    caption += displayMembershipBenefits()
                    break
                }

                const cooldownCheck = checkNameChangeCooldown()
                if (cooldownCheck.blocked) {
                    caption = `Tunggu ${cooldownCheck.timeLeft} lagi untuk mengubah nama`
                    caption += displayMembershipBenefits()
                    break
                }

                if (!nameText) {
                    caption = `Gunakan: \`${prefix + command} ${cmd} Andy Morris\``
                    caption += displayMembershipBenefits()
                    break
                }

                const changeNameError = validateName(nameText)
                if (changeNameError) {
                    caption = `❌ ${changeNameError}`
                    
                    const changeSuggestions = suggestSimilarNames(nameText)
                    if (changeSuggestions.length > 0) {
                        caption += `\n\n*Saran Nama:*\n`
                        changeSuggestions.forEach((suggestion, index) => {
                            caption += `${index + 1}. ${capitalizeFirstLetter(suggestion)}\n`
                        })
                    }
                    
                    caption += displayMembershipBenefits()
                    break
                }

                const newFormattedName = capitalizeFirstLetter(nameText)
                const oldName = user.playerInfo?.namaLengkap
                
                db.users.update(m.sender, { 
                    playerInfo: { namaLengkap: newFormattedName }, 
                    nama: m.pushName,
                    playerStats: {
                        ...user.playerStats,
                        lastNameChange: Date.now(),
                        nameChanges: (user.playerStats?.nameChanges || 0) + 1,
                        nameHistory: [
                            ...(user.playerStats?.nameHistory || []),
                            {
                                oldName: oldName,
                                newName: newFormattedName,
                                timestamp: Date.now()
                            }
                        ]
                    }
                })
                db.save()
                
                caption = `Nama berhasil diubah: *${newFormattedName}*`
                caption += `\nNama sebelumnya: ${oldName}`
                break

            default:
                const membershipList = forMembership
                    .map((nama, index) => `${index + 1}. ${capitalizeFirstLetter(nama)}`)
                    .join('\n')

                caption = `📑 *\`DAFTAR PERINTAH\`*\n\n`

                caption += `*Contoh:* \`${prefix + command} name Tom Clarke\`\n`
                caption += `*Prefix:* \`${prefix}\`\n\n`

                if (!user.playerInfo?.namaLengkap) {
                    caption += `• \`${command} name\` - Daftarkan nama\n\n`
                } else {
                    caption += `• \`${command} changename\` - Ubah nama [PLUS/PRO]\n\n`
                }
                
                caption += `*Nama/Marga khusus Membership:*\n${membershipList}`
                caption += displayMembershipBenefits()
        }

        conn.sendMessage(m.from, { text: caption.trim() })
    }
}