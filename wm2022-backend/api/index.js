const express = require('express');
const mongoose = require('mongoose');
const routes = require('./routes/routes');
require('dotenv').config();

mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to Database'));

const app = express();
app.use(express.json());
app.use('/api', routes);
app.listen(3000, () => {
    console.log('Listening on port 3000');
});