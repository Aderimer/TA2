const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const now = new Date(Date.now())
const year = new Date(now).getFullYear();
const PostSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    alt: {
        type: String,
        required: false
    },
    category: {
        type: String,
        required: false,
    },
    imageName: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: year
    },
    updatedAt: {
        type: Date,
        default: year 
    }
});


module.exports = mongoose.model('Post', PostSchema)