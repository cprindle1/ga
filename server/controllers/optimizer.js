const GeneticAlgorithmConstructor = require('geneticalgorithm');
const csv = require('csvtojson')

module.exports = {
    test(req, res) {
        return res.status(200).send({
            success: true,
            message: 'Setup complete',
        });
    },

    getHistoricalData(req, res) {
        const csvFilePath = './fanduelData/fanduel_NFL_2018-week-' + req.query.week + '_players.csv'
        csv()
            .fromFile(csvFilePath)
            .then((data) => {
                splitIntoPositionArrays(data, () => {
                    var best = [];
                    let weeklyLineups = [];
                    let weeklyLineupProjections = [];
                    let weeklyActualScores = [];
                    buildFirstLineup((lineup) => {

                        for (let x = 0; x < 20; x++) {
                            var previousBestScore = 0;
                            var geneticalgorithm = GeneticAlgorithmConstructor({
                                mutationFunction: mutate,
                                // crossoverFunction: crossover,
                                fitnessFunction: fitness,
                                // doesABeatBFunction: competition,
                                population: [lineup],
                                populationSize: 500 // defaults to 100
                            });
                            for (var a = 0; a < 100; a++) {
                                for (var i = 0; i < data.length; i++) geneticalgorithm.evolve()
                                var score = geneticalgorithm.bestScore()
                                if (score == previousBestScore) {
                                    best = geneticalgorithm.best()
                                    weeklyActualScores.push(computeActual(best))
                                    weeklyLineups.push(best.map(a => a.Player));
                                    weeklyLineupProjections.push(score);
                                    setBest(best);
                                    diversify(best);
                                    console.log(weeklyLineupProjections[weeklyLineupProjections.length - 1]);
                                    break;
                                }
                                previousBestScore = score;
                            }
                            // lineup = mutate(best);
                            console.log('generated lineup: ' + (x + 1));
                        }
                    });

                    return res.status(200).send({
                        weeklyLineupProjections: weeklyLineupProjections,
                        weeklyActualScores: weeklyActualScores,
                        weeklyLineups: weeklyLineups,
                        // totalpop: data.length,
                        stats: getstats(),
                        success: true,
                        message: 'Week ' + req.query.week + ' Evaluation Complete',
                    });
                });
            });
    }
};

let QBs = [];
let RBs = [];
let WRs = [];
let TEs = [];
let DSTs = [];
let mutations = 0;
let crossovers = 0;
let competitions = 0;
let fitnesses = 0;
let usedPlayers = [];
let bestLineups = [];

let targetQB = {
    projection: 19.5096875,
    salary: 7481.5625
}
let targetRB = {
    projection: 9.70878124999998,
    salary: 5988.125
}
let targetWR = {
    projection: 10.509375,
    salary: 6198.64583333333
}
let targetTE = {
    projection: 7.49471875,
    salary: 5414.0625
}
let targetFlex = {
    projection: 12.00084375,
    salary: 6430
}
let targetDST = {
    projection: 8.308125,
    salary: 3939.6875
}
splitIntoPositionArrays = (data, callback) => {
    QBs = [];
    RBs = [];
    WRs = [];
    TEs = [];
    DSTs = [];
    usedPlayers = [];
    bestLineups = [];
    mutations = 0;
    crossovers = 0;
    competitions = 0;
    fitnesses = 0;
    data.forEach(projection => {
        projection.key = projection.Player + projection.Pos + projection.Team;
        projection.shares = 0;
        projection.confidence = parseFloat(projection.Floor) / parseFloat(projection['FC Proj'])
        // if (projection['Actual Score'] !== '' && parseFloat(projection['Actual Score']) > 0) {
        if (parseFloat(projection['FC Proj']) > 7) {
            if (projection.Pos === 'QB') {
                QBs.push(projection)
            } else if (projection.Pos === 'RB') {
                RBs.push(projection)
            } else if (projection.Pos === 'WR') {
                WRs.push(projection)
            } else if (projection.Pos === 'TE') {
                TEs.push(projection)
            } else if (projection.Pos === 'DST') {
                DSTs.push(projection)
            }
            // }
        }
    });
    callback();
}

buildFirstLineup = (callback) => {
    let firstLineup = [];
    firstLineup.push(QBs[Math.floor(Math.random() * QBs.length)]);
    firstLineup.push(RBs[Math.floor(Math.random() * RBs.length)]);
    firstLineup.push(RBs[Math.floor(Math.random() * RBs.length)]);
    firstLineup.push(WRs[Math.floor(Math.random() * WRs.length)]);
    firstLineup.push(WRs[Math.floor(Math.random() * WRs.length)]);
    firstLineup.push(WRs[Math.floor(Math.random() * WRs.length)]);
    firstLineup.push(TEs[Math.floor(Math.random() * TEs.length)]);
    let flexRandom = Math.floor(Math.random() * 3);
    if (flexRandom === 0) {
        firstLineup.push(RBs[Math.floor(Math.random() * RBs.length)]);
    } else if (flexRandom === 1) {
        firstLineup.push(WRs[Math.floor(Math.random() * WRs.length)]);
    } else if (flexRandom === 2) {
        firstLineup.push(TEs[Math.floor(Math.random() * TEs.length)]);
    }
    firstLineup.push(DSTs[Math.floor(Math.random() * DSTs.length)]);
    callback(firstLineup);
}

mutate = (a) => {
    mutations++;
    let confidenceThreshold = 0;
    let swap = Math.floor(Math.random() * 10);
    let flexRandom = Math.floor(Math.random() * 3);
    if (swap === 0) {
        let QBSwap = QBs[Math.floor(Math.random() * QBs.length)];
        if (QBSwap.confidence > confidenceThreshold) {
            a[swap] = QBSwap;
        }
    } else if (swap > 1 && swap < 3) {
        let RBSwap = RBs[Math.floor(Math.random() * RBs.length)]
        if (RBSwap.confidence > confidenceThreshold) {
            a[swap] = RBSwap;
        }
    } else if (swap > 2 && swap < 6) {
        let WRSwap = WRs[Math.floor(Math.random() * WRs.length)]
        if (WRSwap.confidence > confidenceThreshold) {
            a[swap] = WRSwap;
        }
    } else if (swap === 6) {
        let TESwap = TEs[Math.floor(Math.random() * TEs.length)]
        if (TESwap.confidence > confidenceThreshold) {
            a[swap] = TESwap;
        }
    } else if (swap === 7) {
        if (flexRandom === 0) {
            let RBSwap = RBs[Math.floor(Math.random() * RBs.length)]
            if (RBSwap.confidence > confidenceThreshold) {
                a[swap] = RBSwap;
            }
        } else if (flexRandom === 1) {
            let WRSwap = WRs[Math.floor(Math.random() * WRs.length)]
            if (WRSwap.confidence > confidenceThreshold) {
                a[swap] = WRSwap;
            }
        } else if (flexRandom === 2) {
            let TESwap = TEs[Math.floor(Math.random() * TEs.length)]
            if (TESwap.confidence > confidenceThreshold) {
                a[swap] = TESwap;
            }
        }
    } else if (swap === 8) {
        a[swap] = DSTs[Math.floor(Math.random() * DSTs.length)];

    }
    return a;
}

crossover = (a, b) => {
    crossovers++;

    return a;
}

competition = (a, b) => {
    competitions++;

    return a;
}

fitness = (a) => {
    fitnesses++;
    let score = 0;
    let salary = 0
    let valid = true;
    // let totalConfidence = 0;
    a.forEach(player => {
        let playerOccurrences = a.filter(a => a.key === player.key).length;
        let teamOccurrences = a.filter(a => a.Team === player.Team).length;
        // totalConfidence += player.confidence;
        score += parseFloat(player['FC Proj']);
        salary += parseFloat(player.Salary);
        if (playerOccurrences > 1 || teamOccurrences > 4) {
            valid = false;
        }
    });
    let duplicate = false;
    bestLineups.forEach(lineup => {
        let samePlayers = 0;
        for (let x = 0; x < lineup.length; x++) {
            if (a.findIndex(b => b.key === lineup[x].key) > -1) {
                samePlayers++;
            }
            if (samePlayers === 9) {
                duplicate = true;
            }
        }
    })
    // return salary > 60000 || !valid ? 0 : (score * (totalConfidence / 9));
    return (salary > 60000 || !valid || duplicate) ? 0 : score;

}

getstats = () => {
    return {
        crossovers: crossovers,
        mutations: mutations,
        competitions: competitions,
        fitnesses: fitnesses
    }
}

computeActual = (lineup) => {
    total = 0;
    lineup.forEach(player => {
        if (player['Actual Score'] !== '') {
            total += parseFloat(player['Actual Score']);
        }
    });
    return total;
}

finalStats = (lineup) => {
    let salary = 0
    lineup.forEach(player => {
        salary += parseFloat(player.Salary);
    })
}

diversify = (recentLineup) => {
    recentLineup.forEach(player => {
        let index = usedPlayers.findIndex(a => a.key === player.key);
        if (index > -1) {
            usedPlayers[index].shares++;
            if (usedPlayers[index].shares >= 9) {
                if (player.Pos === 'QB') {
                    let playerIndex = QBs.findIndex(a => a.key === player.key);
                    QBs.splice(playerIndex, 1);
                } else if (player.Pos === 'RB') {
                    let playerIndex = RBs.findIndex(a => a.key === player.key);
                    RBs.splice(playerIndex, 1);
                } else if (player.Pos === 'WR') {
                    let playerIndex = WRs.findIndex(a => a.key === player.key);
                    WRs.splice(playerIndex, 1);
                } else if (player.Pos === 'TE') {
                    let playerIndex = TEs.findIndex(a => a.key === player.key);
                    TEs.splice(playerIndex, 1);
                } else if (player.Pos === 'DST') {
                    let playerIndex = DSTs.findIndex(a => a.key === player.key);
                    DSTs.splice(playerIndex, 1);
                }
            }
        } else {
            usedPlayers.push(player);
        }
    })
}

computeStats = (bestLineups) => {
    let stats = {
        QBAverageProjection: 0,
        RBAverageProjection: 0,
        WRAverageProjection: 0,
        TEAverageProjection: 0,
        FlexAverageProjection: 0,
        DSTAverageProjection: 0,
        QBAverageSalary: 0,
        RBAverageSalary: 0,
        WRAverageSalary: 0,
        TEAverageSalary: 0,
        FlexAverageSalary: 0,
        DSTAverageSalary: 0,
    }
    bestLineups.forEach(lineup => {
        stats.QBAverageProjection += parseFloat(lineup[0]['FC Proj']);
        stats.RBAverageProjection += parseFloat(lineup[1]['FC Proj']);
        stats.RBAverageProjection += parseFloat(lineup[2]['FC Proj']);
        stats.WRAverageProjection += parseFloat(lineup[3]['FC Proj']);
        stats.WRAverageProjection += parseFloat(lineup[4]['FC Proj']);
        stats.WRAverageProjection += parseFloat(lineup[5]['FC Proj']);
        stats.TEAverageProjection += parseFloat(lineup[6]['FC Proj']);
        stats.FlexAverageProjection += parseFloat(lineup[7]['FC Proj']);
        stats.DSTAverageProjection += parseFloat(lineup[8]['FC Proj']);
        stats.QBAverageSalary += parseFloat(lineup[0].Salary);
        stats.RBAverageSalary += parseFloat(lineup[1].Salary);
        stats.RBAverageSalary += parseFloat(lineup[2].Salary);
        stats.WRAverageSalary += parseFloat(lineup[3].Salary);
        stats.WRAverageSalary += parseFloat(lineup[4].Salary);
        stats.WRAverageSalary += parseFloat(lineup[5].Salary);
        stats.TEAverageSalary += parseFloat(lineup[6].Salary);
        stats.FlexAverageSalary += parseFloat(lineup[7].Salary);
        stats.DSTAverageSalary += parseFloat(lineup[8].Salary);
    });

    stats.QBAverageProjection = stats.QBAverageProjection / bestLineups.length;
    stats.RBAverageProjection = stats.RBAverageProjection / (bestLineups.length * 2);
    stats.WRAverageProjection = stats.WRAverageProjection / (bestLineups.length * 3);
    stats.TEAverageProjection = stats.TEAverageProjection / bestLineups.length;;
    stats.FlexAverageProjection = stats.FlexAverageProjection / bestLineups.length;
    stats.DSTAverageProjection = stats.DSTAverageProjection / bestLineups.length;
    stats.QBAverageSalary = stats.QBAverageSalary / bestLineups.length;
    stats.RBAverageSalary = stats.RBAverageSalary / (bestLineups.length * 2);
    stats.WRAverageSalary = stats.WRAverageSalary / (bestLineups.length * 3);
    stats.TEAverageSalary = stats.TEAverageSalary / bestLineups.length;;
    stats.FlexAverageSalary = stats.FlexAverageSalary / bestLineups.length;
    stats.DSTAverageSalary = stats.DSTAverageSalary / bestLineups.length;

    return stats;
}

setBest = (best) => {
    bestLineups.push(best);
}