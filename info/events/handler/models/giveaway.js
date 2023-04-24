const mongoose = require('mongoose');
const { stringify } = require('querystring');

module.exports = mongoose.model(
    "giveaways",
   new mongoose.Schema({
       Guild: String,
       Host: String,
       Channel: String,
       MessageID: String,
       Title: String,
       Color: String,
       Bcolor: String,
       Reaction: String,
       Winners: Number,
       Time: String,
       Date: Date,
       Users: [ String ],
       Ended: Boolean
   }) 
);