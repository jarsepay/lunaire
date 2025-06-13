import PhoneNumber from 'awesome-phonenumber'
import fs from 'fs'
import { colors, formatDateInTimeZone } from '../../lib/src/function.js'

import { getName } from './func.js'
import { timeZone } from '../../setting.js'

const { version } = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

export function displayTitle() {
    console.log(`
${colors('========================================', 'cyan')}
${colors('            WELCOME TO WHATSAPP BOT         ', 'rainbow')}
${colors('========================================', 'cyan')}
${colors(' ', 'green')}
${colors('          ╭╮╭╮╭┳━━━┳━━╮╭━━━┳━━━━╮', 'white')}
${colors('          ┃┃┃┃┃┃╭━╮┃╭╮┃┃╭━╮┃╭╮╭╮┃', 'white')}
${colors('          ┃┃┃┃┃┃┃╱┃┃╰╯╰┫┃╱┃┣╯┃┃╰╯', 'white')}
${colors('          ┃╰╯╰╯┃╰━╯┃╭━╮┃┃╱┃┃╱┃┃', 'white')}
${colors('          ╰╮╭╮╭┫╭━╮┃╰━╯┃╰━╯┃╱┃┃', 'white')}
${colors('          ╱╰╯╰╯╰╯╱╰┻━━━┻━━━╯╱╰╯', 'white')}
${colors(`.                     ${version} `, 'white')}
${colors('========================================', 'cyan')}
`)
}

export async function printLog(context) {
    const { m, conn, args, command, groupName, isGroup, isCommand } = context

    const number = (await PhoneNumber('+' + m.sender.split('@')[0])).getNumber('international')
    const text = m.text
        .replace(/\*(.*?)\*/g, (match, p1) => colors(p1, 'bold'))
        .replace(/_(.*?)_/g, (match, p1) => colors(p1, 'italic'))
        .replace(/~(.*?)~/g, (match, p1) => colors(p1, 'strikethrough'))
        .replace(/```([^`]*)```/g, (match, p1) => colors(p1.split('').join(' '), 'white'))
        .replace(/@(\d+)/g, (match, p1) => colors(
            m.mentions.includes(p1 + '@s.whatsapp.net') 
            ? '@' + getName(p1 + '@s.whatsapp.net') 
            : '@' + p1, 'green')
        )
        .replace(/(https?:\/\/[^\s]+)/g, (match, p1) => colors(p1, 'blue'))

    const header = colors(` ${isGroup ? groupName : 'Private Message'} `, 'bgGreen')
const userInfo = `${colors('@' + (conn.user.jid === m.sender ? (conn.user?.name || 'bot') : m.pushName), 'rgb(255, 153, 0)')} (${colors(number, 'green')})`
const commandInfo = `${colors(command, 'magenta')} [${colors(args.length.toString(), 'yellow')}]`
const separator = colors('-'.repeat(50), 'gray')

const log = '\n'
    + `${header} ${colors(formatDateInTimeZone(new Date(), timeZone) + ` (${timeZone})`, 'dim')}` + '\n'
    + separator + '\n'
    + `${colors('User Info:', 'green')} ${userInfo} ${colors('==', 'white')} ${colors(m.from, 'blue')}` + '\n'
    + separator + '\n'
    + ` | ${colors('Command:', 'green')} ${isCommand ? commandInfo : colors('false', 'yellow')} ` + '\n'
    + ` | ${colors('Text:', 'green')} ${colors(text, 'white')} ` + '\n'
    + ` | ${colors('Message Type:', 'green')} ${colors(m.type, 'bgYellow')} ` + '\n'
    + separator

console.log(log)
}