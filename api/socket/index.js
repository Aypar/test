let socket = require('socket.io');
let redis = require('redis');
let Rabbit = require('../library/Rabbit');
let AmqpQueues = require('../constants/amqpQueues');
let OrderTypes = require('../constants/orderTypes');
let RedisKeys = require('../constants/redisKeys');

class SocketServer {

    constructor(httpServer) {

        this.httpServer = httpServer;
        this.mq = new Rabbit('127.0.0.1', '5672', 'guest', 'guest');
        this.mq.connect();
        this.redis = redis.createClient();
    }


    init() {
        this.mq.on('connected', () => {
            this.io = socket().attach(this.httpServer);
            this.io.on('connection', (socket) => {
                this.sendExchangeState(socket);
                socket.on('ask', this.onAsk.bind(this));
                socket.on('bid', this.onBid.bind(this));
                socket.on('cancel', this.onCancel.bind(this));
            });


            this.handleUpdateExchangeState();
            //this.publishMarketAsk(message,args);
            //this.publishMarketAsk(message,args);
            //this.publishMarketAsk(message,args);


        });


    }


    onAsk(message) {
        message.type = OrderTypes.ask;
        this.mq.send('', AmqpQueues.save_order, message, true);
    }

    onBid(message) {
        message.type = OrderTypes.bid;
        this.mq.send('', AmqpQueues.save_order, message, true);
    }

    onCancel(message) {
        this.mq.send('', AmqpQueues.cancel_order, message, true);
    }

    handleUpdateExchangeState() {
        this.mq.listen(AmqpQueues.update_exchange, true);
        this.mq.on(AmqpQueues.update_exchange, (message, args) => {
            console.log('upadate exchange',message);
            this.io.emit(AmqpQueues.update_exchange, message)
            args.success();
        });

    }


    sendExchangeState(socket) {

        this.getAndMapAsksToRate((asks) => {

            this.getAndMapBidsToRate((bids) => {
                let message = {
                    bids: bids,
                    asks: asks,
                };
                socket.emit('exchange_state', message)
            })

        })
    }

    getAndMapBidsToRate(cb) {


        this.redis.zrange('bid:5a39277a5e2afeb4401e1be6', 0, -1, (err,results) => {

            cb(this.orderToRateMapper(results))
        })
    }

    getAndMapAsksToRate(cb) {
        this.redis.zrange('ask:5a39277a5e2afeb4401e1be6', 0, -1, (err,results) => {

            cb(this.orderToRateMapper(results));
        })
    }

    orderToRateMapper(orders) {
        let mapped_orders = {};
        if(!orders)
            return mapped_orders;


        orders.forEach((order) => {

            let parts = order.split(':');
            let _id = parts[0];
            let amount = parts[1];
            let rate = parts[2];
            mapped_orders[rate] = mapped_orders[rate] || [];
            mapped_orders[rate].push(
                {
                    amount: amount,
                    rate: rate
                }
            )

        });

        return mapped_orders;

    }

}

module.exports = SocketServer;