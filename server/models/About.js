const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const AboutSchema = new Schema({
    text: {
        type: String,
        require: true
    }
})

module.exports = mongoose.model('About', AboutSchema);