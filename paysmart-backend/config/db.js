const mongoose = require('mongoose')
const dns = require('dns')

// Workaround for ISP DNS timeouts on SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4'])
} catch (e) {
  console.warn("Could not set DNS servers:", e.message)
}
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(`✅ MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message)
    process.exit(1)
  }
}

module.exports = connectDB
