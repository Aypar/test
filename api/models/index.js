let mongoose = require('mongoose');

class DatabaseConnection {
    connect(cb) {

        let connection = mongoose.connect('mongodb://localhost/coin-market', {useMongoClient: true});
        mongoose.Promise = global.Promise;
        connection.on('open', () => {
            "use strict";
            require('./order');
            require('./bid');
            require('./member');
            require('./market');
            if (cb && typeof cb === 'function') {
                cb();
            }
        });
    };
}

module.exports = DatabaseConnection;