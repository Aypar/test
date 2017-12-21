const EventEmitter = require('events').EventEmitter;

class Rabbit extends EventEmitter {

    constructor(server, port, username, password, virtual_host) {
        super();
        this.amqp = require('amqplib/callback_api');

        let url = `amqp://${username}:${password}@${server}:${port}/`;
        if (virtual_host) {
            url += virtual_host;
        }

        this.url = url;
        this.consume_channels = {};
        this.connection = null;
    }

    connect() {
        this.amqp
            .connect(this.url, (error, connection) => {
                if (error) {
                    console.log(error);
                    this.emit('error', {error: error});
                    return;
                }
                this.connection = connection;
                this.connection.on('error', (error) => {
                    this.emit('error', error)
                });
                this.emit('connected');
            });
    }


    listen(queue, create_queue) {

        if (this.consume_channels[queue]) {
            return;
        }
        this.connection.createChannel((error, channel) => {

            if (create_queue) {
                channel.assertQueue(queue, {durable: true});
            }
            channel.prefetch(1);
            channel.consume(queue, (message) => {
                const args = {
                    success: () => {
                        channel.ack(message);
                    },
                    fail: () => {
                        channel.nack(message);
                    }
                };

                let json_message = {};
                try {

                    json_message = JSON.parse(message.content.toString());
                    this.emit(queue, json_message, args);

                } catch (error) {
                    this.emit('error', error)
                }

            }, {noAck: false});

            this.consume_channels[queue] = channel;
        });
    }

    send(exchange, route, message, create_queue) {
        this.connection.createChannel((error, channel) => {
            if (create_queue) {
                channel.assertQueue(route, {durable: true});
            }
            try {

                const content = new Buffer(JSON.stringify(message));
                channel.publish(exchange, route, content);
                channel.close();
            }
            catch (error) {
                this.emit('error', error)
            }
        });
    }

    getQueue(queue_name) {

        return new Promise((resolve, reject) => {

            this.connection.createChannel((error, channel) => {
                channel.on('error', (error) => {
                    reject(error);
                });
                channel.checkQueue(queue_name, function (error, result) {
                    if (error) {

                        reject(error);
                        return;
                    }
                    channel.close();
                    resolve(result);

                });
            });
        });
    }

    close() {

        for (const channel of this.consume_channels) {
            channel.close();
            delete this.consume_channels[channel];
        }
        this.connection.close();

        this.emit('disconnected');
    }
}

module.exports = Rabbit;