const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    hash: {
        type: String,
        required: true,
    },
    salt: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        required: true,
        default: false,
    },
    bets: {
        type: Array,
        default: [],
    },
    worldChampion: {
        type: String,
        default: '',
    },
    realWorldChampion: {
        type: String,
        default: '',
    },
});

module.exports = mongoose.model('User', userSchema);