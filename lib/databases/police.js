class Police {
    constructor() {
        this.calculateShiftHours = this.calculateShiftHours.bind(this)
        this.getRankName = this.getRankName.bind(this)
        this.hasHighPrivilege = this.hasHighPrivilege.bind(this)
        this.formatTimeRemaining = this.formatTimeRemaining.bind(this)
        this.validateJailReason = this.validateJailReason.bind(this)
        this.getJailDuration = this.getJailDuration.bind(this)
        this.initializeFactionData = this.initializeFactionData.bind(this)
    }

    calculateShiftHours(startTime, endTime) {
        const diffMs = endTime - startTime
        const diffMinutes = Math.round(diffMs / 60000)
        const hours = Math.floor(diffMinutes / 60)
        const minutes = diffMinutes % 60
        return `${hours} jam ${minutes} menit`
    }

    getRankName(rankNumber) {
        const ranks = {
            1: 'Cadet',
            2: 'Officer',
            3: 'Senior Officer',
            4: 'Sergeant',
            5: 'Lieutenant',
            6: 'Captain',
            7: 'Chief of Police'
        }
        return ranks[rankNumber]
    }

    hasHighPrivilege(user) {
        const highRanks = ['Captain', 'Chief of Police']
        return highRanks.includes(user.divisi)
    }

    formatTimeRemaining(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000)
        const days = Math.floor(totalSeconds / (24 * 3600))
        const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60

        let result = []
        if (days > 0) result.push(`${days} hari`)
        if (hours > 0) result.push(`${hours} jam`)
        if (minutes > 0) result.push(`${minutes} menit`)
        if (seconds > 0 && days === 0) result.push(`${seconds} detik`)

        return result.join(' ')
    }

    validateJailReason(reason) {
        const validReasons = [
            'assault', 'theft', 'vandalism', 'drug_possession', 
            'disturbing_peace', 'trespassing', 'fraud', 'weapon_possession', 'other'
        ]
        return validReasons.includes(reason.toLowerCase())
    }

    getJailDuration(reason) {
        const durations = {
            'assault': 30 * 60 * 1000,
            'theft': 45 * 60 * 1000,
            'vandalism': 20 * 60 * 1000,
            'drug_possession': 60 * 60 * 1000,
            'disturbing_peace': 15 * 60 * 1000,
            'trespassing': 20 * 60 * 1000,
            'fraud': 90 * 60 * 1000,
            'weapon_possession': 120 * 60 * 1000,
            'other': 30 * 60 * 1000
        }
        return durations[reason.toLowerCase()] || durations['other']
    }

    initializeFactionData() {
        if (!factionGovData.Government) {
            factionGovData.Government = []
        }

        if (!factionPoliceData.PoliceForce) {
            factionPoliceData.PoliceForce = []
        }

        if (!factionPoliceData.JailRecords) {
            factionPoliceData.JailRecords = []
        }

        if (!factionPoliceData.PoliceReports) {
            factionPoliceData.PoliceReports = []
        }
    }
}

export default Police