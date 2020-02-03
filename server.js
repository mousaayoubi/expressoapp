const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;
const apiRouter = require('./api/api');
const proxy = require('http-proxy-middleware');

const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const errorhandler = require('errorhandler');

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));

app.use("/api", apiRouter);

app.use(errorhandler());

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

module.exports = app;