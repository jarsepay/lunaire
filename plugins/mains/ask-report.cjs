const { staffData } = require('../../lib/databases/staff.js')
const fs = require('fs').promises
const jsonPath = './json/report.js'

exports.cmd = {
    name: ['ask', 'report', 'ans', 'active'],
    command: ['ask', 'report', 'ans', 'active'],
    category: ['main'],
    detail: {
        desc: 'Laporkan bug atau tanyakan sesuatu kepada staff.',
        use: 'ask/report [pesan]'
    },
    setting: {
        isRegister: true,
        isBanned: false,
        isJail: false
    },
    async start({ m, db, prefix, command, conn, text }) {
        let reportDB
        try {
            reportDB = JSON.parse(await fs.readFile(jsonPath, 'utf-8'))
        } catch (error) {
            reportDB = {
                reports: [],
                questions: [],
                lastIds: {
                    report: 0,
                    ask: 0
                }
            }
        }

        const isStaff = staffData[m.sender]

        if (command.toLowerCase() === 'ans' && isStaff) {
            const [id, ...answerParts] = text.split(' ')
            const answer = answerParts.join(' ')

            if (!id || !answer) {
                return m.reply(`Gunakan: \`${ prefix + command } <id> <pesan>\``)
            }

            const numId = parseInt(id)
            if (isNaN(numId)) {
                return m.reply('ID harus berupa angka')
            }

            let found = false
            let isQuestion = false

            for (let i = 0; i < reportDB.reports.length; i++) {
                if (reportDB.reports[i].id === numId && !reportDB.reports[i].answered) {
                    found = true
                    reportDB.reports[i].answered = true
                    reportDB.reports[i].answeredBy = isStaff.name || 'Staff'
                    reportDB.reports[i].answer = answer
                    reportDB.reports[i].answeredAt = new Date().toISOString()

                    const response = `*Jawaban untuk laporan #${numId}*\n\n` +
                        `Dari Staff: ${isStaff.name || 'Staff'}\n` +
                        `Jawaban: ${answer}\n\n` +
                        `Laporan: ${reportDB.reports[i].text}`

                    conn.sendMessage(reportDB.reports[i].sender, {
                        text: response.trim()
                    })
                    break
                }
            }

            if (!found) {
                for (let i = 0; i < reportDB.questions.length; i++) {
                    if (reportDB.questions[i].id === numId && !reportDB.questions[i].answered) {
                        found = true
                        isQuestion = true
                        reportDB.questions[i].answered = true
                        reportDB.questions[i].answeredBy = isStaff.name || 'Staff'
                        reportDB.questions[i].answer = answer
                        reportDB.questions[i].answeredAt = new Date().toISOString()

                        const response = `*Jawaban untuk pertanyaan #${numId}*\n\n` +
                            `Dari Staff: ${isStaff.name || 'Staff'}\n` +
                            `Jawaban: ${answer}\n\n` +
                            `Pertanyaan: ${reportDB.questions[i].text}`

                        conn.sendMessage(reportDB.questions[i].sender, {
                            text: response.trim()
                        })
                        break
                    }
                }
            }

            if (found) {
                await fs.writeFile(jsonPath, JSON.stringify(reportDB, null, 2))
                return m.reply(`${isQuestion ? 'Pertanyaan' : 'Laporan'} #${numId} telah dijawab dan diarsipkan.`)
            } else {
                return m.reply(`Tidak ditemukan ${isQuestion ? 'pertanyaan' : 'laporan'} dengan ID #${numId} atau sudah dijawab.`)
            }
        }

        if (command.toLowerCase() === 'active' && isStaff) {
            const activeReports = reportDB.reports.filter(r => !r.answered)
            const activeQuestions = reportDB.questions.filter(q => !q.answered)

            const mentions = [
                ...activeReports.map(r => r.sender),
                ...activeQuestions.map(q => q.sender)
            ]

            if (activeReports.length === 0 && activeQuestions.length === 0) {
                return m.reply('Tidak ada laporan atau pertanyaan aktif.')
            }

            let response = ''

            if (activeReports.length > 0) {
                response += '*Laporan Aktif:*\n\n'
                activeReports.forEach(r => {
                    response += `ID: #${r.id}\n` +
                        `Dari: @${r.sender.replace(/@s\.whatsapp\.net/g, '')}\n` +
                        `Waktu: ${new Date(r.timestamp).toLocaleString()}\n` +
                        `Laporan: ${r.text}\n\n`
                })
            }

            if (activeQuestions.length > 0) {
                response += '*Pertanyaan Aktif:*\n\n'
                activeQuestions.forEach(q => {
                    response += `ID: #${q.id}\n` +
                        `Dari: @${q.sender.replace(/@s\.whatsapp\.net/g, '')}\n` +
                        `Waktu: ${new Date(q.timestamp).toLocaleString()}\n` +
                        `Pertanyaan: ${q.text}\n\n`
                })
            }

            return conn.sendMessage(m.chat, {
                text: response.trim(),
                mentions: mentions
            })
        }

        if (!text) return m.reply('Berikan masukan atau laporan.')
        const now = new Date() * 1
        const cooldown = 30 * 60 * 1000

        if (db.users.get(m.sender).report && now - db.users.get(m.sender).report < cooldown) {
            const remaining = Math.ceil((db.users.get(m.sender).report + cooldown - now) / 60000)
            return m.reply(`Kamu dapat mengirim laporan atau pertanyaan lagi dalam ${remaining} menit.`)
        }

        if (command.toLowerCase() === 'ask') {
            const id = reportDB.lastIds.ask + 1
            reportDB.lastIds.ask = id

            const question = {
                id,
                sender: m.sender,
                text,
                timestamp: now,
                answered: false
            }

            reportDB.questions.push(question)

            db.users.update(m.sender, { report: now })
            db.save()

            await fs.writeFile(jsonPath, JSON.stringify(reportDB, null, 2))

            await m.reply(`Pertanyaan #${id} telah terkirim ke staff.`)
        } else if (command.toLowerCase() === 'report') {
            const id = reportDB.lastIds.report + 1
            reportDB.lastIds.report = id

            const report = {
                id,
                sender: m.sender,
                text,
                timestamp: now,
                answered: false
            }

            reportDB.reports.push(report)

            db.users.update(m.sender, { report: now })
            db.save()

            await fs.writeFile(jsonPath, JSON.stringify(reportDB, null, 2))

            await m.reply(`Laporan #${id} telah terkirim ke staff.`)
        }

    }
}