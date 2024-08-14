const mongoose = require('mongoose')
const taskSchema = require('./taskSchema')
const express = require('express')
const fetch = require('node-fetch');
const alertSchema = require('./alertSchema')
const nodemailer = require('nodemailer')

const app = express();
const PORT = 1234;

app.use(express.json())

mongoose.connect('mongodb://localhost:27017/cryptoAlerts')
.then(()=>{
    console.log("DB Connected")
}).catch(err=>{console.log(err)});



const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc';
const options = {
  method: 'GET',
  headers: {accept: 'application/json', 'x-cg-demo-api-key': 'CG-9ND8WvWhHv3doLZupJTiqUMp'}
};

//Cache Memory
let cache = {};
const CACHE_TTL = 60 * 1000; 

// Email for Alerting System
const sendNotification = async (email, userId, coinId, currentPrice, threshold, comparison) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
       user: "stranger2copy@gmail.com", // Gmail Address
       pass: "axlt cryx qopc nzds", // Password of gmail (Generated app password)    
       }
    });

    const mailOptions = {
      from: '"Yash Baranwal" <stranger2copy@gmail.com>',
      to: email, 
      subject: 'Price Alert Triggered',
      text: `The price of ${coinId} has ${comparison} ${threshold}. Current price: ${currentPrice}.`
    };

    await transporter.sendMail(mailOptions);
    console.log(`Notification sent to user ${userId} for coin ${coinId}`);
  } catch (err) {
    console.error('Error sending email:', err.message);
  }
};

// Fetching data from cache
  const fetchAndUpdateCryptoData = async () => {
    console.log('Fetching and updating crypto data...');
    const currentTime = new Date().getTime();
    
    if (cache.data && (currentTime - cache.timestamp < CACHE_TTL)) {
      console.log('Fetching data from cache...');
      const json = cache.data;
      await processCryptoData(json);
      return;
    }

    try {
      const res = await fetch(url, options);
      const json = await res.json();
      cache.data = json;
      cache.timestamp = currentTime;
      await processCryptoData(json);
      console.log("Cryptocurrency data updated successfully.");
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };
  
  // Get data from API
  const processCryptoData = async (json) => {
        for (const coin of json) {
          const filter = { id: coin.id };
          const update = {
            symbol: coin.symbol,
            name: coin.name,
            current_price: coin.current_price,
            market_cap: coin.market_cap,
            total_volume: coin.total_volume,
            last_updated: new Date() 
          };
          await taskSchema.findOneAndUpdate(filter, update, { upsert: true, new: true });
       
          // Check the alert is required or not
      const alerts = await alertSchema.find({ coinId: coin.id, isActive: true });
      for (const alert of alerts) {
        let alertTriggered = false;

        switch (alert.comparison) {
          case 'greater_than':
            if (coin.current_price > alert.threshold) alertTriggered = true;
            break;
          case 'less_than':
            if (coin.current_price < alert.threshold) alertTriggered = true;
            break;
        }

        if (alertTriggered) {

        await sendNotification(alert.email, alert.userId, coin.id, coin.current_price, alert.threshold, alert.comparison);

        alert.isActive = false;
        alert.lastNotified = new Date();
        await alert.save();
      }
    }
  }
};
  
  // Now data will continuously update from the CoinGecko API
  setInterval(fetchAndUpdateCryptoData, 10000);

  // Alert API
app.post('/alerts', async (req, res) => {
  try {
    const { userId, email, coinId, threshold, comparison, isActive } = req.body;

    const alert = await alertSchema.create({
      userId,
      email, 
      coinId,
      threshold,
      comparison,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({ message: 'Alert created successfully', alert });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



app.listen(PORT, ()=>console.log("Connection is build properly"))