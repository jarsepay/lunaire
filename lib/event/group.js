import db from '../database.js'

const avatar = 'https://i.ibb.co/fp6t21w/avatar.jpg'

export async function groupParticipantsUpdate(data, conn) {
    try {
        const { id, author = null, participants, action, simulate = null } = data
        
        if (!db.groups.exist(id)) {
            console.log(`[GROUP EVENT] Group ${id} not found in database, creating new entry...`)
            await db.groups.add(id)
            await db.save()
        }
        
        const groupData = db.groups.get(id)
        const group = groupData?.setting || {
            welcome: {
                status: false,
                msg: ''
            },
            antiraid: false
        }
        
        console.log(`[GROUP EVENT] Processing ${action} for group ${id}`)
        
        const groupMetadata = await conn.groupMetadata(id).catch(err => {
            console.error(`[GROUP EVENT] Failed to get group metadata for ${id}:`, err)
            return { subject: 'Unknown Group', desc: '', ephemeralDuration: 0, participants: [] }
        })

        switch (action) {
            case 'add':
                console.log(`[GROUP EVENT] New members added to ${groupMetadata.subject}:`, participants)
                
                if (simulate || group.welcome?.status) {
                    const teks = (group.welcome?.msg === '' || !group.welcome?.msg
                        ? `*Hai, selamat datang di group @group.*\n\n@users` 
                        : group.welcome.msg)
                        .replace('@users', participants.map(user => `\t🥢. @${user.split('@')[0]}`).join('\n'))
                        .replace('@group', groupMetadata.subject)
                        .replace('@desc', groupMetadata.desc || '')

                    let pp = await conn.profilePictureUrl(id, 'image').catch(() => {
                        console.log(`[GROUP EVENT] Failed to get profile picture for ${id}, using default avatar`)
                        return avatar
                    })

                    try {
                        await conn.sendMessage(id, {
                            image: { url: pp },
                            caption: teks,
                            mentions: participants
                        }, {
                            ephemeralExpiration: groupMetadata.ephemeralDuration || 0
                        })
                        console.log(`[GROUP EVENT] Welcome message sent successfully to ${groupMetadata.subject}`)
                    } catch (error) {
                        console.error(`[GROUP EVENT] Failed to send welcome message:`, error)
                    }
                }
                break

            case 'remove':
                console.log(`[GROUP EVENT] Members removed from ${groupMetadata.subject}:`, participants)
                
                if (simulate || group.goodbye?.status) {
                    const teks = (group.goodbye?.msg === '' || !group.goodbye?.msg
                        ? `*Selamat tinggal @users, semoga bertemu lagi.*` 
                        : group.goodbye.msg)
                        .replace('@users', participants.map(user => `@${user.split('@')[0]}`).join(', '))
                        .replace('@group', groupMetadata.subject)
                        .replace('@desc', groupMetadata.desc || '')

                    try {
                        await conn.sendMessage(id, {
                            text: teks,
                            mentions: participants
                        }, {
                            ephemeralExpiration: groupMetadata.ephemeralDuration || 0
                        })
                        console.log(`[GROUP EVENT] Goodbye message sent successfully to ${groupMetadata.subject}`)
                    } catch (error) {
                        console.error(`[GROUP EVENT] Failed to send goodbye message:`, error)
                    }
                }
                break

            case 'promote':
            case 'demote':
                console.log(`[GROUP EVENT] ${action} action in ${groupMetadata.subject} by ${author}:`, participants)
                
                if (!group.antiraid) {
                    console.log(`[GROUP EVENT] Antiraid disabled for ${groupMetadata.subject}, skipping notification`)
                    return
                }

                const admins = groupMetadata.participants?.filter(p => p.admin)?.map(p => p.id) || []
                const actionText = action === 'promote'
                    ? `*@${author?.split('@')[0] || 'Unknown'}* promote *@${participants[0]?.split('@')[0] || 'Unknown'}* . Untuk menghindari *bug* pesan ini menyebutkan semua *admin*.`
                    : `*@${author?.split('@')[0] || 'Unknown'}* menghapus admin dari *@${participants[0]?.split('@')[0] || 'Unknown'}*.`

                try {
                    await conn.sendMessage(id, {
                        text: actionText,
                        mentions: [author, ...participants, ...admins].filter(Boolean)
                    }, {
                        ephemeralExpiration: groupMetadata.ephemeralDuration || 0
                    })
                    console.log(`[GROUP EVENT] ${action} notification sent successfully to ${groupMetadata.subject}`)
                } catch (error) {
                    console.error(`[GROUP EVENT] Failed to send ${action} notification:`, error)
                }
                break

            default:
                console.log(`[GROUP EVENT] Unhandled action: ${action} in group ${id}`)
                break
        }
        
    } catch (error) {
        console.error('[GROUP EVENT] Main error in groupParticipantsUpdate:', error)
        console.error('[GROUP EVENT] Error stack:', error.stack)
        console.error('[GROUP EVENT] Data received:', data)
    }
}