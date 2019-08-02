const optimizerController = require('../controllers/optimizer');
const nbaOptimizer = require('../controllers/nbaOptimizer');
const nbaFAOptimizer = require('../controllers/nbaFAOptimizer');

module.exports = (app) => {
    app.get('/api', (req, res) => res.status(200).send({
        message: 'Welcome to the Genetic Optimizer API!',
    }));
    app.get('/api/test', optimizerController.test);
    app.get('/api/genNBALineups', nbaOptimizer.genNBALineups);
    app.get('/api/genNBALineups2', nbaFAOptimizer.genNBALineups);

    app.get('/api/getHistoricalData', optimizerController.getHistoricalData);
};