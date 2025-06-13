import {
    staffData,
    saveStaff,
    rankMapping,
    rankHierarchy
} from '../../lib/databases/staff.js'

export const cmd = {
    name: ['staff add', 'staff rename', 'staff rank', 'staff kick', 'staff list'],
    command: ['staff'],
    category: ['staff'],
    detail: {
        desc: 'Perintah manajemen staf untuk ngatur anggota staf bot',
        use: '@tag/nomor [opsi]'
    },
    async start({ m, conn, args }) {
        const userRank = staffData[m.sender]?.rank || 'Trial Staff'
        const userRankLevel = rankHierarchy[userRank]
        const subCmd = (args[0] || '').toLowerCase()
        let caption = ''

        switch (subCmd) {
            case 'add': {
                if (!staffData[m.sender]) {
                    caption = 'Kamu bukan bagian dari staff kami.'
                    break
                }
                if (userRankLevel < 3) {
                    caption = 'Hanya High Staff ke atas yang dapat nambah staff.'
                    break
                }

                let usersToAdd = []

                if (m.mentionedJid && m.mentionedJid.length > 0) {
                    usersToAdd.push(...m.mentionedJid)
                }

                args.slice(1).forEach(arg => {
                    if (arg) {
                        let userId = arg.replace(/[@ .+-]/g, '').replace(/^\+/, '').replace(/-/g, '') + '@s.whatsapp.net'
                        if (!usersToAdd.includes(userId)) {
                            usersToAdd.push(userId)
                        }
                    }
                })

                if (usersToAdd.length === 0) {
                    caption = 'Tag orangnya atau kasih nomor langsung ya.'
                    break
                }

                let addedUsers = []
                for (let user of usersToAdd) {
                    if (user in staffData) continue
                    staffData[user] = {
                        name: m.pushName(user),
                        number: user,
                        rank: 'Trial Staff',
                    }
                    addedUsers.push(m.pushName(user))
                }

                saveStaff(staffData)

                if (addedUsers.length > 0) {
                    caption = `Sukses nambah staff: ${addedUsers.join(', ')}. Selamat datang!`
                } else {
                    caption = 'Semua yang kamu tambahin udah jadi staff.'
                }
                break
            }

            case 'rename': {
                if (!staffData[m.sender]) {
                    caption = 'Kamu bukan bagian dari staff kami.'
                    break
                }
                let newName = args.slice(1).join(' ').trim()
                if (!newName) {
                    caption = 'Masukin nama baru yang valid.'
                    break
                }

                staffData[m.sender].name = newName
                saveStaff(staffData)
                caption = `Nama staff kamu udah diubah jadi: ${newName}`
                break
            }

            case 'rank': {
                if (!staffData[m.sender]) {
                    caption = 'Kamu bukan bagian dari staff kami.'
                    break
                }
                if (userRankLevel < 4) {
                    caption = 'Hanya Super Staff ke atas yang boleh ubah peringkat.'
                    break
                }
                if (args.length < 3) {
                    caption = 'Formatnya: *staff-rank @tag nomor_rank*'
                    break
                }

                let target = m.mentionedJid?.[0] || (args[1] ? args[1].replace(/[@ .+-]/g, '').replace(/^\+/, '').replace(/-/g, '') + '@s.whatsapp.net' : null)
                let rankNumber = args[2]

                if (!target || !(target in staffData)) {
                    caption = 'Orang itu bukan staff.'
                    break
                }
                if (!(rankNumber in rankMapping)) {
                    caption = 'Rank gak valid. Pakai angka 0-5 ya.'
                    break
                }

                let targetRankLevel = rankHierarchy[rankMapping[rankNumber]]

                if (targetRankLevel > userRankLevel) {
                    caption = 'Gak boleh ngasih rank lebih tinggi dari kamu sendiri.'
                    break
                }

                staffData[target].rank = rankMapping[rankNumber]
                saveStaff(staffData)
                caption = `Rank buat ${m.pushName(target)} udah diubah jadi: ${rankMapping[rankNumber]}`
                break
            }

            case 'kick': {
                if (!staffData[m.sender]) {
                    caption = 'Kamu bukan bagian dari staff kami.'
                    break
                }
                if (userRankLevel < 3) {
                    caption = 'Hanya High Staff ke atas yang bisa tendang staff.'
                    break
                }

                let target = m.mentionedJid?.[0] || (args[1] ? args[1].replace(/[@ .+-]/g, '').replace(/^\+/, '').replace(/-/g, '') + '@s.whatsapp.net' : null)

                if (!target || !(target in staffData)) {
                    caption = 'Orang itu bukan staff.'
                    break
                }
                if (rankHierarchy[staffData[target].rank] >= userRankLevel) {
                    caption = 'Gak bisa tendang staff dengan rank sama atau lebih tinggi.'
                    break
                }

                delete staffData[target]
                saveStaff(staffData)
                caption = `Staff ${m.pushName(target)} udah ditendang dari tim.`
                break
            }

            case 'list': {
                let staffList = Object.entries(staffData).map(([_, v]) => `- ${v.name} (${v.rank})`).join('\n')
                caption = staffList ? `Daftar Staff:\n${staffList}` : 'Belum ada staff yang terdaftar.'
                break
            }

            default:
                caption = 'Perintah staff gak dikenal. Coba lagi ya.'
                break
        }

        await conn.sendMessage(m.from, { text: caption.trim() }, { quoted: m })
    }
}
