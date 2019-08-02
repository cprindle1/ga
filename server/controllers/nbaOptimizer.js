const GeneticAlgorithmConstructor = require('geneticalgorithm');
const csv = require('csvtojson')

module.exports = {
    genNBALineups(req, res) {
        const csvFilePath = './fanduelData/test.csv'
        csv()
            .fromFile(csvFilePath)
            .then((data) => {

                splitIntoPositionArrays(data, () => {
                    var best = [];
                    let weeklyLineups = [];
                    let weeklyNamesLineups = [];
                    let weeklyLineupProjections = [];
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
                                    let nameOnly = best;
                                    weeklyNamesLineups.push(nameOnly.map(a => a.PLAYER));
                                    // weeklyLineups.push(best);
                                    weeklyLineupProjections.push(score);
                                    setBest(best);
                                    diversify(best);
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
                        weeklyNamesLineups: weeklyNamesLineups,
                        // weeklyLineups: weeklyLineups,
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
let SGs = [];
let SFs = [];
let Cs = [];
let PFs = [];
let PGs = [];
let mutations = 0;
let crossovers = 0;
let competitions = 0;
let fitnesses = 0;
let usedPlayers = [];
let bestLineups = [];

splitIntoPositionArrays = (data, callback) => {
    SGs = [];
    SFs = [];
    Cs = [];
    PFs = [];
    PGs = [];
    usedPlayers = [];
    bestLineups = [];
    mutations = 0;
    crossovers = 0;
    competitions = 0;
    fitnesses = 0;
    data.forEach(projection => {
        projection.key = projection.PLAYER;
        projection.shares = 0;
        projection.position = projection['POS RANK'].substring(0, 2).trim();
        if (parseFloat(projection.PROJ) > 13) {
            if (projection.position === 'PG') {
                PGs.push(projection)
            } else if (projection.position === 'SG') {
                SGs.push(projection)
            } else if (projection.position === 'SF') {
                SFs.push(projection)
            } else if (projection.position === 'PF') {
                PFs.push(projection)
            } else if (projection.position === 'C') {
                Cs.push(projection)
            }
        }
    });
    callback();
}

buildFirstLineup = (callback) => {
    let firstLineup = [];
    firstLineup.push(PGs[Math.floor(Math.random() * PGs.length)]);
    firstLineup.push(PGs[Math.floor(Math.random() * PGs.length)]);
    firstLineup.push(SGs[Math.floor(Math.random() * SGs.length)]);
    firstLineup.push(SGs[Math.floor(Math.random() * SGs.length)]);
    firstLineup.push(SFs[Math.floor(Math.random() * SFs.length)]);
    firstLineup.push(SFs[Math.floor(Math.random() * SFs.length)]);
    firstLineup.push(PFs[Math.floor(Math.random() * PFs.length)]);
    firstLineup.push(PFs[Math.floor(Math.random() * PFs.length)]);
    firstLineup.push(Cs[Math.floor(Math.random() * Cs.length)]);
    callback(firstLineup);
}

mutate = (a) => {
    mutations++;
    let swap = Math.floor(Math.random() * 10);
    if (swap > -1 && swap < 2) {
        a[swap] = PGs[Math.floor(Math.random() * PGs.length)]
    } else if (swap > 1 && swap < 4) {
        a[swap] = SGs[Math.floor(Math.random() * SGs.length)]
    } else if (swap > 3 && swap < 6) {
        a[swap] = SFs[Math.floor(Math.random() * SFs.length)]
    } else if (swap > 5 && swap < 8) {
        a[swap] = PFs[Math.floor(Math.random() * PFs.length)];
    } else if (swap = 8) {
        a[swap] = Cs[Math.floor(Math.random() * Cs.length)];
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
        // let teamOccurrences = a.filter(a => a.Team === player.Team).length;
        // totalConfidence += player.confidence;
        score += parseFloat(player.PROJ);
        salary += parseFloat(player.SALARY);
        if (playerOccurrences > 1) {
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
                if (player.position === 'PG') {
                    let playerIndex = PGs.findIndex(a => a.key === player.key);
                    PGs.splice(playerIndex, 1);
                } else if (player.position === 'SG') {
                    let playerIndex = SGs.findIndex(a => a.key === player.key);
                    SGs.splice(playerIndex, 1);
                } else if (player.position === 'SF') {
                    let playerIndex = SFs.findIndex(a => a.key === player.key);
                    SFs.splice(playerIndex, 1);
                } else if (player.position === 'PF') {
                    let playerIndex = PFs.findIndex(a => a.key === player.key);
                    PFs.splice(playerIndex, 1);
                } else if (player.position === 'C') {
                    let playerIndex = Cs.findIndex(a => a.key === player.key);
                    Cs.splice(playerIndex, 1);
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