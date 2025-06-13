import axios from 'axios'
import FormData from 'form-data'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'

const getBankDB = () => {
    const bankPath = path.join(process.cwd(), 'json', 'bank.json')
    let bankDB = {}
    
    try {
        if (fs.existsSync(bankPath)) {
            bankDB = JSON.parse(fs.readFileSync(bankPath, 'utf8'))
        }
    } catch (error) {
        bankDB = {}
    }
    
    return bankDB
}

const saveBankDB = (bankDB) => {
    const bankPath = path.join(process.cwd(), 'json', 'bank.json')
    fs.writeFileSync(bankPath, JSON.stringify(bankDB, null, 2))
}

const getWalletDB = () => {
    const walletPath = path.join(process.cwd(), 'json', 'wallet.json')
    let walletDB = {}
    
    try {
        if (fs.existsSync(walletPath)) {
            walletDB = JSON.parse(fs.readFileSync(walletPath, 'utf8'))
        }
    } catch (error) {
        walletDB = {}
    }
    
    return walletDB
}

const saveWalletDB = (walletDB) => {
    const walletPath = path.join(process.cwd(), 'json', 'wallet.json')
    fs.writeFileSync(walletPath, JSON.stringify(walletDB, null, 2))
}

const generateOTP = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
}

const uploadImageToImgBB = async (buffer) => {
    try {
        const form = new FormData()
        form.append('image', buffer, {
            filename: 'qrcode.png',
            contentType: 'image/png'
        })
        
        const response = await axios.post('https://api.imgbb.com/1/upload?key=7ed0f8d9257ac0d96d908e2935a1d224', form, {
            headers: form.getHeaders()
        })
        
        const link = response.data.data
        return link.url
    } catch (error) {
        console.error('Error uploading image:', error)
        return null
    }
}

const createQRCode = async (data) => {
    try {
        const qrBuffer = await QRCode.toBuffer(data, {
            width: 400,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        })
        return qrBuffer
    } catch (error) {
        console.error('Error creating QR code:', error)
        return null
    }
}

const saveTransactionData = (transactionId, data) => {
    const transactionPath = path.join(process.cwd(), 'json', 'transactions.json')
    let transactions = {}
    
    try {
        if (fs.existsSync(transactionPath)) {
            transactions = JSON.parse(fs.readFileSync(transactionPath, 'utf8'))
        }
    } catch (error) {
        transactions = {}
    }
    
    transactions[transactionId] = {
        ...data,
        createdAt: new Date().toISOString(),
        used: false
    }
    
    fs.writeFileSync(transactionPath, JSON.stringify(transactions, null, 2))
}

export const cmd = {
    name: ['wallet'],
    command: ['wallet', 'em'],
    category: ['roleplay'],
    detail: {
        desc: 'Digital Wallet'
    },
    setting: {
        isRegister: true,
        isBanned: false,
        isJail: false
    },
    async start({ m, db, prefix, command, conn, args }) {
        const user = db.users.get(m.sender)
        const subCmd = (args[0] || '').toLowerCase()
        
        const walletDB = getWalletDB()
        const bankDB = getBankDB()
        let currentWallet = null
        let currentWalletId = null
        let currentBank = null
        let caption = ''
        
        if (user.loggedWallet) {
            currentWalletId = user.loggedWallet
            currentWallet = walletDB[currentWalletId]
        
            if (!currentWallet) {
                delete user.loggedWallet
                db.users.update(m.sender, user)
                db.save()
            }
        }

        const banks = {
            american: [
                { code: 'sigma', name: 'Sigma Bank', country: 'USA' },
                { code: 'bofa', name: 'Bank of America', country: 'USA' },
                { code: 'omi', name: 'Ominous Bank', country: 'USA' },
                { code: 'citi', name: 'CitiBank', country: 'USA' },
                { code: 'royal', name: 'Royal Gold Bank', country: 'CA' },
                { code: 'nova', name: 'NovaBank', country: 'CA' }
            ],
            european: [
                { code: 'hsc', name: 'HSC Bank', country: 'UK' },
                { code: 'barclays', name: 'Barclays Bank', country: 'UK' },
                { code: 'bnp', name: 'BNP Loure', country: 'FR' },
                { code: 'ing', name: 'ING Bank', country: 'NL' }
            ],
            asian: [
                { code: 'tokyo', name: 'Tokyo Bank', country: 'JP' },
                { code: 'boc', name: 'Bank of China', country: 'CN' },
                { code: 'shang', name: 'Shang Bank', country: 'CN' },
                { code: 'zoho', name: 'Zoho Bank', country: 'CN' },
                { code: 'nichi', name: 'NichiBank', country: 'JP' },
                { code: 'shi', name: 'Shishui Bank', country: 'KR' },
                { code: 'sov', name: 'SOV Bank', country: 'KR' }
            ]
        }

        const currencySymbols = {
            usd: '$', eur: '€', gbp: '£', jpy: '¥',
            cad: 'C$', krw: '₩', cny: '¥'
        }

        const formatCurrency = (amount, currency) => {
            return `${currencySymbols[currency]}${amount.toLocaleString()}`
        }

        // cek rekening bank user
        const bankAccountId = `${user.loggedWallet}_bank`
        if (bankDB[bankAccountId]) {
            currentBank = bankDB[bankAccountId]
        }

        switch (subCmd) {
            case 'register':
                if (currentWallet) {
                    caption = 'Logout dulu sebelum bikin akun baru.'
                    break
                }

                if (!args[1] || !args[2]) {
                    caption = `Gunakan: \`${prefix}${command} register [nomor_hp] [pin_6_digit]\``
                    break
                }

                const phoneNumber = args[1]
                const pin = args[2]

                if (pin.length !== 6 || !/^\d+$/.test(pin)) {
                    caption = 'PIN harus 6 digit angka.'
                    break
                }

                // cek nomor hp udah ada atau belum
                const existingWallet = Object.values(walletDB).find(wallet => 
                    wallet.phoneNumber === phoneNumber
                )

                if (existingWallet) {
                    caption = 'Nomor HP udah kepake. Pake login aja buat masuk akun.'
                    break
                }

                // bikin wallet ID baru
                const walletId = `wallet_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
            
                // simpen wallet baru ke database
                walletDB[walletId] = {
                    registered: true,
                    pin: pin,
                    balance: {
                        usd: 100, eur: 0, gbp: 0, jpy: 0,
                        cad: 0, krw: 0, cny: 0
                    },
                    selectedBank: null,
                    phoneNumber: phoneNumber,
                    transactions: [],
                    createdBy: m.sender,
                    createdAt: new Date().toISOString()
                }

                saveWalletDB(walletDB)

                // auto login abis register
                user.loggedWallet = walletId
                db.users.update(m.sender, user)
                db.save()

                caption = `
✅ *\`REGISTRASI BERHASIL!\`*

👤 *Detail Akun:*
• HP: ${phoneNumber}
• PIN: ••••••
• Bonus Welcome: $100
• Wallet ID: ${walletId}

Kamu udah otomatis login. Gunakan: \`${prefix}${command} banks\` buat pilih bank.`
                break

            case 'login':
                if (currentWallet) {
                    caption = `Kamu udah login sebagai ${currentWallet.phoneNumber}. Gunakan \`${prefix}${command} logout\` buat logout dulu.`
                    break
                }

                if (!args[1] || !args[2]) {
                    caption = `Gunakan: \`${prefix}${command} login [nomor_hp] [pin]\``
                    break
                }

                const loginPhone = args[1]
                const loginPin = args[2]

                // cari wallet berdasarkan nomor hp
                const loginWalletId = Object.keys(walletDB).find(id => 
                    walletDB[id].phoneNumber === loginPhone
                )

                if (!loginWalletId) {
                    caption = 'Akun ga ketemu.'
                    break
                }

                const loginWallet = walletDB[loginWalletId]
            
                if (loginWallet.pin !== loginPin) {
                    caption = 'PIN salah!'
                    break
                }

                // set status login
                user.loggedWallet = loginWalletId
                db.users.update(m.sender, user)
                db.save()

                caption = `
✅ *\`LOGIN BERHASIL!\`*

👤 *Welcome back:*
• HP: ${loginWallet.phoneNumber}
• Bank: ${loginWallet.selectedBank?.name || 'Belum pilih bank'}

Sekarang kamu bisa pake semua fitur wallet.`
                break

            case 'logout':
                if (!currentWallet) {
                    caption = 'Kamu belum login ke akun manapun.'
                    break
                }

                delete user.loggedWallet
                db.users.update(m.sender, user)
                db.save()

                caption = 'Berhasil logout dari akun wallet.'
                break

            case 'banks':
                if (!currentWallet) {
                    caption = `Login dulu ke akun wallet. Gunakan: \`${prefix}${command} login [nomor_hp] [pin]\``
                    break
                }

                caption = '🏦 *\`DAFTAR BANK YANG TERSEDIA\`*\n\n'
                
                caption += '🇺🇸 *AMERICAN BANKS:*\n'
                banks.american.forEach((bank, index) => {
                    caption += `${index + 1}. ${bank.name} (${bank.code})\n`
                })
                
                caption += '\n🇪🇺 *EUROPEAN BANKS:*\n'
                banks.european.forEach((bank, index) => {
                    caption += `${banks.american.length + index + 1}. ${bank.name} (${bank.code})\n`
                })

                caption += '\n🇯🇵 *ASIAN BANKS:*\n'
                banks.asian.forEach((bank, index) => {
                    caption += `${banks.american.length + banks.european.length + index + 1}. ${bank.name} (${bank.code})\n`
                })
                
                caption += `\nGunakan: \`${prefix + command} selectbank [kode_bank]\` buat pilih bank.`
                break

            case 'selectbank':
                if (!currentWallet) {
                    caption = `Login dulu ke akun wallet. Gunakan: \`${prefix}${command} login [nomor_hp] [pin]\``
                    break
                }

                if (!args[1]) {
                    caption = `Gunakan: \`${prefix}${command} selectbank [kode_bank]\`\nContoh: \`${prefix}${command} selectbank omi\``
                    break
                }

                const bankCode = args[1].toLowerCase()
                const allBanks = [...banks.american, ...banks.european, ...banks.asian]
                const selectedBank = allBanks.find(bank => bank.code === bankCode)

                if (!selectedBank) {
                    caption = `Bank ga ada. Gunakan \`${prefix + command} banks\` buat liat daftar bank.`
                    break
                }

                currentWallet.selectedBank = selectedBank
                walletDB[currentWalletId] = currentWallet
                saveWalletDB(walletDB)

                caption = `
✅ *BANK DIPILIH!*

• *Bank:* ${selectedBank.name}
• *Negara:* ${selectedBank.country}
• *Kode:* ${selectedBank.code}

Sekarang kamu bisa pake semua layanan bank.`
                break

            case 'balance':
                if (!currentWallet) {
                    caption = `Login dulu ke akun wallet. Gunakan: \`${prefix}${command} login [nomor_hp] [pin]\``
                    break
                }

                caption = '💰 *\`SALDO E-WALLET\`*\n\n'
            
                Object.entries(currentWallet.balance).forEach(([currency, amount]) => {
                    caption += `${currencySymbols[currency]} ${currency.toUpperCase()}: ${formatCurrency(amount, currency)}\n`
                })
            
                if (currentWallet.selectedBank) {
                    caption += `\n• *Bank:* ${currentWallet.selectedBank.name}`
                }
            
                caption += `\n• *Akun:* ${currentWallet.phoneNumber}`
                break

            case 'topup':
                if (!currentWallet) {
                    caption = `Login dulu ke akun wallet. Gunakan: \`${prefix}${command} login [nomor_hp] [pin]\``
                    break
                }

                if (!args[1] || !args[2]) {
                    caption = `Gunakan: \`${prefix}${command} topup [mata_uang] [jumlah]\`\nContoh: \`${prefix}${command} topup usd 100\``
                    break
                }

                const topupCurrency = args[1].toLowerCase()
                const topupAmount = parseFloat(args[2])

                if (!currencySymbols[topupCurrency]) {
                    caption = 'Mata uang ga tersedia. Gunakan: \`USD, EUR, GBP, JPY, CAD, KRW, CNY\`'
                    break
                }

                if (isNaN(topupAmount) || topupAmount <= 0) {
                    caption = 'Jumlah ga valid.'
                    break
                }

                currentWallet.balance[topupCurrency] += topupAmount
                currentWallet.transactions.push({
                    type: 'topup',
                    currency: topupCurrency,
                    amount: topupAmount,
                    performedBy: m.sender,
                    timestamp: new Date().toISOString()
                })
            
                walletDB[currentWalletId] = currentWallet
                saveWalletDB(walletDB)

                caption = `
✅ *TOP UP BERHASIL!*

• Jumlah: ${formatCurrency(topupAmount, topupCurrency)}
• Saldo Baru: ${formatCurrency(currentWallet.balance[topupCurrency], topupCurrency)}
• Bank: ${currentWallet.selectedBank?.name || 'Belum pilih bank'}`
                break

            case 'transfer':
                if (!currentWallet) {
                    caption = `Login dulu ke akun wallet. Gunakan: \`${prefix}${command} login [nomor_hp] [pin]\``
                    break
                }

                if (!args[1] || !args[2] || !args[3]) {
                    caption = `Gunakan: \`${prefix + command} transfer [@user] [mata_uang] [jumlah]\`\nContoh: \`${prefix + command} transfer @628123456789 usd 50\``
                    break
                }

                const targetUser = args[1].replace('@', '') + '@s.whatsapp.net'
                const transferCurrency = args[2].toLowerCase()
                const transferAmount = parseFloat(args[3])

                if (!currencySymbols[transferCurrency]) {
                    caption = 'Mata uang ga tersedia. Gunakan: \`USD, EUR, GBP, JPY, CAD, KRW, CNY\`'
                    break
                }

                if (isNaN(transferAmount) || transferAmount <= 0) {
                    caption = 'Jumlah ga valid.'
                    break
                }

                if (currentWallet.balance[transferCurrency] < transferAmount) {
                    caption = `Saldo ga cukup. Kamu cuma punya ${formatCurrency(currentWallet.balance[transferCurrency], transferCurrency)}`
                    break
                }

                const targetUserData = db.users.get(targetUser)
                if (!targetUserData?.loggedWallet) {
                    caption = 'Target user belum login ke akun wallet.'
                    break
                }

                const targetWallet = walletDB[targetUserData.loggedWallet]
                if (!targetWallet) {
                    caption = 'Target wallet ga ketemu.'
                    break
                }

                currentWallet.balance[transferCurrency] -= transferAmount
                targetWallet.balance[transferCurrency] += transferAmount

                currentWallet.transactions.push({
                    type: 'transfer_out',
                    target: targetUserData.loggedWallet,
                    targetPhone: targetWallet.phoneNumber,
                    currency: transferCurrency,
                    amount: transferAmount,
                    performedBy: m.sender,
                    timestamp: new Date().toISOString()
                })

                targetWallet.transactions.push({
                    type: 'transfer_in',
                    from: currentWalletId,
                    fromPhone: currentWallet.phoneNumber,
                    currency: transferCurrency,
                    amount: transferAmount,
                    receivedBy: targetUser,
                    timestamp: new Date().toISOString()
                })

                walletDB[currentWalletId] = currentWallet
                walletDB[targetUserData.loggedWallet] = targetWallet
                saveWalletDB(walletDB)

                caption = `
✅ *\`TRANSFER BERHASIL!\`*

• Jumlah: ${formatCurrency(transferAmount, transferCurrency)}
• Dari: ${currentWallet.phoneNumber}
• Ke: ${targetWallet.phoneNumber}
• Sisa Saldo: ${formatCurrency(currentWallet.balance[transferCurrency], transferCurrency)}`
                break

            case 'qr':
                if (!currentWallet) {
                    caption = `Login dulu ke akun wallet. Gunakan: \`${prefix}${command} login [nomor_hp] [pin]\``
                    break
                }

                if (!args[1] || !args[2]) {
                    caption = `Gunakan: \`${prefix + command} qr [mata_uang] [jumlah]\`\nContoh: \`${prefix + command} qr usd 50\``
                    break
                }

                const qrCurrency = args[1].toLowerCase()
                const qrAmount = parseFloat(args[2])

                if (!currencySymbols[qrCurrency]) {
                    caption = 'Mata uang ga tersedia. Gunakan: \`USD, EUR, GBP, JPY, CAD, KRW, CNY\`'
                    break
                }

                if (isNaN(qrAmount) || qrAmount <= 0) {
                    caption = 'Jumlah ga valid'
                    break
                }

                const transactionId = generateOTP()
                const waNumber = conn.user.jid.split('@')[0]
                const qrData = `wa.me/${waNumber}?text=REQUEST_${transactionId}`

                saveTransactionData(transactionId, {
                    type: 'request',
                    requester: m.sender,
                    currency: qrCurrency,
                    amount: qrAmount,
                    status: 'pending'
                })

                try {
                    const qrBuffer = await createQRCode(qrData)
                    const imageUrl = await uploadImageToImgBB(qrBuffer)
                    
                    caption = `
📨 *\`QR CODE REQUEST\`*

• Jumlah: ${formatCurrency(qrAmount, qrCurrency)}
• ID Request: ${transactionId}
• Valid selama: 30 menit

*Instruksi:*
1. Bagikan kode QR ini ke yang mau bayar
2. Mereka scan dan approve pembayaran lewat WhatsApp
3. Saldo bakal masuk ke e-wallet kamu

🔗 Direct Link: ${qrData}`

                    if (imageUrl) {
                        await conn.sendMessage(m.chat, {
                            image: { url: imageUrl },
                            caption: caption.trim()
                        })
                        return
                    }
                } catch (error) {
                    caption = 'Gagal bikin QR code. Coba lagi.'
                }
                break

            case 'history':
                if (!currentWallet) {
                    caption = `Login dulu ke akun wallet. Gunakan: \`${prefix}${command} login [nomor_hp] [pin]\``
                    break
                }

                if (currentWallet.transactions.length === 0) {
                    caption = 'Ga ada riwayat transaksi.'
                    break
                }

                caption = '📋 *\`RIWAYAT TRANSAKSI\`*\n\n'
                
                currentWallet.transactions.slice(-10).reverse().forEach((tx, index) => {
                    const date = new Date(tx.timestamp).toLocaleDateString()
                    const time = new Date(tx.timestamp).toLocaleTimeString()
                    
                    caption += `${index + 1}. `
                    
                    switch (tx.type) {
                        case 'topup':
                            caption += `💳 Top Up: +${formatCurrency(tx.amount, tx.currency)}`
                            break
                        case 'transfer_out':
                            caption += `💸 Terkirim: -${formatCurrency(tx.amount, tx.currency)} ke ${tx.targetPhone}`
                            break
                        case 'transfer_in':
                            caption += `💰 Diterima: +${formatCurrency(tx.amount, tx.currency)} dari ${tx.fromPhone}`
                            break
                        case 'withdrawal':
                            caption += `🏦 Tarik Tunai: -${formatCurrency(tx.amount, tx.currency)}`
                            break
                        default:
                            caption += `${tx.type}: ${formatCurrency(tx.amount, tx.currency)}`
                    }
                    
                    caption += `\n   📅 ${date} ${time}\n\n`
                })
                break

            case 'withdraw':
                if (!currentWallet) {
                    caption = `Login dulu ke akun wallet. Gunakan: \`${prefix}${command} login [nomor_hp] [pin]\``
                    break
                }

                if (!currentWallet.selectedBank) {
                    caption = 'Pilih bank dulu sebelum tarik tunai. Gunakan: \`${prefix}${command} selectbank [kode_bank]\`'
                    break
                }

                if (!args[1] || !args[2]) {
                    caption = `Gunakan: \`${prefix}${command} withdraw [mata_uang] [jumlah]\`\nContoh: \`${prefix}${command} withdraw usd 100\``
                    break
                }

                const withdrawCurrency = args[1].toLowerCase()
                const withdrawAmount = parseFloat(args[2])

                if (!currencySymbols[withdrawCurrency]) {
                    caption = 'Mata uang ga tersedia. Gunakan: \`USD, EUR, GBP, JPY, CAD, KRW, CNY\`'
                    break
                }

                if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
                    caption = 'Jumlah ga valid.'
                    break
                }

                if (currentWallet.balance[withdrawCurrency] < withdrawAmount) {
                    caption = `Saldo ga cukup. Kamu cuma punya ${formatCurrency(currentWallet.balance[withdrawCurrency], withdrawCurrency)}`
                    break
                }

                currentWallet.balance[withdrawCurrency] -= withdrawAmount
                currentBank.balance[withdrawCurrency] += withdrawAmount

                currentWallet.transactions.push({
                    type: 'withdrawal',
                    bank: currentWallet.selectedBank.code,
                    currency: withdrawCurrency,
                    amount: withdrawAmount,
                    withdrawnBy: m.sender,
                    timestamp: new Date().toISOString()
                })

                walletDB[currentWalletId] = currentWallet
                bankDB[bankAccountId] = currentBank
                
                saveWalletDB(walletDB)
                saveBankDB(bankDB)

                caption = `
✅ *\`WITHDRAWAL BERHASIL!\`*

• Jumlah: ${formatCurrency(withdrawAmount, withdrawCurrency)}
• Tujuan: ${currentWallet.selectedBank.name}
• Sisa Saldo: ${formatCurrency(currentWallet.balance[withdrawCurrency], withdrawCurrency)}
• Waktu Proses: 5 menit kerja. Paling lambat 24 jam`
                break

            case 'changepin':
                if (!currentWallet) {
                    caption = `Login dulu ke akun wallet. Gunakan: \`${prefix}${command} login [nomor_hp] [pin]\``
                    break
                }

                if (!args[1] || !args[2]) {
                    caption = `Gunakan: \`${prefix}${command} changepin [pin_lama] [pin_baru]\``
                    break
                }

                const oldPin = args[1]
                const newPin = args[2]

                if (oldPin !== currentWallet.pin) {
                    caption = 'PIN lama salah!'
                    break
                }

                if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
                    caption = 'PIN baru harus 6 digit angka'
                    break
                }

                currentWallet.pin = newPin
                walletDB[currentWalletId] = currentWallet
                saveWalletDB(walletDB)

                caption = 'PIN berhasil diganti.'
                break

            case 'profile':
                if (!currentWallet) {
                    caption = `Login dulu ke akun wallet. Gunakan: \`${prefix}${command} login [nomor_hp] [pin]\``
                    break
                }

                const totalTransactions = currentWallet.transactions.length
                const totalBalance = Object.values(currentWallet.balance).reduce((sum, amount) => sum + amount, 0)

                caption = `
👤 *\`MY E-WALLET\`*

• HP: ${currentWallet.phoneNumber}
• Bank: ${currentWallet.selectedBank?.name || 'Belum pilih bank'}
• Total Transaksi: ${totalTransactions}
• Total Nilai Portfolio: ~$${totalBalance.toFixed(2)}

📋 *Status Akun:*
• Terdaftar: ${currentWallet.registered ? 'Ya' : 'Tidak'}
• PIN: ****** (Terlindungi)`
                break

            default:
                caption = `
🏦 *\`DAFTAR PERINTAH\`*
${currentWallet ? `✅ *Status: Login sebagai ${currentWallet.phoneNumber}*` : '❌ *Status: Belum Login*'}

${!currentWallet ? `*Authentication:*
• \`${command} register\` - Registrasi akun baru
• \`${command} login\` - Login ke akun existing` : `
💳 *Account Management:*
• \`${command} balance\` - Cek saldo
• \`${command} topup\` - Tambah uang ke e-wallet
• \`${command} transfer\` - Transfer uang ke sesama
• \`${command} history\` - Riwayat transaksi
• \`${command} logout\` - Logout dari akun

🏦 *Banking Services:*
• \`${command} banks\` - Lihat bank yang tersedia
• \`${command} selectbank\` - Pilih bank pilihan kamu
• \`${command} withdraw\` - Tarik uang melalui bank

📱 *QR Code Services:*
• \`${command} qr\` - Minta dana lewat QR Code

🔧 *Settings:*
• \`${command} changepin\` - Ganti PIN kamu
• \`${command} profile\` - Lihat profil akun

💱 *Mata Uang Yang Mendukung:*
USD ($) • EUR (€) • GBP (£) • JPY (¥) • CAD (C$) • KRW (₩) • CNY (¥)
`}
`
                break
        }

        conn.sendMessage(m.from, { text: caption.trim() })
    }
}