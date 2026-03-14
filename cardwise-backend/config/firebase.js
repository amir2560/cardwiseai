const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB connected')
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

module.exports = connectDB
  ```

### Update your `.env`
```
PORT = 3001
FRONTEND_URL = http://localhost:8080
MONGO_URI = mongodb + srv://mohammednaqvi725:AmirC@cluster0.2oblwl1.mongodb.net/?appName=Cluster0