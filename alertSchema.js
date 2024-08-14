const mongoose = require('mongoose')

const alertSchema = new mongoose.Schema({
    userId: { 
        type: String,
        required: true 
    },
    email: { 
        type: String,
        required: true 
    },
    coinId: { 
        type: String,
        required: true 
    },
    threshold: { 
        type: Number,
        required: true 
    },
    comparison: { 
        type: String, 
        required: true, 
        enum: ['greater_than', 'less_than'] 
    }, 
    isActive: { 
        type: Boolean, 
        default: true 
    }, 
    lastNotified: { 
        type: Date 
    },  
    createdAt: { 
        type: Date, 
        default: Date.now 
    } 
  });
  
  const alert = mongoose.model('alert', alertSchema);
  
  module.exports = alert;