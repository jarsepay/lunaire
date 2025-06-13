const getRankName = (rankNumber) => {
    const ranks = {
        1: 'Intern',
        2: 'Reporter',
        3: 'Senior Reporter',
        4: 'Editor',
        5: 'News Anchor',
        6: 'News Director',
        7: 'Network CEO'
    }

    return ranks[rankNumber]
}

const hasHighPrivilege = (user) => {
    const highRanks = ['News Director', 'Network CEO']
    return highRanks.includes(user.divisi)
}

const validateAdsCategory = (category) => {
    const validCategories = ['sell', 'buy', 'trade']
    return validCategories.includes(category.toLowerCase())
}

const formatTimeRemaining = (milliseconds) => {
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

export {
    getRankName,
    hasHighPrivilege,
    validateAdsCategory,
    formatTimeRemaining
}