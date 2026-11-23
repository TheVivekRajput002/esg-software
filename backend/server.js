const app = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');

// Connect to MongoDB
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[ESG Management Server running]: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('[Failed to start server]:', err);
});
