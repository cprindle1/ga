const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(express.static('public'));

app.use('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(cors());

require('./server/routes')(app);
app.get('*', (req, res) => res.status(404).send({
    status: false,
    message: "No matching route!"
}));

app.set('port', (process.env.PORT || 8080));

app.listen(app.get('port'), () => {
    console.log('The server is running at localhost:', app.get('port'));
});