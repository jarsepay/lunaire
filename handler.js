import { colors } from './lib/src/function.js'
import { staffData } from './lib/databases/staff.js'
import { plugins } from './lib/plugins.js'
import { owner, defaultPrefix } from './setting.js'
import { decodeJid } from './lib/src/func.js'
import { printLog } from './lib/src/print.js'
import store from './lib/src/store.js'
import db from './lib/database.js'

// config grup yang harus dijoin dengan informasi tambahan
const REQUIRED_GROUPS = [
    {
        id: '120363025343298860@g.us',
        name: 'Lunaire',
        inviteCode: null // akan diisi otomatis jika bot adalah admin
    }
]

const omi = {
    info: (message) => console.log(colors(`[ℹ️  INFO] ${message}`, 'cyan')),
    success: (message) => console.log(colors(`[✅ SUCCESS] ${message}`, 'green')),
    warning: (message) => console.log(colors(`[⚠️  WARNING] ${message}`, 'yellow')),
    error: (message) => console.log(colors(`[❌ ERROR] ${message}`, 'red')),
    debug: (message) => console.log(colors(`[🔍 DEBUG] ${message}`, 'magenta')),
    command: (message) => console.log(colors(`[🎯 COMMAND] ${message}`, 'blue')),
    plugin: (message) => console.log(colors(`[🔌 PLUGIN] ${message}`, 'green')),
    group: (message) => console.log(colors(`[👥 GROUP] ${message}`, 'cyan')),
    user: (message) => console.log(colors(`[👤 USER] ${message}`, 'yellow')),
    separator: () => console.log(colors('═'.repeat(60), 'gray'))
}

const checkGroupMembership = async (conn, userId) => {
    try {
        const userGroups = []
        const accessibleGroups = []
        
        for (const group of REQUIRED_GROUPS) {
            try {
                const groupMeta = await conn.groupMetadata(group.id)
                const isMember = groupMeta.participants.some(p => decodeJid(p.id) === userId)
                
                group.name = groupMeta.subject
                accessibleGroups.push(group)
                
                if (isMember) {
                    userGroups.push(group.id)
                    omi.success(`User ${userId} is member of group: ${groupMeta.subject}`)
                } else {
                    omi.warning(`User ${userId} is NOT member of group: ${groupMeta.subject}`)
                }
                
                try {
                    const inviteCode = await conn.groupInviteCode(group.id)
                    group.inviteCode = inviteCode
                    omi.debug(`Got invite code for ${groupMeta.subject}`)
                } catch (inviteError) {
                    omi.warning(`Cannot get invite code for ${groupMeta.subject}: Bot might not be admin`)
                }
                
            } catch (error) {
                omi.error(`Cannot access group ${group.id}: ${error.message}`)
                
                if (error.message.includes('forbidden')) {
                    omi.warning(`Bot doesn't have access to group ${group.id} - assuming user is not a member`)
                } else if (error.message.includes('item-not-found')) {
                    omi.error(`Group ${group.id} not found - please check the group ID`)
                }
                
                accessibleGroups.push({
                    ...group,
                    accessible: false,
                    error: error.message
                })
            }
        }
        
        return {
            isMemberOfAll: userGroups.length === REQUIRED_GROUPS.length,
            memberGroups: userGroups,
            missingGroups: REQUIRED_GROUPS.filter(group => !userGroups.includes(group.id)),
            accessibleGroups: accessibleGroups
        }
    } catch (error) {
        omi.error(`Group membership check failed: ${error.message}`)
        return { 
            isMemberOfAll: false, 
            memberGroups: [], 
            missingGroups: REQUIRED_GROUPS,
            accessibleGroups: []
        }
    }
}

const validateGroupIds = async (conn) => {
    omi.info('Validating configured group IDs...')
    
    for (let i = 0; i < REQUIRED_GROUPS.length; i++) {
        const group = REQUIRED_GROUPS[i]
        
        try {
            const groupMeta = await conn.groupMetadata(group.id)
            omi.success(`✓ Group ${group.id} is valid: ${groupMeta.subject}`)
            group.name = groupMeta.subject
        } catch (error) {
            omi.error(`✗ Group ${group.id} is invalid: ${error.message}`)
            
            if (error.message.includes('item-not-found')) {
                omi.warning(`Please check if group ID ${group.id} is correct`)
            } else if (error.message.includes('forbidden')) {
                omi.warning(`Bot needs to be added to group ${group.id} first`)
            }
        }
    }
}

const handler = async (m, conn) => {
    try {
        omi.separator()
        omi.info(`Processing message from: ${m.sender}`)
        
        const setting = db.settings.get(conn.user.jid)
        const prefixList = (setting && setting.prefix.length) ? setting.prefix : defaultPrefix

        let prefix = ''
        for (const p of prefixList) {
            const trimmedPrefix = p.trim()
            if (trimmedPrefix === '' || m.text.startsWith(trimmedPrefix)) {
                prefix = trimmedPrefix
                break
            }
        }

        const isUsingPrefix = prefix !== false

        if (!isUsingPrefix && !setting.usePrefix) {
        } else if (!prefix) {
            return 
        }

        const trimText = m.text.slice(prefix.length).trim()
        const [rawCommand, ...args] = trimText.split(/\s+/)
        const command = rawCommand ? rawCommand.toLowerCase() : rawCommand
        const text = command ? trimText.slice(rawCommand.length).trim() : trimText

        const isGroup = m.from.endsWith('@g.us')
        const isPrivate = m.from.endsWith('@s.whatsapp.net')
        const isBroadcast = m.from === 'status@broadcast'
        const isOwner = [conn.user.jid, ...owner.map(([number]) => number.replace(/[^0-9]/g, '') + '@s.whatsapp.net')].includes(m.sender)
        const isStaff = staffData[m.sender]
        const isRegistered = db.users.get(m.sender).playerStatus.registered
        
        // cek keanggotaan grup hanya jika diperlukan (tidak untuk setiap pesan)
        let membershipStatus = { isMemberOfAll: true, memberGroups: [], missingGroups: [], accessibleGroups: [] }
        
        const isJail = db.users.get(m.sender).playerStatus.jail.status
        const isBanned = db.users.get(m.sender).banned.status
        const isBaileys = m.id.startsWith('3EB0')

        omi.user(`Owner: ${isOwner} | Staff: ${isStaff} | Registered: ${isRegistered}`)
        omi.user(`Banned: ${isBanned} | Jail: ${isJail} | Baileys: ${isBaileys}`)

        const groupMetadata = isGroup ? await conn.groupMetadata(m.from) : {}
        const groupName = groupMetadata.subject || ''
        const participants = groupMetadata.participants || []

        if (isGroup) {
            omi.group(`Group: ${groupName} | Participants: ${participants.length}`)
        }

        const user = isGroup ? participants.find(u => decodeJid(u.id) === m.sender) : {}
        const bot = isGroup ? participants.find(b => decodeJid(b.id) === conn.user.jid) : {}
        const isSuperAdmin = user?.admin === 'superadmin' || false
        const isAdmin = isSuperAdmin || user?.admin === 'admin' || false
        const isBotAdmin = bot?.admin === 'admin' || false

        let isCommand = false

        if (isGroup && !db.groups.exist(m.from)) {
            try {
                await db.groups.add(m.from)
                await db.save()
                omi.success(`Added new group to database: ${groupName}`)
            } catch (error) {
                omi.error(`Failed to add group to database: ${error.message}`)
            }
        }

        // tambahin user ke grup jika terdaftar
        if (isGroup && db.groups.exist(m.from) && isRegistered) {
            try {
                const group = db.groups.get(m.from)
                if (group && group.users) {
                    await group.users.add(m.sender)
                    await db.save()
                    omi.debug(`Added user ${m.sender} to group ${groupName}`)
                }
            } catch (error) {
                omi.error(`Failed to add user to group: ${error.message}`)
            }
        }

        if (setting.mode === 'public' || (setting.mode === 'self' && isOwner)) {
            if (Array.isArray(plugins.befores)) {
                omi.plugin(`Processing ${plugins.befores.length} before plugins`)
                
                for (const before of plugins.befores) {
                    const name = Object.keys(before)[0]
                    const plugin = before[name]
                    
                    if (!plugin) {
                        omi.warning(`Before plugin "${name}" is null or undefined`)
                        continue
                    }
                    
                    omi.plugin(`Executing before plugin: ${name}`)
                    
                    try {
                        await plugin.start({
                            m, conn, text, args, status,
                            isGroup, store, isPrivate, isBroadcast, isOwner, isStaff, isRegistered, isBanned, isJail, isSuperAdmin, isAdmin, isBotAdmin, isBaileys,
                            membershipStatus, groupMetadata, groupName, participants, db, plugins
                        })
                        omi.success(`Before plugin "${name}" executed successfully`)
                    } catch (e) {
                        omi.error(`BEFORE PLUGIN ERROR - ${name}`)
                        omi.error(`Stack trace: ${e.stack || e}`)
                        omi.debug(`Plugin object: ${JSON.stringify(plugin, null, 2)}`)
                        
                        if (e.name) {
                            if (plugin?.setting?.error_react) await m.react('❌')
                            await m.reply(`*${e.name}* : ${e}`)
                        }
                    }
                }
            }

            if (!isBaileys && !isBroadcast) {
                const stickerCommand = (m.type === 'stickerMessage'
                    ? db.stickers.get(Buffer.from(m.message[m.type].fileSha256).toString('base64'))?.command
                    : ''
                )

                const commands = plugins.commands
                    ?.map(plugin => Object.values(plugin)[0])
                    ?.filter(commandObj => commandObj?.command?.some(cmd =>
                        cmd.toLowerCase() === stickerCommand || cmd.toLowerCase() === command
                    )) || []

                omi.command(`Found ${commands.length} matching commands for: ${command || stickerCommand}`)

                if (commands.length > 0) {
                    isCommand = true

                    for (const cmd of commands) {
                        if (!cmd) {
                            omi.warning('Command object is null or undefined')
                            continue
                        }
                        
                        omi.command(`Executing command: ${cmd.command?.[0] || 'unknown'}`)
                        omi.debug(`Command settings: ${JSON.stringify(cmd.setting, null, 2)}`)
                        
                        const setting = {
                            isRegister: false,
                            isBanned: false,
                            isJail: false,
                            isNsfw: false,
                            isGroup: false,
                            isPrivate: false,
                            isOwner: false,
                            isStaff: false,
                            isSuperAdmin: false,
                            isAdmin: false,
                            isBotAdmin: false,
                            requireGroupMembership: false,
                            usePrefix: cmd.setting?.usePrefix !== undefined ? cmd.setting.usePrefix : true, 
                            ...cmd.setting
                        }

                        if (setting.requireGroupMembership && !isOwner && !isStaff) {
                            omi.info('Checking group membership requirement...')
                            
                            membershipStatus = await checkGroupMembership(conn, m.sender)
                            
                            if (!membershipStatus.isMemberOfAll) {
                                omi.warning(`User ${m.sender} doesn't meet group membership requirements`)
                                await status({ 
                                    type: 'requireGroupMembership', 
                                    m, 
                                    missingGroups: membershipStatus.missingGroups,
                                    accessibleGroups: membershipStatus.accessibleGroups,
                                    conn 
                                })
                                continue
                            } else {
                                omi.success(`User ${m.sender} meets all group membership requirements`)
                            }
                        }

                        if (setting.isRegister && !isRegistered) {
                            await status({ type: 'isRegister', m, prefix })
                            continue
                        }
                        if (setting.isBanned && isBanned) {
                            await status({ type: 'isBanned', m })
                            continue
                        }
                        if (setting.isJail && isJail) {
                            await status({ type: 'isJail', m })
                            continue
                        }
                        if (setting.isGroup && !isGroup) {
                            await status({ type: 'isGroup', m })
                            continue
                        }
                        if (setting.isPrivate && !isPrivate) {
                            await status({ type: 'isPrivate', m })
                            continue
                        }
                        if (setting.isOwner && !isOwner) {
                            await status({ type: 'isOwner', m })
                            continue
                        }
                        if (setting.isStaff && !isStaff) {
                            await status({ type: 'isStaff', m })
                            continue
                        }
                        if (setting.isAdmin && !isAdmin) {
                            await status({ type: 'isAdmin', m })
                            continue
                        }
                        if (setting.isBotAdmin && !isBotAdmin) {
                            await status({ type: 'isBotAdmin', m })
                            continue
                        }

                        try {
                            await cmd.start({
                                m, conn, text, store, args, prefix, command, status,
                                isGroup, isPrivate, isOwner, isStaff, isRegistered, membershipStatus, isBanned, isJail, isSuperAdmin, isAdmin, isBotAdmin,
                                groupMetadata, groupName, participants, db, plugins
                            })
                            omi.success(`Command "${cmd.command?.[0] || 'unknown'}" executed successfully`)
                        } catch (e) {
                            omi.error(`COMMAND ERROR - ${cmd.command?.[0] || 'unknown'}`)
                            omi.error(`Stack trace: ${e.stack || e}`)
                            omi.debug(`Command object: ${JSON.stringify(cmd, null, 2)}`)
                            omi.debug(`Message context: ${JSON.stringify({
                                from: m.from,
                                sender: m.sender,
                                text: m.text,
                                command: command
                            }, null, 2)}`)
                            
                            if (e.name) {
                                if (cmd?.setting?.error_react) await m.react('❌')
                                await m.reply(`*${e.name}* : ${e}`)
                            }
                        }
                    }
                }
            }
        }

        await printLog({ m, conn, args, command, groupName, isGroup, isCommand })
        omi.separator()
    } catch (e) {
        omi.error('MAIN HANDLER ERROR')
        omi.error(`Stack trace: ${e.stack || e}`)
        omi.debug(`Message context: ${JSON.stringify({
            from: m?.from,
            sender: m?.sender,
            text: m?.text
        }, null, 2)}`)
    }
}

const status = async ({ type, m, prefix = '', missingGroups = [], accessibleGroups = [], conn = null }) => {
    const texts = {
        isRegister: `Untuk menggunakan perintah ini, Kamu harus mendaftar melalui ${prefix}verify.`,
        isBanned: `Kamu telah dibanned dari bot ini. Silahkan kontak staff melalui ${prefix}ask jika ini sebuah kesalahan.`,
        isJail: 'Kamu masih di dalam penjara.',
        isNsfw: 'Konten NSFW tidak tersedia untuk grup ini.',
        isOwner: 'Perintah ini hanya untuk owner.',
        isStaff: 'Perintah ini hanya berlaku untuk staff.',
        isGroup: 'Perintah ini hanya berlaku di dalam group.',
        isPrivate: 'Perintah ini hanya berlaku di private chat.',
        isAdmin: 'Perintah ini hanya berlaku untuk admin group.',
        isBotAdmin: 'Perintah ini hanya berlaku saat bot menjadi admin.',
        requireGroupMembership: async () => {
            let message = '🔒 *Akses Terbatas*\n\n'
            message += 'Untuk menggunakan perintah ini, kamu harus bergabung ke grup-grup berikut:\n\n'
            
            for (let i = 0; i < missingGroups.length; i++) {
                const group = missingGroups[i]
                const accessibleGroup = accessibleGroups.find(ag => ag.id === group.id)
                
                message += `${i + 1}. *${group.name}*\n`
                
                if (accessibleGroup && accessibleGroup.inviteCode) {
                    message += `   📎 Link: https://chat.whatsapp.com/${accessibleGroup.inviteCode}\n\n`
                } else if (accessibleGroup && accessibleGroup.error) {
                    if (accessibleGroup.error.includes('forbidden')) {
                        message += `   Bot belum bergabung ke grup ini\n`
                        message += `   Hubungi admin untuk mendapatkan link grup\n\n`
                    } else if (accessibleGroup.error.includes('item-not-found')) {
                        message += `   Grup tidak ditemukan (mungkin sudah dihapus)\n`
                        message += `   Hubungi admin untuk info lebih lanjut\n\n`
                    } else {
                        message += `   Status tidak diketahui\n`
                        message += `   Hubungi admin untuk mendapatkan link grup\n\n`
                    }
                } else {
                    message += `   Hubungi admin untuk mendapatkan link grup\n\n`
                }
            }
            
            message += 'Setelah bergabung ke semua grup, silakan coba perintah kembali.\n'
            message += 'Jika ada masalah, hubungi admin atau staff.'
            
            return message
        }
    }

    const text = texts[type]
    if (typeof text === 'function') {
        const message = await text()
        return m.reply(message)
    } else if (text) {
        return m.reply(text)
    }
}

export { validateGroupIds }
export default handler