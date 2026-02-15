import { NextRequest, NextResponse } from 'next/server'

// In-memory mapping as fallback (will be lost on server restart)
// NOTE: In a serverless environment (e.g. Vercel, Netlify), this memory is not shared.
// For production serverless deployments, use Redis or a database table.
const subscriptionUserMapping = new Map<string, {
    userId: string,
    plan: string,
    billingPeriod: string,
    userEmail: string,
    paymentId?: string,
    timestamp: number
}>()

// Time-based pending checkouts (keyed by user ID + plan + billing period)
const pendingCheckouts = new Map<string, {
    userId: string,
    plan: string,
    billingPeriod: string,
    userEmail: string,
    userName: string,
    timestamp: number
}>()

interface MappingData {
    userId: string
    plan: string
    billingPeriod: string
    userEmail: string
    paymentId?: string
    userName?: string
}

const fs = typeof window === 'undefined' ? require('fs') : null
const path = typeof window === 'undefined' ? require('path') : null
const MAPPING_FILE = path ? path.resolve(process.cwd(), 'payment-mapping.json') : null

// Load mappings from disk if available
function loadMappings() {
    if (!fs || !MAPPING_FILE || !fs.existsSync(MAPPING_FILE)) return
    try {
        const data = fs.readFileSync(MAPPING_FILE, 'utf8')
        const json = JSON.parse(data)

        // Restore subscription mapping
        if (json.mappings) {
            Object.entries(json.mappings).forEach(([key, value]) => {
                subscriptionUserMapping.set(key, value as any)
            })
        }

        // Restore pending checkouts
        if (json.pending) {
            Object.entries(json.pending).forEach(([key, value]) => {
                pendingCheckouts.set(key, value as any)
            })
        }
        console.log('📦 [PaymentUtils] Loaded persistent mappings from disk')
    } catch (e) {
        console.error('Error loading payment mappings:', e)
    }
}

// Save mappings to disk
function saveMappings() {
    if (!fs || !MAPPING_FILE) return
    try {
        const mappingsObj = Object.fromEntries(subscriptionUserMapping)
        const pendingObj = Object.fromEntries(pendingCheckouts)

        fs.writeFileSync(MAPPING_FILE, JSON.stringify({
            mappings: mappingsObj,
            pending: pendingObj,
            updated: Date.now()
        }, null, 2))
    } catch (e) {
        console.error('Error saving payment mappings:', e)
    }
}

// Initial load
loadMappings()

export const PaymentUtils = {
    storeMapping: (subscriptionId: string, data: MappingData) => {
        const timestamp = Date.now()
        const mapping = { ...data, timestamp }

        // Store by subscription ID
        subscriptionUserMapping.set(subscriptionId, mapping)
        console.log(`📝 [PaymentUtils] Stored mapping: ${subscriptionId} -> ${data.userId} (${data.userEmail})`)

        // Also store by payment ID if available
        if (data.paymentId) {
            subscriptionUserMapping.set(data.paymentId, mapping)
            console.log(`📝 [PaymentUtils] Stored mapping by payment ID: ${data.paymentId} -> ${data.userId}`)
        }

        // Store as pending checkout for time-based correlation
        const pendingKey = `${data.userId}:${data.plan}:${data.billingPeriod}`
        pendingCheckouts.set(pendingKey, {
            userId: data.userId,
            plan: data.plan,
            billingPeriod: data.billingPeriod,
            userEmail: data.userEmail,
            userName: data.userName || data.userEmail,
            timestamp
        })

        saveMappings()
    },

    getMapping: (id: string) => {
        const mapping = subscriptionUserMapping.get(id)
        if (mapping) {
            console.log(`📋 [PaymentUtils] Retrieved mapping: ${id} -> ${mapping.userId}`)
        }
        return mapping || null
    },

    findRecentCheckout: (plan: string, billingPeriod: string) => {
        const now = Date.now()
        const maxAge = 15 * 60 * 1000 // 15 minutes

        let bestMatch: any = null
        let bestScore = 0

        for (const [key, pending] of pendingCheckouts.entries()) {
            const age = now - pending.timestamp
            if (age > maxAge) continue

            let score = 1
            if (pending.plan === plan) score += 10
            if (pending.billingPeriod === billingPeriod) score += 10
            score += Math.max(0, (maxAge - age) / maxAge) * 5

            if (score > bestScore) {
                bestScore = score
                bestMatch = pending
            }
        }

        if (bestMatch) {
            return {
                mapping: bestMatch,
                correlationScore: bestScore
            }
        }
        return null
    },

    // Clean up old mappings
    cleanup: () => {
        const now = Date.now()
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours
        let changed = false

        for (const [key, value] of subscriptionUserMapping.entries()) {
            if (now - value.timestamp > maxAge) {
                subscriptionUserMapping.delete(key)
                changed = true
            }
        }
        const pendingMaxAge = 60 * 60 * 1000 // 1 hour for pending checkouts
        for (const [key, value] of pendingCheckouts.entries()) {
            if (now - value.timestamp > pendingMaxAge) {
                pendingCheckouts.delete(key)
                changed = true
            }
        }

        if (changed) saveMappings()
    }
}

// Run cleanup periodically if long-running
if (typeof setInterval !== 'undefined') {
    setInterval(() => PaymentUtils.cleanup(), 60 * 60 * 1000)
}
