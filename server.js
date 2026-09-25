const express = require("express")
const app = express()
app.use(express.json())

const registeredUsers = {}

app.post("/register", (req, res) => {
    const { username, jobId } = req.body
    if (!username || !jobId) return res.status(400).json({ error: "Missing fields" })
    registeredUsers[username] = { jobId, timestamp: Date.now() }
    console.log(`Registered: ${username} | Job: ${jobId}`)
    res.json({ success: true })
})

app.get("/list", (req, res) => {
    const now = Date.now()
    const active = {}
    for (const [username, data] of Object.entries(registeredUsers)) {
        if (now - data.timestamp < 300000) {
            active[username] = data
        }
    }
    res.json({ users: Object.keys(active) })
})

app.get("/jobs", (req, res) => {
    const now = Date.now()
    const active = {}
    for (const [username, data] of Object.entries(registeredUsers)) {
        if (now - data.timestamp < 300000) {
            active[username] = data.jobId
        }
    }
    res.json({ jobs: active })
})

app.post("/heartbeat", (req, res) => {
    const { username } = req.body
    if (!username) return res.status(400).json({ error: "Missing username" })
    if (registeredUsers[username]) {
        registeredUsers[username].timestamp = Date.now()
    }
    res.json({ success: true })
})

app.delete("/unregister", (req, res) => {
    const { username } = req.body
    if (!username) return res.status(400).json({ error: "Missing username" })
    delete registeredUsers[username]
    res.json({ success: true })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
