// faction.js
import fs from 'fs'
const factionFilePath = './json/faction.json'

const loadFactionUsers = (factionName) => {
    try {
        if (!fs.existsSync(factionFilePath)) {
            const initialData = {}
            initialData[factionName] = []
            fs.writeFileSync(factionFilePath, JSON.stringify(initialData))
            return initialData
        }

        const data = JSON.parse(fs.readFileSync(factionFilePath, 'utf8'))
        if (!data[factionName]) {
            data[factionName] = []
        }
        return data
    } catch (error) {
        console.error(`Error loading faction data for ${factionName}:`, error)
        const fallbackData = {}
        fallbackData[factionName] = []
        return fallbackData
    }
}

const saveFactionUsers = (data) => {
    try {
        fs.writeFileSync(factionFilePath, JSON.stringify(data, null, 2))
        return true
    } catch (error) {
        console.error('Error saving faction data:', error)
        return false
    }
}

const calculateDutyHours = (startTime, endTime) => {
    const diffMs = endTime - startTime
    const diffMinutes = Math.round(diffMs / 60000)
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return `${hours} jam ${minutes} menit`
}

const loadGovUsers = () => loadFactionUsers('Government')
const loadMedUsers = () => loadFactionUsers('MedicalDepartment')
const loadNewsUsers = () => loadFactionUsers('NewsNetwork')
const loadPoliceUsers = () => loadFactionUsers('PoliceDepartment')

const factionGovData = loadGovUsers()
const factionMedData = loadMedUsers()
const factionNewsData = loadNewsUsers()
const factionPoliceData = loadPoliceUsers()

export {
    loadGovUsers,
    factionGovData,
    loadMedUsers,
    factionMedData,
    loadNewsUsers,
    factionNewsData,
    loadPoliceUsers,
    factionPoliceData,
    calculateDutyHours,
    saveFactionUsers
}