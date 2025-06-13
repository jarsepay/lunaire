// staff.js
import fs from 'fs'
const staffFilePath = './json/staff.json'

const loadStaff = () => {
    if (fs.existsSync(staffFilePath)) {
        return JSON.parse(fs.readFileSync(staffFilePath))
    }
    return {}
}

const saveStaff = (staff) => {
    fs.writeFileSync(staffFilePath, JSON.stringify(staff, null, 2))
}

const rankMapping = {
    "0": "Trial Staff",
    "1": "Low Staff",
    "2": "Upper Staff",
    "3": "High Staff",
    "4": "Super Staff",
    "5": "Head Staff"
}

const rankHierarchy = {
    "Trial Staff": 0,
    "Low Staff": 1,
    "Upper Staff": 2,
    "High Staff": 3,
    "Super Staff": 4,
    "Head Staff": 5
}

const staffData = loadStaff()

export {
    staffData,
    loadStaff,
    saveStaff,
    rankMapping,
    rankHierarchy
}