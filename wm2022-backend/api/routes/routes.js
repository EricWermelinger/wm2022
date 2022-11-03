const express = require('express');
const jwt = require('jsonwebtoken');
const { Model } = require('mongoose');
var crypto = require('crypto'); 
const router = express.Router();
module.exports = router;

router.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        const user = await Model.findOne({ username: username, password: password });
        if (user != null && crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex') === user.hash) {
            const token = jwt.sign({ name: user.username, isAdmin: user.isAdmin }, process.env.ACCESS_TOKEN_SECRET);
            res.status(200).json({ token });
        } else {
            res.status(401).send('Benutzername oder Passwort falsch.');
        }
    } catch (err) {
        res.status(500).send('Es ist ein Fehler aufgetreten.');
    }
});

router.post('/signup', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const code = req.body.code;

    if (code !== process.env.SIGNUP_CODE) {
        return res.status(401).send('Code ist ungültig.');
    }
    try {
        const user = await Model.findOne({ username: username });
        if (user) {
            return res.status(401).send('Benutzername ist bereits vergeben.');
        }
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        const newUser = new Model({
            username: username,
            hash: hash,
            salt: salt,
            isAdmin: username === process.env.ADMIN_USERNAME,
            bets: getSchedule(),
        });
        await newUser.save();
        const token = jwt.sign({ name: user.username, isAdmin: user.isAdmin }, process.env.ACCESS_TOKEN_SECRET);
        res.status(200).json({ token });
    } catch (err) {
        res.status(500).send('Es ist ein Fehler aufgetreten.');
    }
});

router.get('/bets', authenticate, async (req, res) => {
    try {
        const user = await Model.findOne({ username: req.user.name });
        const bets = user.bets.map(bet => {
            return {
                id: bet.id,
                team1: bet.team1,
                team2: bet.team2,
                bet1: bet.bet1,
                bet2: bet.bet2,
                editable: bet.date > new Date(),
                points: calculatePoints(bet.bet1, bet.bet2, bet.real1, bet.real2),
                round: numberToRound(bet.round),
            }
        });
        res.status(200).json(bets);
    } catch (err) {
        res.status(500).send('Es ist ein Fehler aufgetreten.');
    }
});

router.post('/bets', authenticate, async (req, res) => {
    try {
        const user = await Model.findOne({ username: req.user.name });
        const bet = user.bets.find(bet => bet.id === req.body.id);
        if (bet && bet.date > new Date()) {
            bet.bet1 = req.body.bet1;
            bet.bet2 = req.body.bet2;
            await user.save();
            res.status(200).send();
        } else {
            res.status(500).send('Tipp konnte nicht gespeichert werden.');
        }
    } catch (err) {
        res.status(500).send('Es ist ein Fehler aufgetreten.');
    }
});

router.post('/result', authenticateAdmin, async (req, res) => {
    try {
        const id = req.body.id;
        const real1 = req.body.real1;
        const real2 = req.body.real2;
        const users = await Model.find();
        users.forEach(user => {
            const bet = user.bets.find(bet => bet.id === id);
            if (bet) {
                bet.real1 = real1;
                bet.real2 = real2;
            }
        });
        await Model.updateMany({}, users);
        res.status(200).send();
    } catch (err) {
        res.status(500).send('Es ist ein Fehler aufgetreten.');
    }
});


router.get('/leaderboard', authenticate, async (req, res) => {
    try {
        const allUsers = await Model.find();
        const leaderboard = allUsers.map(user => {
            const username = user.username;
            const points = user.bets.map(bet => {
                if (bet.date < new Date()) {
                    return calculatePoints(bet.score1, bet.score2, bet.real1, bet.real2);
                }
                return 0;
            }).reduce((a, b) => a + b, 0);
            return {
                username,
                points,
            }
        }).sort((a, b) => b.points - a.points).map((user, index) => {
            return {
                ...user,
                position: index + 1,
            }
        });
        res.status(200).json(leaderboard);
    } catch (err) {
        res.status(500).send('Es ist ein Fehler aufgetreten.');
    }
});

function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.status(401).send('Benutzername oder Passwort falsch.');
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(401).send('Benutzername oder Passwort falsch.');
        }
        req.user = user;
        next();
    });
}

function authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.status(401).send('Benutzername oder Passwort falsch.');
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(401).send('Benutzername oder Passwort falsch.');
        }
        if (!user.isAdmin) {
            return res.status(401).send('Keine Berechtigung.');
        }
        req.user = user;
        next();
    });
}

function calculatePoints(bet1, bet2, real1, real2) {
    const points = (bet1 - bet2 > 0 && real1 - real2 > 0) || (bet1 - bet2 < 0 && real1 - real2 < 0) || (bet1 - bet2 === 0 && real1 - real2 === 0) ? parseInt(process.env.POINTS_GOAL_DIFFERENCE) : 0
        + (bet1 - bet2 === real1 - real2 ? parseInt(process.env.POINTS_GOAL_DIFFERENCE) : 0)
        + (bet1 === real1 && bet2 === real2) ? parseInt(process.env.POINTS_EXACT_MATCH) : 0;
    return points;
}

function getSchedule() {
    const schedule = [
        { id: 1, team1: 'Katar', team2: 'Ecuador', date: new Date('2022-11-20T17:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 2, team1: 'England', team2: 'Iran', date: new Date('2022-11-21T14:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 3, team1: 'Senegal', team2: 'Niederlande', date: new Date('2022-11-21T17:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 4, team1: 'USA', team2: 'Wales', date: new Date('2022-11-21T20:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 5, team1: 'Argentinien', team2: 'Saudi-Arabien', date: new Date('2022-11-22T11:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 6, team1: 'Dänemark', team2: 'Tunesien', date: new Date('2022-11-22T14:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 7, team1: 'Mexico', team2: 'Polen', date: new Date('2022-11-22T17:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 8, team1: 'Frankreich', team2: 'Australien', date: new Date('2022-11-22T20:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 9, team1: 'Marokko', team2: 'Kroatien', date: new Date('2022-11-23T11:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 10, team1: 'Deutschland', team2: 'Japan', date: new Date('2022-11-23T14:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 11, team1: 'Spanien', team2: 'Costa Rica', date: new Date('2022-11-23T17:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 12, team1: 'Belgien', team2: 'Kanada', date: new Date('2022-11-23T20:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 13, team1: 'Schweiz', team2: 'Kamerun', date: new Date('2022-11-24T11:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 14, team1: 'Uruguay', team2: 'Südkorea', date: new Date('2022-11-24T14:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 15, team1: 'Portugal', team2: 'Ghana', date: new Date('2022-11-24T17:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 16, team1: 'Brasilien', team2: 'Serbien', date: new Date('2022-11-24T20:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 17, team1: 'Wales', team2: 'Iran', date: new Date('2022-11-25T11:00:00'), round: 2, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 18, team1: 'Katar', team2: 'Senegal', date: new Date('2022-11-25T14:00:00'), round: 2, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 19, team1: 'Niederlande', team2: 'Ecuador', date: new Date('2022-11-25T17:00:00'), round: 2, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 20, team1: 'England', team2: 'USA', date: new Date('2022-11-25T20:00:00'), round: 2, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 21, team1: 'Tunesien', team2: 'Australien', date: new Date('2022-11-26T11:00:00'), round: 2, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 22, team1: 'Polen', team2: 'Saudi-Arabien', date: new Date('2022-11-26T14:00:00'), round: 2, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 23, team1: 'Frankreich', team2: 'Dänemark', date: new Date('2022-11-26T17:00:00'), round: 2, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 24, team1: 'Argentinien', team2: 'Mexiko', date: new Date('2022-11-26T20:00:00'), round: 2, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 25, team1: 'Japan', team2: 'Costa Rica', date: new Date('2022-11-27T11:00:00'), round: 2, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 26, team1: 'Belgien', team2: 'Marokko', date: new Date('2022-11-27T14:00:00'), round: 2, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 27, team1: 'Kroatien', team2: 'Kanada', date: new Date('2022-11-27T17:00:00'), round: 2, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 28, team1: 'Spanien', team2: 'Deutschland', date: new Date('2022-11-27T20:00:00'), round: 2, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 29, team1: 'Kamerun', team2: 'Serbien', date: new Date('2022-11-28T11:00:00'), round: 2, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 30, team1: 'Südkorea', team2: 'Ghana', date: new Date('2022-11-28T14:00:00'), round: 2, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 31, team1: 'Brasilien', team2: 'Schweiz', date: new Date('2022-11-28T17:00:00'), round: 2, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 32, team1: 'Portugal', team2: 'Uruguay', date: new Date('2022-11-28T20:00:00'), round: 2, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 33, team1: 'Ecuador', team2: 'Senegal', date: new Date('2022-11-29T16:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 34, team1: 'Niederlande', team2: 'Katar', date: new Date('2022-11-29T16:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 35, team1: 'Iran', team2: 'USA', date: new Date('2022-11-29T20:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 36, team1: 'Wales', team2: 'England', date: new Date('2022-11-29T20:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 37, team1: 'Tunesien', team2: 'Frankreich', date: new Date('2022-11-30T16:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 38, team1: 'Australien', team2: 'Dänemark', date: new Date('2022-11-30T16:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 39, team1: 'Polen', team2: 'Argentinien', date: new Date('2022-11-30T20:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 40, team1: 'Saudi-Arabien', team2: 'Mexiko', date: new Date('2022-11-30T20:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 41, team1: 'Kroatien', team2: 'Belgien', date: new Date('2022-12-1T16:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 42, team1: 'Kanada', team2: 'Marokko', date: new Date('2022-12-1T16:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 43, team1: 'Japan', team2: 'Spanien', date: new Date('2022-12-1T20:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 44, team1: 'Costa Rica', team2: 'Deutschland', date: new Date('2022-12-1T20:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 45, team1: 'Südkorea', team2: 'Portugal', date: new Date('2022-12-2T16:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 46, team1: 'Ghana', team2: 'Uruguay', date: new Date('2022-12-2T16:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 47, team1: 'Serbien', team2: 'Schweiz', date: new Date('2022-12-2T20:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 48, team1: 'Kamerun', team2: 'Brasilien', date: new Date('2022-12-2T20:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 49, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-3T16:00:00'), round: 4, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 50, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-3T20:00:00'), round: 4, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 51, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-4T16:00:00'), round: 4, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 52, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-4T20:00:00'), round: 4, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 53, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-5T16:00:00'), round: 4, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 54, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-5T20:00:00'), round: 4, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 55, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-6T16:00:00'), round: 4, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 56, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-6T20:00:00'), round: 4, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 57, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-9T16:00:00'), round: 5, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 58, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-9T20:00:00'), round: 5, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 59, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-10T16:00:00'), round: 5, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 60, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-10T20:00:00'), round: 5, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 61, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-13T20:00:00'), round: 6, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 62, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-14T20:00:00'), round: 6, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 63, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-17T16:00:00'), round: 7, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 64, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-18T16:00:00'), round: 7, score1: 0, score2: 0, real1: 0, real2: 0 }
    ];
    return schedule;
}

function numberToRound(number) {
    switch (number) {
        case 1:
            return 'first-round';
        case 2:
            return 'second-round';
        case 3:
            return 'third-round';
        case 4:
            return 'eighth-finals';
        case 5:
            return 'quarter-finals';
        case 6:
            return 'semi-finals';
        case 7:
            return 'final';
        default:
            return 'first-round';
    }
}