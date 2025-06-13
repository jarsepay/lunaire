// business.js
import fs from 'fs'
import { createCanvas, loadImage } from 'canvas'
import axios from 'axios'
import FormData from 'form-data'

const businessJsonPath = './json/bisnis.json'
const priceJsonPath = './json/prices.json'

const initBusinessData = () => {
    try {
        if (!fs.existsSync(businessJsonPath)) {
            const initialData = {
                businesses: {},
                market: {
                    products: {
                        Clothes: ['tshirt', 'jeans', 'jacket', 'hoodie', 'shoes', 'hat', 'dress'],
                        Market: ['rice', 'oil', 'sugar', 'flour', 'salt', 'coffee', 'tea', 'milk'],
                        Electronic: ['phone', 'laptop', 'headphone', 'charger', 'powerbank', 'camera', 'speaker'],
                        Fastfood: ['air', 'energydrink', 'omorice', 'pizza', 'snack', 'burger', 'fries']
                    }
                }
            }
            fs.writeFileSync(businessJsonPath, JSON.stringify(initialData, null, 2))
            return initialData
        } else {
            return JSON.parse(fs.readFileSync(businessJsonPath))
        }
    } catch (error) {
        console.error('Error initializing business data:', error)
        return {
            businesses: {},
            market: {
                products: {}
            }
        }
    }
}

const initPriceData = () => {
    try {
        if (!fs.existsSync(priceJsonPath)) {
            const initialPrices = {
                basePrice: {
                    // Clothes
                    'tshirt': 25, 'jeans': 50, 'jacket': 80, 'hoodie': 60,
                    'shoes': 100, 'hat': 15, 'dress': 70,
                    // Market
                    'rice': 30, 'oil': 25, 'sugar': 10, 'flour': 15,
                    'salt': 5, 'coffee': 40, 'tea': 20, 'milk': 25,
                    // Electronic
                    'phone': 300, 'laptop': 800, 'headphone': 100, 'charger': 20,
                    'powerbank': 50, 'camera': 500, 'speaker': 150,
                    // Fastfood
                    'air': 15, 'energydrink': 70, 'omorice': 80, 'pizza': 120,
                    'snack': 20, 'burger': 75, 'fries': 60
                }
            }
            fs.writeFileSync(priceJsonPath, JSON.stringify(initialPrices, null, 2))
            return initialPrices
        } else {
            return JSON.parse(fs.readFileSync(priceJsonPath))
        }
    } catch (error) {
        console.error('Error initializing price data:', error)
        return {
            basePrice: {}
        }
    }
}

const businessCertificate = async (business, ownerName) => {
    const canvas = createCanvas(600, 400)
    const ctx = canvas.getContext('2d')

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(1, '#f2f2f2')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 10
    ctx.strokeStyle = '#4a6fa5'
    ctx.lineWidth = 5
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)
    ctx.shadowColor = 'transparent'

    ctx.fillStyle = '#4a6fa5'
    ctx.font = '24px Arial'
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 5
    ctx.fillText('BUSINESS CERTIFICATE', canvas.width / 2, 70)
    ctx.shadowColor = 'transparent'

    ctx.fillStyle = '#333333'
    ctx.font = '18px Arial'
    ctx.fillText(`Business Name: ${business.name}`, canvas.width / 2, 120)
    ctx.fillText(`Type: ${business.type}`, canvas.width / 2, 150)
    ctx.fillText(`Owner: ${ownerName}`, canvas.width / 2, 180)
    ctx.fillText(`Registration Date: ${formatDate(business.established)}`, canvas.width / 2, 210)
    ctx.fillText(`Status: ${business.sealed ? 'SEALED' : 'ACTIVE'}`, canvas.width / 2, 240)

    try {
        const logoImg = await loadImage('https://i.ibb.co.com/fjWn9p8/gov.png')
        ctx.drawImage(logoImg, (canvas.width - 100) / 2, 260, 100, 100)
    } catch (error) {
        console.error('Error loading logo:', error)
    }

    ctx.font = '16px cursive'
    ctx.fillText(`Government Approved`, canvas.width / 2, 370)

    const buffer = canvas.toBuffer('image/png')
    const form = new FormData()
    form.append('image', buffer, {
        filename: 'certificate.png',
        contentType: 'image/png'
    })

    try {
        const response = await axios.post('https://api.imgbb.com/1/upload?key=7ed0f8d9257ac0d96d908e2935a1d224', form, {
            headers: form.getHeaders()
        })
        return response.data.data.url
    } catch (error) {
        console.error('Error uploading certificate:', error)
        return null
    }
}

const openProductBox = (bizData, priceData) => {
    const allProducts = Object.values(bizData.market.products).flat()
    const itemCount = Math.floor(Math.random() * 4) + 2
    const result = {}

    for (let i = 0; i < itemCount; i++) {
        const product = allProducts[Math.floor(Math.random() * allProducts.length)]
        const quantity = Math.floor(Math.random() * 5) + 1
        result[product] = (result[product] || 0) + quantity
    }
    return result
}

const calculateBusinessValue = (business) => {
    const baseValue = 5000
    const reputationValue = business.reputation * 100
    const storageValue = (business.storage.capacity - 50) * 150
    const stockValue = Object.entries(business.products).reduce((total, [product, quantity]) => {
        return total + (quantity * (priceData.basePrice[product] || 100) * 0.7)
    }, 0)
    const incomeValue = business.income * 0.1
    
    return Math.floor(baseValue + reputationValue + storageValue + stockValue + incomeValue)
}

const generateBusinessReport = (business, dateTime) => {
    const totalStock = Object.values(business.products).reduce((sum, q) => sum + q, 0)
    const averagePrice = Object.values(business.prices).reduce((sum, price) => sum + price, 0) / Object.values(business.prices).length
    const monthlyIncome = business.transactions
        .filter(t => t.type === 'sale' && (dateTime.timestamp - new Date(t.date).getTime()) < (30 * 24 * 60 * 60 * 1000))
        .reduce((sum, t) => sum + t.income, 0)
    
    return {
        totalStock,
        averagePrice: Math.floor(averagePrice),
        monthlyIncome,
        profitMargin: business.income > 0 ? Math.floor(((business.income - business.capital) / business.income) * 100) : 0,
        customerRetention: business.customers > 0 ? Math.floor((business.reputation / business.customers) * 100) : 0
    }
}

export {
    initBusinessData,
    initPriceData,
    businessCertificate,
    openProductBox,
    calculateBusinessValue,
    generateBusinessReport
}