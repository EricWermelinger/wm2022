const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
var crypto = require('crypto'); 
const router = express.Router();
const userModel = require("../model/user-model");
module.exports = router;

router.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        const user = await userModel.findOne({ username: username, password: password });
        if (user.wrongLoginAttempts > process.env.WRONG_LOGIN_ATTEMPTS) {
            return res.status(401).send('Benutzer wurde gesperrt.');
        }
        if (user != null && crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex') === user.hash) {
            const token = jwt.sign({ name: user.username, isAdmin: user.isAdmin }, process.env.ACCESS_TOKEN_SECRET);
            res.status(200).json({ token });
        } else {
            user.wrongLoginAttempts = (user.wrongLoginAttempts ?? 0) + 1;
            await user.save();
            res.status(400).send('Benutzername oder Passwort falsch.');
        }
    } catch (err) {
        res.status(500).send('Es ist ein Fehler aufgetreten.');
    }
});

router.post('/signup', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const code = req.body.code;

    const valid = process.env.REGISTER_CODES.split(',').some(c => c === code);
    if (!valid) {
        return res.status(400).send('Code ist ungültig.');
    }
    try {
        const codeUsed = await userModel.findOne({ code: code });
        if (codeUsed != null) {
            return res.status(400).send('Code ist ungültig.');
        }
        const user = await userModel.findOne({ username: username });
        if (user) {
            return res.status(400).send('Benutzername ist bereits vergeben.');
        }
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        const newUser = new userModel({
            username: username,
            hash: hash,
            salt: salt,
            isAdmin: username === process.env.ADMIN_USERNAME,
            bets: getSchedule(),
            code: code,
        });
        await newUser.save();
        const token = jwt.sign({ name: newUser.username, isAdmin: newUser.isAdmin }, process.env.ACCESS_TOKEN_SECRET);
        res.status(200).json({ token });
    } catch (err) {
        res.status(500).send('Es ist ein Fehler aufgetreten.');
    }
});

router.get('/bets', authenticate, async (req, res) => {
    try {
        const user = await userModel.findOne({ username: req.user.name });
        const bets = user.bets.map(bet => {
            return {
                id: bet.id,
                team1: bet.team1,
                team2: bet.team2,
                score1: bet.score1,
                score2: bet.score2,
                real1: bet.real1,
                real2: bet.real2,
                editable: bet.date > getNewDateEuropeTimeZone(),
                date: getFrontendDate(bet.date),
                points: getNewDateEuropeTimeZone() > bet.date ? calculatePoints(bet.score1, bet.score2, bet.real1, bet.real2) : 0,
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
        const user = await userModel.findOne({ username: req.user.name });
        if (!!user && user.bets.some(bet => bet.id === req.body.id) && user.bets.find(bet => bet.id === req.body.id).date > getNewDateEuropeTimeZone()) {
            user.bets.find(bet => bet.id === req.body.id).score1 = req.body.score1;
            user.bets.find(bet => bet.id === req.body.id).score2 = req.body.score2;
            user.markModified('bets');
            await user.save();
            res.status(200).send();
        } else {
            res.status(500).send('Tipp konnte nicht gespeichert werden.');
        }
    } catch (err) {
        res.status(500).send('Es ist ein Fehler aufgetreten.');
    }
});

router.get('/worldChampion', authenticate, async (req, res) => {
    try {
        const user = await userModel.findOne({ username: req.user.name });
        const worldChampion = {
            worldChampion: user.worldChampion,
            realWorldChampion: user.realWorldChampion,
            editable: user.bets.every(bet => bet.date > getNewDateEuropeTimeZone()),
        }
        res.status(200).json(worldChampion);
    } catch (err) {
        res.status(500).send('Es ist ein Fehler aufgetreten.');
    }
});

router.post('/worldChampion', authenticate, async (req, res) => {
    try {
        const user = await userModel.findOne({ username: req.user.name });
        if (!!user && user.bets.every(bet => bet.date > getNewDateEuropeTimeZone())) {
            user.worldChampion = req.body.worldChampion;
            await user.save();
            res.status(200).send();
        } else {
            res.status(500).send('Es ist ein Fehler aufgetreten.');
        }
    } catch (err) {
        res.status(500).send('Es ist ein Fehler aufgetreten.');
    }
});

router.post('/adminWorldChampion', authenticateAdmin, async (req, res) => {
    try {
        const users = await userModel.find();
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            user.realWorldChampion = req.body.worldChampion;
            user.markModified('realWorldChampion');
            await user.save();
        }
        res.status(200).send();
    } catch (err) {
        res.status(500).send('Es ist ein Fehler aufgetreten.');
    }
});

router.get('/leaderboard', authenticate, async (req, res) => {
    try {
        const allUsers = await userModel.find();
        const leaderboard = allUsers.map(user => {
            const username = user.username;
            const pointsPerGame = user.bets.map(bet => {
                const gameStarted = bet.date < getNewDateEuropeTimeZone();
                const gameEnded = addMinutes(bet.date, 140) < getNewDateEuropeTimeZone();
                const points =  gameStarted ? calculatePoints(bet.score1, bet.score2, bet.real1, bet.real2) : null;
                return {
                    points0: points === 0 ? 1 : 0,
                    points3: points === 3 ? 1 : 0,
                    points4: points === 4 ? 1 : 0,
                    points5: points === 5 ? 1 : 0,
                    points: points ?? 0,
                    currentGame: gameStarted && !gameEnded ? [bet.score1, bet.score2, bet.team1, bet.team2] : [],
                };
            });
            const gamePoints = pointsPerGame.reduce((a, b) => {
                return {
                    points0: a.points0 + b.points0,
                    points3: a.points3 + b.points3,
                    points4: a.points4 + b.points4,
                    points5: a.points5 + b.points5,
                    points: a.points + b.points,
                    currentGame: [...a.currentGame, ...b.currentGame],
                };
            });
            const worldChampionPoints = user.worldChampion === user.realWorldChampion && user.realWorldChampion !== '' ? process.env.POINTS_WORLD_CHAMPION : 0;
            return {
                username,
                ...gamePoints,
                points: gamePoints.points + worldChampionPoints,
            }
        }).sort((a, b) => {
            if (a.points === b.points) {
                if (a.username === req.user.name) {
                    return -1;
                }
                if (b.username === req.user.name) {
                    return 1;
                }
                return a.username.localeCompare(b.username);
            }
            return b.points - a.points;
        });
        const leaderboardWithPositions = leaderboard.map(user => {
            const rank = leaderboard.filter(u => u.points > user.points).length + 1;
            return {
                ...user,
                isCurrentUser: user.username === req.user.name,
                position: rank,
            };
        });
        res.status(200).json(leaderboardWithPositions);
    } catch (err) {
        res.status(500).send('Es ist ein Fehler aufgetreten.');
    }
});

router.get('/admin', authenticateAdmin, async (req, res) => {
    try {
        const user = await userModel.findOne({ username: req.user.name });
        const results = user.bets.map(bet => {
            return {
                id: bet.id,
                team1: bet.team1,
                team2: bet.team2,
                score1: bet.real1,
                score2: bet.real2,
                round: numberToRound(bet.round),
                date: getFrontendDate(bet.date),
            };
        });
        res.status(200).json(results);
    } catch (err) {
        res.status(500).send('Es ist ein Fehler aufgetreten.');
    }
});

router.post('/admin', authenticateAdmin, async (req, res) => {
    try {
        const id = req.body.id;
        const real1 = req.body.score1;
        const real2 = req.body.score2;
        const team1 = req.body.team1;
        const team2 = req.body.team2;
        const users = await userModel.find();
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const bet = user.bets.find(bet => bet.id === id);
            if (!!bet) {
                bet.real1 = real1;
                bet.real2 = real2;
                bet.team1 = team1;
                bet.team2 = team2;
            }
            user.markModified('bets');
            await user.save();
        }
        res.status(200).send();
    } catch (err) {
        res.status(500).send('Es ist ein Fehler aufgetreten.');
    }
});

router.get('/othersBet/:username', authenticate, async (req, res) => {
    try {
        const user = await userModel.findOne({ username: req.params.username });
        const bets = user.bets.map(bet => {
            return {
                id: bet.id,
                team1: bet.team1,
                team2: bet.team2,
                score1: bet.date < getNewDateEuropeTimeZone() ? bet.score1 : null,
                score2: bet.date < getNewDateEuropeTimeZone() ? bet.score2 : null,
                real1: bet.real1,
                real2: bet.real2,
                editable: bet.date > getNewDateEuropeTimeZone(),
                points: calculatePoints(bet.score1, bet.score2, bet.real1, bet.real2),
                round: numberToRound(bet.round),
                date: getFrontendDate(bet.date),
            };
        });
        res.status(200).json(bets);
    } catch (err) {
        res.status(500).send('Es ist ein Fehler aufgetreten.');
    }
});

router.get('/othersWorldChampion/:username', authenticate, async (req, res) => {
    try {
        const user = await userModel.findOne({ username: req.params.username });
        const visible = !user.bets.every(bet => bet.date > getNewDateEuropeTimeZone());
        if (visible) {
            res.status(200).json({ worldChampion: user.worldChampion });
        } else {
            res.status(200).json({ worldChampion: 'nicht verfügbar' });
        }
    } catch (err) {
        res.status(500).send('Es ist ein Fehler aufgetreten.');
    }
});

router.post('/wakeUp', async(_, res) => {
    res.status(200).json({});
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

function calculatePoints(score1, score2, real1, real2) {
    const sameWinner = ((score1 > score2 && real1 > real2) || (score1 < score2 && real1 < real2) || (score1 === score2 && real1 === real2)) ? parseInt(process.env.POINTS_TENDENCY) : 0;
    const sameDifference = (score1 - score2 === real1 - real2) ? parseInt(process.env.POINTS_GOAL_DIFFERENCE) : 0;
    const sameScore = (score1 === real1 && score2 === real2) ? parseInt(process.env.POINTS_EXACT_MATCH) : 0;
    return sameWinner + sameDifference + sameScore;
}

function getSchedule() {
    const schedule = [
        { id: 1, team1: 'Katar', team2: 'Ecuador', date: new Date('2022-11-20T17:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 2, team1: 'England', team2: 'Iran', date: new Date('2022-11-21T14:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 3, team1: 'Senegal', team2: 'Niederlande', date: new Date('2022-11-21T17:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 4, team1: 'USA', team2: 'Wales', date: new Date('2022-11-21T20:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 5, team1: 'Argentinien', team2: 'Saudi-Arabien', date: new Date('2022-11-22T11:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 6, team1: 'Dänemark', team2: 'Tunesien', date: new Date('2022-11-22T14:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 7, team1: 'Mexiko', team2: 'Polen', date: new Date('2022-11-22T17:00:00'), round: 1, score1: 0, score2: 0, real1: 0, real2: 0 },
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
        { id: 41, team1: 'Kroatien', team2: 'Belgien', date: new Date('2022-12-01T16:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 42, team1: 'Kanada', team2: 'Marokko', date: new Date('2022-12-01T16:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 43, team1: 'Japan', team2: 'Spanien', date: new Date('2022-12-01T20:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 44, team1: 'Costa Rica', team2: 'Deutschland', date: new Date('2022-12-01T20:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 45, team1: 'Südkorea', team2: 'Portugal', date: new Date('2022-12-02T16:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 46, team1: 'Ghana', team2: 'Uruguay', date: new Date('2022-12-02T16:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 47, team1: 'Serbien', team2: 'Schweiz', date: new Date('2022-12-02T20:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 48, team1: 'Kamerun', team2: 'Brasilien', date: new Date('2022-12-02T20:00:00'), round: 3, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 49, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-03T16:00:00'), round: 4, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 50, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-03T20:00:00'), round: 4, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 51, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-04T16:00:00'), round: 4, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 52, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-04T20:00:00'), round: 4, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 53, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-05T16:00:00'), round: 4, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 54, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-05T20:00:00'), round: 4, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 55, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-06T16:00:00'), round: 4, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 56, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-06T20:00:00'), round: 4, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 57, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-09T16:00:00'), round: 5, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 58, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-09T20:00:00'), round: 5, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 59, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-10T16:00:00'), round: 5, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 60, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-10T20:00:00'), round: 5, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 61, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-13T20:00:00'), round: 6, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 62, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-14T20:00:00'), round: 6, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 63, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-17T16:00:00'), round: 7, score1: 0, score2: 0, real1: 0, real2: 0 },
        { id: 64, team1: 'tbd', team2: 'tbd', date: new Date('2022-12-18T16:00:00'), round: 7, score1: 0, score2: 0, real1: 0, real2: 0 }
    ];
    if (process.env.USE_TEST_SCHEDULE !== 'true') {
        return schedule;
    }

    const testSchedule = schedule.filter(game => [1, 2, 17, 18, 33, 34, 49, 50, 57, 58, 61, 62, 63, 64].includes(game.id)).map(game => {
        return {
            ...game,
            date: addMinutes(new Date(), game.id),
        }
    });
    return testSchedule;
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

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes*60000);
}

function getNewDateEuropeTimeZone() {
    const date = new Date();
    return addMinutes(date, 60);
}

function getFrontendDate(date) {
    return addMinutes(date, -60);
}