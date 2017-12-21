let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let OrderSchema = new Schema({

    member: {type: Schema.Types.ObjectId, required: true},
    amount: {type: Number, min: 0},
    rate: {type: Number, required: true},
    actual_rate: {type: Number},
    fillers: [{
        order: {type: Schema.Types.ObjectId, ref: "Order"},
        occurred_date: {type: Date, default: new Date()},
        amount: {
            type: Number,
            default: 0
        }
    }],
    type: {type: String, enum: ['ask', 'bid'], required: true},
    market: {type: Schema.Types.ObjectId},
    created_at: {type: Date, default: new Date()},
    updated_at: {type: Date, default: new Date()},
    closed_at: {type: Date},
    is_closed: {type: Boolean, default: false},
    is_active: {type: Boolean, default: true}

});

let OrderModel = mongoose.model('Order', OrderSchema);
module.exports = OrderModel;