const express = require("express")
const app = express()
app.use(express.json())

const users = {}
const EXPIRY_MS = 300000

function purgeStale() {
    const now = Date.now()
    for (const username in users) {
        if (now - users[username].timestamp > EXPIRY_MS) {
            delete users[username]
        }
    }
}

setInterval(purgeStale, 30000)

app.post("/register", (req, res) => {
    const { username, jobId, score, raritySummary } = req.body
    if (!username || !jobId) return res.status(400).json({ error: "Missing fields" })
    const now = Date.now()
    users[username] = {
        jobId,
        score: score || 0,
        raritySummary: raritySummary || {},
        timestamp: now,
        registeredAt: users[username]?.registeredAt || now,
        tradeCount: users[username]?.tradeCount || 0,
    }
    console.log(`[REGISTER] ${username} | Job: ${jobId} | Score: ${score || 0}`)
    res.json({ success: true })
})

app.post("/heartbeat", (req, res) => {
    const { username } = req.body
    if (!username) return res.status(400).json({ error: "Missing username" })
    if (users[username]) {
        users[username].timestamp = Date.now()
    }
    res.json({ success: true })
})

app.post("/trade_complete", (req, res) => {
    const { username } = req.body
    if (!username) return res.status(400).json({ error: "Missing username" })
    if (users[username]) {
        users[username].tradeCount = (users[username].tradeCount || 0) + 1
    }
    res.json({ success: true })
})

app.delete("/unregister", (req, res) => {
    const { username } = req.body
    if (!username) return res.status(400).json({ error: "Missing username" })
    delete users[username]
    res.json({ success: true })
})

app.get("/list", (req, res) => {
    purgeStale()
    res.json({ users: Object.keys(users) })
})

app.get("/jobs", (req, res) => {
    purgeStale()
    const jobs = {}
    for (const [username, data] of Object.entries(users)) {
        jobs[username] = data.jobId
    }
    res.json({ jobs })
})

app.get("/scores", (req, res) => {
    purgeStale()
    const scores = {}
    for (const [username, data] of Object.entries(users)) {
        scores[username] = data.score || 0
    }
    res.json({ scores })
})

app.get("/full", (req, res) => {
    purgeStale()
    res.json({ users })
})

app.get("/stats", (req, res) => {
    purgeStale()
    let totalScore = 0
    let totalTrades = 0
    for (const data of Object.values(users)) {
        totalScore += data.score || 0
        totalTrades += data.tradeCount || 0
    }
    res.json({
        activeUsers: Object.keys(users).length,
        totalScore,
        totalTrades,
    })
})

app.get("/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime(), users: Object.keys(users).length })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`[SERVER] Running on port ${PORT}`))
