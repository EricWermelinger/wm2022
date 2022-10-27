const express = require('express');
const { Model } = require('mongoose');
const router = express.Router();
module.exports = router;

const userModel = require('../model/model');

// // normal user
// Post Register
// router.post('/register', (req, res) => {
//     res.send('Register');
// });

// Post Login
router.post('/login', async (req, res) => {
    res.status(200).send('Login');

    const data = new Model({
        username: req.body.username,
        password: req.body.password,
    });

    try {
        const dataToSave = await data.save();
        res.status(200).json(dataToSave);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Tipps
// Post Tipps
// Get Standings

// // admin
// Post Results