// backpack.js

async function backpackEffect(db, sender, m, backpackInfo, profile) {
    if (!backpackInfo) return

    const currentTime = Date.now()
    const lastBackpackWarning = profile.lastBackpackWarning || 0

    const percentage = backpackInfo.percentage
    const weightStatus = getWeightStatus(percentage)

    if (percentage >= 95 && (currentTime - lastBackpackWarning) >= 1800000) { // 30 menit
        await m.reply(`🎒⚠️ *\`BACKPACK KRITIS!\`*\n\n` +
                     `• Kapasitas: ${backpackInfo.currentWeight}/${backpackInfo.capacity} (${percentage}%)\n` +
                     `• Status: ${weightStatus.status}\n` +
                     `• Level: ${backpackInfo.name}\n\n` +
                     `*Efek Negatif Aktif:*\n` +
                     `${weightStatus.effects.join('\n')}\n\n` +
                     `*Solusi:*\n` +
                     `• Gunakan item: \`use [item]\`\n` +
                     `• Jual item: \`sell [item] [jumlah]\`\n` +
                     `• Upgrade backpack: \`upgrade backpack\`\n` +
                     `• Buang item: \`drop [item] [jumlah]\``)

        db.users.update(sender, {
            playerInfo: {
                ...profile,
                lastBackpackWarning: currentTime
            }
        })
    }
    
    if (percentage >= 100) {
        profile.canPickupItems = false
        profile.movementRestricted = true
    } else if (percentage >= 95) {
        profile.canPickupItems = false
        profile.movementRestricted = false
    } else {
        profile.canPickupItems = true
        profile.movementRestricted = false
    }

    if (percentage >= 90) {
        profile.backpackStress = true
        // kurangi mood secara bertahap
        if (Math.random() < 0.3) { // 30% chance setiap command
            profile.mood = Math.max(0, profile.mood - 1)
        }
    } else {
        profile.backpackStress = false
    }
}

function getWeightStatus(percentage) {
    if (percentage >= 100) {
        return {
            status: '🔴 PENUH TOTAL',
            effects: [
                '• ❌ Tidak bisa mengambil item',
                '• 🚫 Pergerakan terbatas',
                '• 💔 Health -3 per jam',
                '• ⚡ Energy -3 per jam',
                '• 😰 Mood menurun drastis'
            ]
        }
    } else if (percentage >= 95) {
        return {
            status: '🟠 HAMPIR PENUH',
            effects: [
                '• ⚠️ Tidak bisa mengambil item',
                '• 💔 Health -2 per jam',
                '• ⚡ Energy -2 per jam',
                '• 😓 Mood menurun'
            ]
        }
    } else if (percentage >= 90) {
        return {
            status: '🟡 BERAT',
            effects: [
                '• 💔 Health -1 per jam',
                '• ⚡ Energy -1 per jam',
                '• 😐 Mood sedikit menurun'
            ]
        }
    } else if (percentage >= 75) {
        return {
            status: '🟢 SEDANG',
            effects: ['• ✅ Normal, namun mulai terasa berat']
        }
    } else {
        return {
            status: '🔵 RINGAN',
            effects: ['• ✅ Optimal untuk perjalanan']
        }
    }
}

async function sendBackpackWarning(m, db, sender, type) {
    const backpackInfo = db.backpack.getInfo(sender)
    if (!backpackInfo) return

    const percentage = backpackInfo.percentage
    const weightStatus = getWeightStatus(percentage)
    let message = ''
    
    switch (type) {
        case 'WARNING':
            message = `🎒⚠️ *\`Backpack Mulai Berat\`*\n\n` +
                     `• Kapasitas: ${backpackInfo.currentWeight}/${backpackInfo.capacity}\n` +
                     `• Persentase: ${percentage}%\n` +
                     `• Status: ${weightStatus.status}\n\n` +
                     `Kesehatan dan energi akan berkurang lebih cepat.\n` +
                     `Pertimbangkan untuk mengurangi beban.`
            break
            
        case 'CRITICAL':
            message = `🎒🔴 *\`Backpack Kritis\`*\n\n` +
                     `• Kapasitas: ${backpackInfo.currentWeight}/${backpackInfo.capacity}\n` +
                     `• Persentase: ${percentage}%\n` +
                     `• Status: ${weightStatus.status}\n\n` +
                     `⚠️ *PERINGATAN SERIUS!*\n` +
                     `Segera kurangi beban atau upgrade backpack!`
            break
            
        case 'EXHAUSTION':
            message = `😰💔 *\`Kelelahan Ekstrem\`*\n\n` +
                     `• Backpack: ${percentage}% penuh\n` +
                     `• Energy: Hampir habis!\n\n` +
                     `Tubuh kamu tidak kuat lagi membawa beban ini.\n` +
                     `Istirahat atau kurangi beban segera!`
            break
            
        case 'FULL':
            message = `🎒🚫 *\`Backpack Penuh Total\`*\n\n` +
                     `• Kapasitas: ${backpackInfo.currentWeight}/${backpackInfo.capacity}\n` +
                     `• Persentase: ${percentage}%\n\n` +
                     `Kamu tidak bisa mengambil item apapun lagi!\n` +
                     `Gunakan, jual, atau buang beberapa item terlebih dahulu.`
            break
    }

    await m.reply(message)
}

async function autoCleanup(db, sender, m, backpackInfo) {
    if (!backpackInfo || backpackInfo.percentage < 100) return

    const user = db.users.get(sender)
    const items = user.playerInventory?.items || {}
        
    // cari item dengan jumlah dikit yang bisa dibuang otomatis
    const lowQuantityItems = Object.entries(items)
        .filter(([key, value]) => typeof value === 'number' && value > 0 && value <= 2)
        .filter(([key]) => !['uang', 'passport'].includes(key)) // item penting yg ga akan terbuang
        
    if (lowQuantityItems.length > 0) {
        const itemToRemove = lowQuantityItems[0]
        const [itemName, quantity] = itemToRemove
            
        db.users.update(sender, {
            playerInventory: {
                ...user.playerInventory,
                items: {
                    ...items,
                    [itemName]: 0
                }
            }
        })

        await m.reply(`🗑️ *\`AUTO CLEANUP\`*\n\n` +
                     `Item "${itemName}" (${quantity}) telah dibuang otomatis karena backpack penuh.\n\n` +
                     `💡 *Tips:* Upgrade backpack untuk kapasitas lebih besar.`)
     }
}

// cek backpack sebelum menambah item
async function checkBackpackBeforeAdd(db, sender, itemName, quantity = 1) {
    const backpackInfo = db.backpack.getInfo(sender)
    if (!backpackInfo) return { canAdd: false, reason: 'Backpack tidak ditemukan' }
    
    const canAdd = db.backpack.canAdd(sender, itemName, quantity)
    const percentage = backpackInfo.percentage
    
    if (!canAdd) {
        return {
            canAdd: false,
            reason: `Backpack penuh! (${percentage}%)\nTidak bisa menambah ${itemName} x${quantity}`,
            backpackInfo
        }
    }
    
    // warning kalo melebihi 90%
    const user = db.users.get(sender)
    const currentWeight = backpackInfo.currentWeight
    const itemWeights = {
        rice: 2, oil: 1, sugar: 1, flour: 2, salt: 1,
        omorice: 1, pizza: 2, burger: 1, fries: 1,
        coffee: 1, tea: 1, milk: 1, air: 1, snack: 1,
        phone: 1, laptop: 5, charger: 1,
        obat: 1, painkiller: 1, bandage: 1,
        uang: 0
    }
    
    const itemWeight = (itemWeights[itemName] || 1) * quantity
    const newWeight = currentWeight + itemWeight
    const newPercentage = Math.round((newWeight / backpackInfo.capacity) * 100)
    
    if (newPercentage >= 90) {
        return {
            canAdd: true,
            warning: `Setelah menambah item, backpack akan ${newPercentage}% penuh.`,
            backpackInfo,
            newPercentage
        }
    }
    
    return { canAdd: true, backpackInfo, newPercentage }
}

export {
    backpackEffect,
    getWeightStatus,
    sendBackpackWarning,
    autoCleanup,
    checkBackpackBeforeAdd
}