import fs from 'fs'
import path from 'path'
import { defaultPrefix } from '../../setting.js'

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

export const before = {
    async start({ m, db, conn }) {
        
        if (!m.text || !/^(REQUEST_)\w+$/i.test(m.text.trim())) {
            return
        }

        const messageText = m.text.trim()
        const sender = m.sender
        
        const isRequest = messageText.startsWith('REQUEST_')
        const transactionId = messageText.split('_')[1]

        if (!transactionId) {
            return m.reply('ID transaksi tidak valid.')
        }

        const transactionPath = path.join(process.cwd(), 'json', 'transactions.json')
        let transactions = {}
        
        try {
            if (fs.existsSync(transactionPath)) {
                transactions = JSON.parse(fs.readFileSync(transactionPath, 'utf8'))
            }
        } catch (error) {
            console.error('Error reading transactions:', error)
            return m.reply('Tidak dapat memproses data transaksi.')
        }

        const transaction = transactions[transactionId]
        
        if (!transaction) {
            return m.reply('ID transaksi tidak ditemukan atau kedaluwarsa.')
        }

        if (transaction.used) {
            return m.reply('ID transaksi ini sudah digunakan.')
        }

        const createdAt = new Date(transaction.createdAt)
        const now = new Date()
        const diffMinutes = (now - createdAt) / (1000 * 60)
        
        if (diffMinutes > 30) {
            return m.reply('Transaksi ini telah kedaluwarsa! Kode QR hanya berlaku selama 30 menit.')
        }

        const user = db.users.get(sender)

        const walletDB = getWalletDB()
        let currentWallet = null
        let currentWalletId = null

        if (!currentWallet) {
            return m.reply(`Login ke akun wallet terlebih dahulu. Gunakan: \`${defaultPrefix[0]}wallet login\``)
        }

        const currencySymbols = {
            usd: '$', eur: '€', gbp: '£', jpy: '¥',
            cad: 'C$', krw: '₩', cny: '¥'
        }

        const formatCurrency = (amount, currency) => {
            return `${currencySymbols[currency]}${amount.toLocaleString()}`
        }

        if (isRequest && transaction.type === 'request') {
            const requesterId = transaction.requester
            const { currency, amount } = transaction
            
            if (currentWallet.balance[currency] < amount) {
                return m.reply(`Saldo tidak cukup. Kamu perlu *${formatCurrency(amount, currency)}* tapi hanya memiliki *${formatCurrency(currentWallet.balance[currency], currency)}*`)
            }

            const requester = db.users.get(requesterId)
            const targetWallet = walletDB[requester.loggedWallet]

            if (!requester?.loggedWallet) {
                return m.reply('Penerima belum login ke akun wallet manapun.')
            }

            if (!targetWallet) {
                return m.reply('Wallet penerima tidak ditemukan.')
            }

            const confirm = `
📨 *\`MONEY REQUEST\`*

• Jumlah: ${formatCurrency(amount, currency)}
• Penerima: ${requesterId.split('@')[0]}
• ID Request: ${transactionId}

Apakah kamu ingin menyetujui pembayaran ini?
Balas dengan
• \`APPROVE_${transactionId}\` untuk menyetujui
• \`REJECT_${transactionId}\` untuk menolak

_Request akan berakhir dalam 5 menit._
            `

            await m.reply(confirm.trim())

            transaction.approvalRequested = true
            transaction.approvalRequestedAt = new Date().toISOString()
            transaction.potentialPayer = sender
            fs.writeFileSync(transactionPath, JSON.stringify(transactions, null, 2))

            return
        }

        if (messageText.startsWith('APPROVE_')) {
            const approveId = messageText.split('_')[1]
            const approveTransaction = transactions[approveId]

            if (!approveTransaction || approveTransaction.type !== 'request') {
                return m.reply('ID request tidak valid.')
            }

            if (approveTransaction.potentialPayer !== sender) {
                return m.reply('Kamu tidak berwenang untuk menyetujui transaksi ini.')
            }

            const approvalRequestedAt = new Date(approveTransaction.approvalRequestedAt)
            const diffMinutes = (new Date() - approvalRequestedAt) / (1000 * 60)
            
            if (diffMinutes > 5) {
                return m.reply('Permintaan dibatalkan karena waktu telah habis.')
            }

            const requesterId = approveTransaction.requester
            const { currency, amount } = approveTransaction

            if (currentWallet.balance[currency] < amount) {
                return m.reply(`Saldo tidak cukup. Kamu perlu *${formatCurrency(amount, currency)}*`)
            }

            const requester = db.users.get(requesterId)
            const targetWallet = walletDB[requester.loggedWallet]

            if (!requester?.loggedWallet) {
                return m.reply('Penerima belum login ke akun wallet manapun.')
            }

            currentWallet.balance[currency] -= amount
            targetWallet.balance[currency] += amount

            currentWallet.transactions.push({
                type: 'request_payment',
                requester: requesterId,
                currency,
                amount,
                transactionId: approveId,
                timestamp: new Date().toISOString()
            })

            targetWallet.transactions.push({
                type: 'request_received',
                payer: sender,
                currency,
                amount,
                transactionId: approveId,
                timestamp: new Date().toISOString()
            })

            approveTransaction.used = true
            approveTransaction.processedAt = new Date().toISOString()
            approveTransaction.payer = sender
            fs.writeFileSync(transactionPath, JSON.stringify(transactions, null, 2))

            walletDB[currentWalletId] = currentWallet
            walletDB[requester.loggedWallet] = targetWallet
            saveWalletDB(walletDB)

            await m.reply(`
✅ *\`PEMBAYARAN BERHASIL!\`*

• Jumlah: ${formatCurrency(amount, currency)}
• Tujuan: ${requesterId.split('@')[0]}
• ID Transaksi: ${approveId}
• Sisa Saldo: ${formatCurrency(currentWallet.balance[currency], currency)}
            `.trim())

            try {
                await conn.sendMessage(requesterId, {
                    text: `
✅ *\`UANG DITERIMA!\`*

• Kamu telah menerima saldo sebesar ${formatCurrency(amount, currency)}
• Pengirim: ${sender.split('@')[0]}
• ID Transaksi: ${approveId}
• Saldo Baru: ${formatCurrency(requester.wallet.balance[currency], currency)}
                    `.trim()
                })
            } catch (error) {
                console.error('Error notifying requester:', error)
            }

            return
        }

        if (messageText.startsWith('REJECT_')) {
            const rejectId = messageText.split('_')[1]
            const rejectTransaction = transactions[rejectId]

            if (!rejectTransaction || rejectTransaction.type !== 'request') {
                return m.reply('ID request tidak valid.')
            }

            if (rejectTransaction.potentialPayer !== sender) {
                return m.reply('Kamu tidak berwenang untuk menolak transaksi ini.')
            }

            rejectTransaction.used = true
            rejectTransaction.rejected = true
            rejectTransaction.rejectedAt = new Date().toISOString()
            rejectTransaction.rejectedBy = sender
            fs.writeFileSync(transactionPath, JSON.stringify(transactions, null, 2))

            const requesterId = rejectTransaction.requester
            const { currency, amount } = rejectTransaction

            await m.reply(`
❌ *\`PEMBAYARAN DITOLAK\`*

• Jumlah: ${formatCurrency(amount, currency)}
• Diminta oleh: ${requesterId.split('@')[0]}
• ID Transaksi: ${rejectId}
            `.trim())

            try {
                await conn.sendMessage(requesterId, {
                    text: `
❌ *\`MONEY REQUEST DITOLAK\`*

• Jumlah: ${formatCurrency(amount, currency)}
• Ditolak oleh: ${sender.split('@')[0]}
• ID Transaksi: ${rejectId}
                    `.trim()
                })
            } catch (error) {
                console.error('Error notifying requester:', error)
            }

            return
        }
    }
}