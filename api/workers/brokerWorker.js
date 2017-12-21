let redis = require('redis');
let mongoose = require('mongoose');
let underscore = require('underscore');
let async = require('async');
let Rabbit = require('../library/Rabbit');
let OrderTypes = require('../constants/orderTypes');
let AmqpQueues = require('../constants/amqpQueues');
let RedisKeys = require('../constants/redisKeys');

class BrokerWorker {
    constructor() {
        this.queue = AmqpQueues.process_order; // queue should be market specific
        this.mq = new Rabbit('127.0.0.1', '5672', 'guest', 'guest');
        this.redis_client = redis.createClient();
        this.database = mongoose.models;
    }

    init() {
        this.mq.on('connected', () => {

            this.mq.listen(this.queue, true);
            this.mq.on(this.queue, (message, args) => {
                this.onOrder(message, args);
            });

        });

        this.mq.connect();

    }

    onOrder(message, args) {
        if (!message._id) {
            //TODO: error_log
            args.success();
            return;
        }
        let update_exchange_message = {bid: {}, ask: {}, fills: []};
        let filler_redis_key = null;
        let redis_key = null;
        if (message.type === OrderTypes.ask) {
            filler_redis_key = RedisKeys.bid;
            redis_key = RedisKeys.ask;
        }
        if (message.type === OrderTypes.bid) {
            filler_redis_key = RedisKeys.ask;
            redis_key = RedisKeys.bid;
        }
        this.database.Order.findById(message._id, (error, order) => {
            if (error) {
                //TODO: error_log
                args.success();
                return;
            }
            this.redis_client.zrevrangebyscore([`${filler_redis_key}:${order.market}`, order.rate, 0], (error, fillers) => {
                let total_filling = 0;
                underscore.every(fillers, (filler,) => {
                    filler = {
                        _id: filler.split(':')[0],
                        amount: Number(filler.split(':')[1]),
                        rate: Number(filler.split(':')[2])
                    };
                    let required_filling = order.amount - total_filling;
                    if (required_filling === 0) {
                        return false
                    }
                    let fill_amount = 0;
                    if (required_filling >= filler.amount) {
                        fill_amount = filler.amount;
                    }
                    if (required_filling <= filler.amount) {
                        fill_amount = required_filling;
                    }
                    this.database.Order.update({_id: filler._id}, {
                        $push: {
                            fillers: {
                                order: order._id,
                                amount: fill_amount,
                                occurred_date: new Date()
                            },
                        },
                        is_closed: fill_amount === filler.amount,
                        is_active: fill_amount !== filler.amount,
                        closed_at: fill_amount === filler.amount ? new Date() : null
                    }, (error, result) => {
                        //TODO handle error ,result logs
                        //console.log(error)
                    });

                    this.redis_client.zrem(`${filler_redis_key}:${order.market}`, `${filler._id}:${filler.amount}:${filler.rate}`);

                    if (fill_amount < filler.amount) {
                        this.redis_client.zadd(`${filler_redis_key}:${order.market}`, filler.rate, `${filler._id}:${filler.amount - fill_amount}:${filler.rate}`);
                    } else if (fill_amount === filler.amount) {
                        this.database.Order.update({_id: filler._id}, {
                            $set: {
                                is_closed: true,
                                closed_at: new Date()
                            }
                        }, (error, result) => {
                            //TODO handle error ,result logs
                            //console.log(error)
                        })
                    }
                    update_exchange_message.fills.push({
                        amount: fill_amount,
                        rate: filler.rate,
                        timestamp: new Date(),
                        type: order.type
                    });

                    order.fillers.push({
                        order: filler._id,
                        amount: fill_amount,
                        occurred_date: new Date()
                    });

                    total_filling += fill_amount;
                    return true;
                });

                this.redis_client.zrem(`${redis_key}:${order.market}`, `${order._id}:${order.amount}:${order.rate}`, (result) => {
                    if (total_filling < order.amount) {
                        this.redis_client.zadd(`${redis_key}:${order.market}`, order.rate, `${order._id}:${order.amount - total_filling}:${order.rate}`);
                    } else if (total_filling === order.amount) {
                        order.is_closed = true;
                        order.is_active = false;
                        order.closed_at = new Date();
                    }
                    order.save(() => {
                        if (order.type === OrderTypes.bid) {

                            update_exchange_message.bid = {
                                type: OrderTypes.bid,
                                rate: order.rate,
                                amount: order.amount
                            }
                        }
                        if (order.type === OrderTypes.ask) {
                            update_exchange_message.ask = {
                                type: OrderTypes.ask,
                                rate: order.rate,
                                amount: order.amount
                            }
                        }
                        this.mq.send('',AmqpQueues.update_exchange,update_exchange_message,true);
                        args.success();
                    });
                });

            })
        });


        //TODO log unknown order type


    }

}

module.exports = BrokerWorker;