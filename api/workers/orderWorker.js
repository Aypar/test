let redis = require('redis');
let mongoose = require('mongoose');
let underscore = require('underscore');
let Rabbit = require('../library/Rabbit');
let OrderTypes = require('../constants/orderTypes');
let AmqpQueues = require('../constants/amqpQueues');

class OrderWorker {
    constructor() {

        this.database = mongoose.models;
        this.mq = new Rabbit('127.0.0.1', '5672', 'guest', 'guest');
    }

    init() {

        this.mq.on('connected', () => {

            console.log('Order worker connected to queue');
            this.onSaveOrder();
        });
        this.mq.connect();
    }

    onSaveOrder() {
        this.mq.listen(AmqpQueues.save_order, true);
        this.mq.on(AmqpQueues.save_order, (message, args) => {

            let order = null;
            order = new this.database.Order(message);
            order.save((err, doc) => {

                if (err) {
                    //TODO handle error logs
                    console.log(err);
                }
                this.mq.send('', AmqpQueues.process_order, {
                    _id: doc._id,
                    type: doc.type
                });
                args.success();
            });

        })
    }

    onCancelOrder(message, args) {

        this.mq.listen(AmqpQueues.cancel_order);
        this.mq.listen(AmqpQueues.cancel_order, true);
    }
}

module.exports = OrderWorker;