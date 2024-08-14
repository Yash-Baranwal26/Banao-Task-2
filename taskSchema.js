const mongoose = require('mongoose')

const task = new mongoose.Schema({

  id:{
    type: String
  },
  symbol:{
    type: String
  },
  name:{
    type: String
  },
  current_price:{
    type: Number
  },
  market_cap:{
    type: Number
  },
  total_volume:{
    type: Number
  },
  last_updated:{
    type: Date
  }

})

const taskData = mongoose.model("task",task)

module.exports = taskData;