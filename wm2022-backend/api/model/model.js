const mongoose = require('mongoose');

const dataSchemaLogin = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    }
});

module.exports = mongoose.model('Login', dataSchemaLogin);