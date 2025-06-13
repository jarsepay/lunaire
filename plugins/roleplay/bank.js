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

export const cmd = {
    name: ['bank'],
    command: ['bank', 'bnk'],
    category: ['roleplay'],
    detail: {
        desc: 'Sistem perbankan'
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
        let currentBank = null
        let caption = ''
        
        // Cek status login wallet
        if (!user.loggedWallet) {
            caption = `Kamu harus login ke wallet dulu sebelum menggunakan layanan bank.\nGunakan: \`${prefix}wallet login [nomor_hp] [pin]\``
            conn.sendMessage(m.from, { text: caption })
            return
        }
        
        currentWallet = walletDB[user.loggedWallet]
        if (!currentWallet) {
            delete user.loggedWallet
            db.users.update(m.sender, user)
            db.save()
            caption = 'Wallet tidak ditemukan. Silakan login ulang.'
            conn.sendMessage(m.from, { text: caption })
            return
        }

        // Data bank dan konfigurasi
        const banks = {
            american: [
                { code: 'sigma', name: 'Sigma Bank', country: 'USA', interestRate: 0.05, fees: { transfer: 2, loan: 0.12 }, maxLoan: 10000 },
                { code: 'bofa', name: 'Bank of America', country: 'USA', interestRate: 0.04, fees: { transfer: 3, loan: 0.15 }, maxLoan: 15000 },
                { code: 'omi', name: 'Ominous Bank', country: 'USA', interestRate: 0.06, fees: { transfer: 1, loan: 0.10 }, maxLoan: 8000 },
                { code: 'citi', name: 'CitiBank', country: 'USA', interestRate: 0.045, fees: { transfer: 2.5, loan: 0.13 }, maxLoan: 12000 },
                { code: 'royal', name: 'Royal Gold Bank', country: 'CA', interestRate: 0.055, fees: { transfer: 2, loan: 0.11 }, maxLoan: 9000 },
                { code: 'nova', name: 'NovaBank', country: 'CA', interestRate: 0.05, fees: { transfer: 1.5, loan: 0.14 }, maxLoan: 11000 }
            ],
            european: [
                { code: 'hsc', name: 'HSC Bank', country: 'UK', interestRate: 0.04, fees: { transfer: 3, loan: 0.16 }, maxLoan: 13000 },
                { code: 'barclays', name: 'Barclays Bank', country: 'UK', interestRate: 0.045, fees: { transfer: 2.5, loan: 0.14 }, maxLoan: 14000 },
                { code: 'bnp', name: 'BNP Loure', country: 'FR', interestRate: 0.035, fees: { transfer: 4, loan: 0.17 }, maxLoan: 12500 },
                { code: 'ing', name: 'ING Bank', country: 'NL', interestRate: 0.048, fees: { transfer: 2, loan: 0.13 }, maxLoan: 11500 }
            ],
            asian: [
                { code: 'tokyo', name: 'Tokyo Bank', country: 'JP', interestRate: 0.03, fees: { transfer: 1, loan: 0.09 }, maxLoan: 16000 },
                { code: 'boc', name: 'Bank of China', country: 'CN', interestRate: 0.042, fees: { transfer: 1.5, loan: 0.11 }, maxLoan: 13500 },
                { code: 'shang', name: 'Shang Bank', country: 'CN', interestRate: 0.038, fees: { transfer: 2, loan: 0.12 }, maxLoan: 12000 },
                { code: 'zoho', name: 'Zoho Bank', country: 'CN', interestRate: 0.045, fees: { transfer: 1.5, loan: 0.10 }, maxLoan: 14500 },
                { code: 'nichi', name: 'NichiBank', country: 'JP', interestRate: 0.032, fees: { transfer: 1, loan: 0.08 }, maxLoan: 17000 },
                { code: 'shi', name: 'Shishui Bank', country: 'KR', interestRate: 0.04, fees: { transfer: 2, loan: 0.13 }, maxLoan: 13000 },
                { code: 'sov', name: 'SOV Bank', country: 'KR', interestRate: 0.044, fees: { transfer: 1.5, loan: 0.12 }, maxLoan: 14000 }
            ]
        }

        const currencySymbols = {
            usd: '$', eur: '€', gbp: '£', jpy: '¥',
            cad: 'C$', krw: '₩', cny: '¥'
        }

        const formatCurrency = (amount, currency) => {
            return `${currencySymbols[currency]}${amount.toLocaleString()}`
        }

        const getAllBanks = () => [...banks.american, ...banks.european, ...banks.asian]
        const findBankByCode = (code) => getAllBanks().find(bank => bank.code === code)

        // cek rekening bank user
        const bankAccountId = `${user.loggedWallet}_bank`
        if (bankDB[bankAccountId]) {
            currentBank = bankDB[bankAccountId]
        }

        switch (subCmd) {
            case 'register':
                if (currentBank) {
                    caption = 'Kamu udah punya rekening bank. Gunakan `' + prefix + command + ' info` buat liat detail rekening.'
                    break
                }

                if (!args[1]) {
                    caption = `Gunakan: \`${prefix}${command} register [kode_bank]\`\nContoh: \`${prefix}${command} register sigma\`\n\nLihat daftar bank: \`${prefix}${command} banks\``
                    break
                }

                const registerBankCode = args[1].toLowerCase()
                const registerBank = findBankByCode(registerBankCode)

                if (!registerBank) {
                    caption = `Bank ga ketemu. Gunakan \`${prefix}${command} banks\` buat liat daftar bank.`
                    break
                }

                // Buat rekening bank baru
                bankDB[bankAccountId] = {
                    walletId: user.loggedWallet,
                    bank: registerBank,
                    balance: {
                        usd: 0, eur: 0, gbp: 0, jpy: 0,
                        cad: 0, krw: 0, cny: 0
                    },
                    transactions: [],
                    loans: [],
                    lastInterestPayout: Date.now(),
                    totalInterestEarned: 0,
                    accountNumber: `${registerBank.code.toUpperCase()}-${Date.now().toString().slice(-8)}`,
                    openedAt: new Date().toISOString(),
                    createdBy: m.sender
                }

                saveBankDB(bankDB)
                currentBank = bankDB[bankAccountId]

                caption = `
✅ *\`REKENING BERHASIL DIBUKA!\`*

🏦 *Detail Rekening:*
• Bank: ${registerBank.name}
• Negara: ${registerBank.country}
• No. Rekening: ${currentBank.accountNumber}
• Bunga Tabungan: ${(registerBank.interestRate * 100).toFixed(1)}% per hari
• Limit Pinjaman: ${formatCurrency(registerBank.maxLoan, 'usd')}

Sekarang kamu bisa menggunakan semua layanan perbankan!`
                break

            case 'banks':
                caption = '🏦 *\`DAFTAR BANK TERSEDIA\`*\n\n'
                
                caption += '🇺🇸 *AMERICAN BANKS:*\n'
                banks.american.forEach((bank, index) => {
                    caption += `${index + 1}. ${bank.name} (${bank.code})\n`
                    caption += `   • Bunga: ${(bank.interestRate * 100).toFixed(1)}%/hari\n`
                    caption += `   • Limit Pinjaman: ${formatCurrency(bank.maxLoan, 'usd')}\n\n`
                })
                
                caption += '🇪🇺 *EUROPEAN BANKS:*\n'
                banks.european.forEach((bank, index) => {
                    caption += `${banks.american.length + index + 1}. ${bank.name} (${bank.code})\n`
                    caption += `   • Bunga: ${(bank.interestRate * 100).toFixed(1)}%/hari\n`
                    caption += `   • Limit Pinjaman: ${formatCurrency(bank.maxLoan, 'usd')}\n\n`
                })

                caption += '🇯🇵 *ASIAN BANKS:*\n'
                banks.asian.forEach((bank, index) => {
                    caption += `${banks.american.length + banks.european.length + index + 1}. ${bank.name} (${bank.code})\n`
                    caption += `   • Bunga: ${(bank.interestRate * 100).toFixed(1)}%/hari\n`
                    caption += `   • Limit Pinjaman: ${formatCurrency(bank.maxLoan, 'usd')}\n\n`
                })
                
                caption += `Gunakan: \`${prefix + command} register [kode_bank]\` buat buka rekening.`
                break

            case 'deposit':
                if (!currentBank) {
                    caption = `Kamu belum punya rekening bank. Gunakan \`${prefix}${command} register [kode_bank]\` buat buka rekening dulu.`
                    break
                }

                if (!args[1] || !args[2]) {
                    caption = `Gunakan: \`${prefix}${command} deposit [mata_uang] [jumlah]\`\nContoh: \`${prefix}${command} deposit usd 100\``
                    break
                }

                const depositCurrency = args[1].toLowerCase()
                const depositAmount = parseFloat(args[2])

                if (!currencySymbols[depositCurrency]) {
                    caption = 'Mata uang ga tersedia. Gunakan: \`USD, EUR, GBP, JPY, CAD, KRW, CNY\`'
                    break
                }

                if (isNaN(depositAmount) || depositAmount <= 0) {
                    caption = 'Jumlah ga valid.'
                    break
                }

                if (currentWallet.balance[depositCurrency] < depositAmount) {
                    caption = `Saldo wallet ga cukup. Kamu cuma punya ${formatCurrency(currentWallet.balance[depositCurrency], depositCurrency)} di wallet.`
                    break
                }

                // Transfer dari wallet ke bank
                currentWallet.balance[depositCurrency] -= depositAmount
                currentBank.balance[depositCurrency] += depositAmount

                // Catat transaksi
                const depositTx = {
                    type: 'deposit',
                    currency: depositCurrency,
                    amount: depositAmount,
                    timestamp: new Date().toISOString(),
                    performedBy: m.sender
                }

                currentBank.transactions.push(depositTx)
                currentWallet.transactions.push({
                    type: 'bank_deposit',
                    bank: currentBank.bank.name,
                    currency: depositCurrency,
                    amount: depositAmount,
                    timestamp: new Date().toISOString(),
                    performedBy: m.sender
                })

                // Update database
                bankDB[bankAccountId] = currentBank
                walletDB[user.loggedWallet] = currentWallet
                saveBankDB(bankDB)
                saveWalletDB(walletDB)

                caption = `
✅ *\`SETORAN BERHASIL!\`*

• Jumlah: ${formatCurrency(depositAmount, depositCurrency)}
• Dari: E-Wallet
• Ke: ${currentBank.bank.name}
• Saldo Bank: ${formatCurrency(currentBank.balance[depositCurrency], depositCurrency)}
• Sisa Wallet: ${formatCurrency(currentWallet.balance[depositCurrency], depositCurrency)}`
                break

            case 'withdraw':
                if (!currentBank) {
                    caption = `Kamu belum punya rekening bank. Gunakan \`${prefix}${command} register [kode_bank]\` buat buka rekening dulu.`
                    break
                }

                if (!args[1] || !args[2]) {
                    caption = `Gunakan: \`${prefix}${command} withdraw [mata_uang] [jumlah]\`\nContoh: \`${prefix}${command} withdraw usd 50\``
                    break
                }

                const withdrawCurrency = args[1].toLowerCase()
                const withdrawAmount = parseFloat(args[2])

                if (withdrawCurrency !== 'usd') {
                    caption = 'Saat ini hanya bisa withdraw ke inventory dalam bentuk USD.'
                    break
                }

                if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
                    caption = 'Jumlah ga valid.'
                    break
                }

                if (currentBank.balance[withdrawCurrency] < withdrawAmount) {
                    caption = `Saldo bank ga cukup. Kamu cuma punya ${formatCurrency(currentBank.balance[withdrawCurrency], withdrawCurrency)} di bank.`
                    break
                }

                // Cek apakah bisa menambah uang ke inventory
                /*if (!db.backpack.canAdd(m.sender, 'uang', withdrawAmount)) {
                    const backpackInfo = db.backpack.getInfo(m.sender)
                    caption = `Tas kamu penuh! Tidak bisa menambah ${withdrawAmount} uang.\n`
                    caption += `Kapasitas tas: ${backpackInfo.currentWeight}/${backpackInfo.capacity} (${backpackInfo.percentage}%)\n`
                    caption += `Upgrade tas atau kosongkan inventory terlebih dahulu.`
                    break
                }*/

                // Transfer dari bank ke player inventory
                currentBank.balance[withdrawCurrency] -= withdrawAmount
                
                // Update player inventory uang
                const userData = db.users.get(m.sender)
                userData.playerInventory.items.uang += withdrawAmount
                db.users.update(m.sender, userData)

                // Catat transaksi
                const withdrawTx = {
                    type: 'withdraw_to_inventory',
                    currency: withdrawCurrency,
                    amount: withdrawAmount,
                    timestamp: new Date().toISOString(),
                    performedBy: m.sender
                }

                currentBank.transactions.push(withdrawTx)

                // Update database
                bankDB[bankAccountId] = currentBank
                saveBankDB(bankDB)
                db.save()

                caption = `
✅ *\`PENARIKAN BERHASIL!\`*

• Jumlah: ${formatCurrency(withdrawAmount, withdrawCurrency)}
• Dari: ${currentBank.bank.name}
• Ke: Inventory (Uang)
• Sisa Bank: ${formatCurrency(currentBank.balance[withdrawCurrency], withdrawCurrency)}
• Uang di Inventory: ${userData.playerInventory.items.uang.toLocaleString()}`
                break

            case 'balance':
                if (!currentBank) {
                    caption = `Kamu belum punya rekening bank. Gunakan \`${prefix}${command} register [kode_bank]\` buat buka rekening dulu.`
                    break
                }

                caption = `💰 *\`SALDO REKENING BANK\`*\n\n`
                caption += `🏦 *Bank:* ${currentBank.bank.name}\n`
                caption += `📧 *No. Rekening:* ${currentBank.accountNumber}\n\n`
            
                Object.entries(currentBank.balance).forEach(([currency, amount]) => {
                    if (amount > 0) {
                        caption += `${currencySymbols[currency]} ${currency.toUpperCase()}: ${formatCurrency(amount, currency)}\n`
                    }
                })

                const totalBalance = Object.values(currentBank.balance).reduce((sum, amount) => sum + amount, 0)
                caption += `\n💎 *Total Portfolio:* ~$${totalBalance.toFixed(2)}`
                caption += `\n📈 *Bunga Harian:* ${(currentBank.bank.interestRate * 100).toFixed(1)}%`
                caption += `\n🎯 *Total Bunga Didapat:* $${currentBank.totalInterestEarned.toFixed(2)}`
                break

            case 'transfer':
                if (!currentBank) {
                    caption = `Kamu belum punya rekening bank. Gunakan \`${prefix}${command} register [kode_bank]\` buat buka rekening dulu.`
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

                const transferFee = currentBank.bank.fees.transfer
                const totalTransferAmount = transferAmount + transferFee

                if (currentBank.balance[transferCurrency] < totalTransferAmount) {
                    caption = `Saldo ga cukup. Kamu butuh ${formatCurrency(totalTransferAmount, transferCurrency)} (termasuk biaya admin ${formatCurrency(transferFee, transferCurrency)})`
                    break
                }

                const targetUserData = db.users.get(targetUser)
                if (!targetUserData?.loggedWallet) {
                    caption = 'Target user belum login ke wallet atau belum punya rekening bank.'
                    break
                }

                const targetBankAccountId = `${targetUserData.loggedWallet}_bank`
                const targetBank = bankDB[targetBankAccountId]
                if (!targetBank) {
                    caption = 'Target user belum punya rekening bank.'
                    break
                }

                // Proses transfer
                currentBank.balance[transferCurrency] -= totalTransferAmount
                targetBank.balance[transferCurrency] += transferAmount

                // Catat transaksi
                currentBank.transactions.push({
                    type: 'transfer_out',
                    target: targetBank.accountNumber,
                    targetBank: targetBank.bank.name,
                    currency: transferCurrency,
                    amount: transferAmount,
                    fee: transferFee,
                    timestamp: new Date().toISOString(),
                    performedBy: m.sender
                })

                targetBank.transactions.push({
                    type: 'transfer_in',
                    from: currentBank.accountNumber,
                    fromBank: currentBank.bank.name,
                    currency: transferCurrency,
                    amount: transferAmount,
                    timestamp: new Date().toISOString(),
                    receivedBy: targetUser
                })

                // Update database
                bankDB[bankAccountId] = currentBank
                bankDB[targetBankAccountId] = targetBank
                saveBankDB(bankDB)

                caption = `
✅ *\`TRANSFER BERHASIL!\`*

• Jumlah: ${formatCurrency(transferAmount, transferCurrency)}
• Biaya Admin: ${formatCurrency(transferFee, transferCurrency)}
• Total Debet: ${formatCurrency(totalTransferAmount, transferCurrency)}
• Dari: ${currentBank.accountNumber}
• Ke: ${targetBank.accountNumber} (${targetBank.bank.name})
• Sisa Saldo: ${formatCurrency(currentBank.balance[transferCurrency], transferCurrency)}`
                break

            case 'loan':
                if (!currentBank) {
                    caption = `Kamu belum punya rekening bank. Gunakan \`${prefix}${command} register [kode_bank]\` buat buka rekening dulu.`
                    break
                }

                if (!args[1] || !args[2]) {
                    caption = `Gunakan: \`${prefix}${command} loan [mata_uang] [jumlah]\`\nContoh: \`${prefix}${command} loan usd 1000\`\n\nLimit pinjaman: ${formatCurrency(currentBank.bank.maxLoan, 'usd')}`
                    break
                }

                const loanCurrency = args[1].toLowerCase()
                const loanAmount = parseFloat(args[2])

                if (!currencySymbols[loanCurrency]) {
                    caption = 'Mata uang ga tersedia. Gunakan: \`USD, EUR, GBP, JPY, CAD, KRW, CNY\`'
                    break
                }

                if (isNaN(loanAmount) || loanAmount <= 0) {
                    caption = 'Jumlah ga valid.'
                    break
                }

                if (loanAmount > currentBank.bank.maxLoan) {
                    caption = `Jumlah pinjaman melebihi limit. Maksimal: ${formatCurrency(currentBank.bank.maxLoan, 'usd')}`
                    break
                }

                // Cek pinjaman aktif
                const activeLoan = currentBank.loans.find(loan => !loan.paid)
                if (activeLoan) {
                    caption = `Kamu masih punya pinjaman aktif sebesar ${formatCurrency(activeLoan.remainingAmount, activeLoan.currency)}. Bayar dulu sebelum ambil pinjaman baru.`
                    break
                }

                // Buat pinjaman baru
                const loanId = generateOTP()
                const interestRate = currentBank.bank.fees.loan
                const totalLoanAmount = loanAmount * (1 + interestRate)
                const dueDate = new Date()
                dueDate.setDate(dueDate.getDate() + 30) // 30 hari

                const loanData = {
                    id: loanId,
                    currency: loanCurrency,
                    principal: loanAmount,
                    interestRate: interestRate,
                    totalAmount: totalLoanAmount,
                    remainingAmount: totalLoanAmount,
                    dueDate: dueDate.toISOString(),
                    createdAt: new Date().toISOString(),
                    paid: false,
                    payments: []
                }

                currentBank.loans.push(loanData)
                currentBank.balance[loanCurrency] += loanAmount

                // Catat transaksi
                currentBank.transactions.push({
                    type: 'loan_disbursement',
                    loanId: loanId,
                    currency: loanCurrency,
                    amount: loanAmount,
                    interestRate: interestRate,
                    timestamp: new Date().toISOString(),
                    performedBy: m.sender
                })

                // Update database
                bankDB[bankAccountId] = currentBank
                saveBankDB(bankDB)

                caption = `
✅ *\`PINJAMAN DISETUJUI!\`*

• ID Pinjaman: ${loanId}
• Pokok Pinjaman: ${formatCurrency(loanAmount, loanCurrency)}
• Bunga: ${(interestRate * 100).toFixed(1)}%
• Total Harus Dibayar: ${formatCurrency(totalLoanAmount, loanCurrency)}
• Jatuh Tempo: ${new Date(dueDate).toLocaleDateString()}
• Saldo Bank: ${formatCurrency(currentBank.balance[loanCurrency], loanCurrency)}

⚠️ Jangan lupa bayar tepat waktu biar ga kena denda!`
                break

            case 'payloan':
                if (!currentBank) {
                    caption = `Kamu belum punya rekening bank. Gunakan \`${prefix}${command} register [kode_bank]\` buat buka rekening dulu.`
                    break
                }

                if (!args[1]) {
                    caption = `Gunakan: \`${prefix}${command} payloan [jumlah]\`\nContoh: \`${prefix}${command} payloan 500\`\n\nLihat pinjaman aktif: \`${prefix}${command} loanstatus\``
                    break
                }

                const paymentAmount = parseFloat(args[1])
                const activeLoanToPay = currentBank.loans.find(loan => !loan.paid)

                if (!activeLoanToPay) {
                    caption = 'Kamu ga punya pinjaman aktif.'
                    break
                }

                if (isNaN(paymentAmount) || paymentAmount <= 0) {
                    caption = 'Jumlah pembayaran ga valid.'
                    break
                }

                if (paymentAmount > activeLoanToPay.remainingAmount) {
                    caption = `Jumlah pembayaran melebihi sisa hutang. Sisa hutang adalah ${formatCurrency(activeLoanToPay.remainingAmount, activeLoanToPay.currency)}`
                    break
                }

                if (currentBank.balance[activeLoanToPay.currency] < paymentAmount) {
                    caption = `Saldo bank ga cukup. Kamu butuh ${formatCurrency(paymentAmount, activeLoanToPay.currency)} tapi cuma punya ${formatCurrency(currentBank.balance[activeLoanToPay.currency], activeLoanToPay.currency)}`
                    break
                }

                // Proses pembayaran
                currentBank.balance[activeLoanToPay.currency] -= paymentAmount
                activeLoanToPay.remainingAmount -= paymentAmount
                activeLoanToPay.payments.push({
                    amount: paymentAmount,
                    timestamp: new Date().toISOString(),
                    performedBy: m.sender
                })

                if (activeLoanToPay.remainingAmount <= 0) {
                    activeLoanToPay.paid = true
                    activeLoanToPay.paidAt = new Date().toISOString()
                }

                // Catat transaksi
                currentBank.transactions.push({
                    type: 'loan_payment',
                    loanId: activeLoanToPay.id,
                    currency: activeLoanToPay.currency,
                    amount: paymentAmount,
                    remainingDebt: activeLoanToPay.remainingAmount,
                    timestamp: new Date().toISOString(),
                    performedBy: m.sender
                })

                // Update database
                bankDB[bankAccountId] = currentBank
                saveBankDB(bankDB)

                caption = `
✅ *\`PEMBAYARAN PINJAMAN BERHASIL!\`*

• ID Pinjaman: ${activeLoanToPay.id}
• Jumlah Bayar: ${formatCurrency(paymentAmount, activeLoanToPay.currency)}
• Sisa Hutang: ${formatCurrency(activeLoanToPay.remainingAmount, activeLoanToPay.currency)}
• Status: ${activeLoanToPay.paid ? 'LUNAS' : 'BELUM LUNAS'}
• Saldo Bank: ${formatCurrency(currentBank.balance[activeLoanToPay.currency], activeLoanToPay.currency)}

${activeLoanToPay.paid ? '🎉 Selamat! Pinjaman kamu udah lunas!' : '⏰ Jangan lupa bayar sisa hutang tepat waktu!'}`
                break

            case 'loanstatus':
                if (!currentBank) {
                    caption = `Kamu belum punya rekening bank. Gunakan \`${prefix}${command} register [kode_bank]\` buat buka rekening dulu.`
                    break
                }

                if (currentBank.loans.length === 0) {
                    caption = 'Kamu belum pernah ambil pinjaman di bank ini.'
                    break
                }

                caption = `💳 *\`STATUS PINJAMAN\`*\n\n`
                
                const activeLoans = currentBank.loans.filter(loan => !loan.paid)
                const paidLoans = currentBank.loans.filter(loan => loan.paid)

                if (activeLoans.length > 0) {
                    caption += `⚠️ *PINJAMAN AKTIF:*\n`
                    activeLoans.forEach(loan => {
                        const dueDate = new Date(loan.dueDate)
                        const isOverdue = dueDate < new Date()
                        caption += `• ID: ${loan.id}\n`
                        caption += `• Pokok: ${formatCurrency(loan.principal, loan.currency)}\n`
                        caption += `• Total: ${formatCurrency(loan.totalAmount, loan.currency)}\n`
                        caption += `• Sisa: ${formatCurrency(loan.remainingAmount, loan.currency)}\n`
                        caption += `• Jatuh Tempo: ${dueDate.toLocaleDateString()}\n`
                        caption += `• Status: ${isOverdue ? '🔴 TERLAMBAT' : '🟡 AKTIF'}\n\n`
                    })
                }

                if (paidLoans.length > 0) {
                    caption += `✅ *PINJAMAN LUNAS:*\n`
                    paidLoans.forEach(loan => {
                        caption += `• ID: ${loan.id} - ${formatCurrency(loan.totalAmount, loan.currency)} (Lunas)\n`
                    })
                }
                break

            case 'interest': {
                if (!currentBank) {
                    caption = `Kamu belum punya rekening bank. Gunakan \`${prefix}${command} register [kode_bank]\` buat buka rekening dulu.`
                    break
                }

                const now = Date.now()
                const lastPayout = currentBank.lastInterestPayout
                const timeDiff = now - lastPayout
                const daysPassed = Math.floor(timeDiff / (1000 * 60 * 60 * 24))

                if (daysPassed < 1) {
                    const hoursLeft = 24 - Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                    caption = `Bunga baru bisa diklaim ${hoursLeft} jam lagi.`
                    break
                }

                const interestRate = currentBank.bank.interestRate
                let totalInterest = 0
                let interestDetails = '💰 *\`BUNGA HARIAN DIKLAIM!\`*\n\n'

                Object.entries(currentBank.balance).forEach(([currency, balance]) => {
                    if (balance > 0) {
                        const dailyInterest = balance * interestRate * daysPassed
                        currentBank.balance[currency] += dailyInterest
                        totalInterest += dailyInterest
                        currentBank.totalInterestEarned += dailyInterest
                        
                        interestDetails += `${currencySymbols[currency]} ${currency.toUpperCase()}: +${formatCurrency(dailyInterest, currency)}\n`
                    }
                })

                if (totalInterest === 0) {
                    caption = 'Ga ada saldo yang menghasilkan bunga.'
                    break
                }

                currentBank.lastInterestPayout = now

                // Catat transaksi bunga
                currentBank.transactions.push({
                    type: 'interest_earned',
                    amount: totalInterest,
                    days: daysPassed,
                    rate: interestRate,
                    timestamp: new Date().toISOString(),
                    performedBy: m.sender
                })

                // Update database
                bankDB[bankAccountId] = currentBank
                saveBankDB(bankDB)

                caption = interestDetails
                caption += `\n• *Hari:* ${daysPassed} hari`
                caption += `\n• *Rate:* ${(interestRate * 100).toFixed(1)}%/hari`
                caption += `\n• *Total Bunga Didapat:* $${currentBank.totalInterestEarned.toFixed(2)}`
                break
            }
            case 'history':
                if (!currentBank) {
                    caption = `Kamu belum punya rekening bank. Gunakan \`${prefix}${command} register [kode_bank]\` buat buka rekening dulu.`
                    break
                }

                const limit = parseInt(args[1]) || 10
                const recentTx = currentBank.transactions.slice(-limit).reverse()

                if (recentTx.length === 0) {
                    caption = 'Belum ada riwayat transaksi.'
                    break
                }

                caption = `📊 *\`RIWAYAT TRANSAKSI\`*\n\n`
                
                recentTx.forEach((tx, index) => {
                    const date = new Date(tx.timestamp).toLocaleDateString()
                    const time = new Date(tx.timestamp).toLocaleTimeString()
                    
                    caption += `${index + 1}. **${tx.type.toUpperCase()}**\n`
                    caption += `   • Waktu: ${date} ${time}\n`
                    
                    if (tx.amount) {
                        caption += `   • Jumlah: ${formatCurrency(tx.amount, tx.currency || 'usd')}\n`
                    }
                    
                    if (tx.target) {
                        caption += `   • Ke: ${tx.target}\n`
                    }
                    
                    if (tx.from) {
                        caption += `   • Dari: ${tx.from}\n`
                    }
                    
                    if (tx.fee) {
                        caption += `   • Biaya: ${formatCurrency(tx.fee, tx.currency || 'usd')}\n`
                    }
                    
                    caption += `\n`
                })
                break

            case 'info':
                if (!currentBank) {
                    caption = `Kamu belum punya rekening bank. Gunakan \`${prefix}${command} register [kode_bank]\` buat buka rekening dulu.`
                    break
                }

                const openDate = new Date(currentBank.openedAt).toLocaleDateString()
                const daysSinceOpen = Math.floor((Date.now() - new Date(currentBank.openedAt).getTime()) / (1000 * 60 * 60 * 24))
                
                caption = `🏦 *\`INFORMASI REKENING\`*\n\n`
                caption += `• Bank: ${currentBank.bank.name}\n`
                caption += `• Negara: ${currentBank.bank.country}\n`
                caption += `• No. Rekening: ${currentBank.accountNumber}\n`
                caption += `• Dibuka: ${openDate} (${daysSinceOpen} hari lalu)\n`
                caption += `• Bunga Harian: ${(currentBank.bank.interestRate * 100).toFixed(1)}%\n`
                caption += `• Biaya Transfer: ${formatCurrency(currentBank.bank.fees.transfer, 'usd')}\n`
                caption += `• Bunga Pinjaman: ${(currentBank.bank.fees.loan * 100).toFixed(1)}%\n`
                caption += `• Limit Pinjaman: ${formatCurrency(currentBank.bank.maxLoan, 'usd')}\n`
                caption += `• Total Bunga Didapat: $${currentBank.totalInterestEarned.toFixed(2)}\n`
                caption += `• Total Transaksi: ${currentBank.transactions.length}\n`
                
                const activeLoanCount = currentBank.loans.filter(loan => !loan.paid).length
                caption += `• Pinjaman Aktif: ${activeLoanCount}\n`
                break

            default:
                caption = `🏦 *\`DAFTAR PERINTAH\`*\n\n`

                caption += `*Contoh:* \`${prefix + command} banks\`\n`
                caption += `*Prefix:* \`${prefix}\`\n\n`

                caption += `• \`${command} banks\` - Lihat daftar bank\n`
                caption += `• \`${command} register\` - Buka rekening\n`
                caption += `• \`${command} info\` - Info rekening\n`
                caption += `• \`${command} balance\` - Cek saldo\n`
                caption += `• \`${command} deposit\` - Setor dari wallet\n`
                caption += `• \`${command} withdraw\` - Tarik ke inventory\n`
                caption += `• \`${command} transfer\` - Transfer\n`
                caption += `• \`${command} loan\` - Ambil pinjaman\n`
                caption += `• \`${command} payloan\` - Bayar pinjaman\n`
                caption += `• \`${command} loanstatus\` - Status pinjaman\n`
                caption += `• \`${command} interest\` - Klaim bunga harian\n`
                caption += `• \`${command} history\` - Riwayat transaksi\n\n`
                caption += `*Tips:* Login ke wallet dulu sebelum menggunakan layanan bank.`
                break
        }

        conn.sendMessage(m.from, { text: caption.trim() })
    }
}