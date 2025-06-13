const { exec } = require('child_process')

exports.cmd = {
    name: ['$'],
    command: ['$'],
    category: ['owner'],
    detail: {
        desc: 'Menjalankan kode terminal.',
        use: 'func.'
    },
    setting: {
        isOwner: true,
        usePrefix: false,
    },
    async start({ m, text }) {
        if (!text) return
        exec(text, (err, stdout) => {
            if (err) return m.reply(String(err))
            if (stdout) return m.reply(stdout.trim())
        })
    }
}
