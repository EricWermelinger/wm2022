const express = require('express');
const mongoose = require('mongoose');
const routes = require('./routes/routes');
const cors = require('cors');
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
app.use(cors({
    origin: process.env.URL_FRONTEND
}));
app.use('/api', routes);

app.listen(process.env.PORT, () => console.log('Server Started'));