let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let BidSchema = new Schema({

    member: {type: Schema.Types.ObjectId, required: true},
    amount: {type: Number, min: 0},
    rate: {type: Number, required: true},
    actual_rate: {type: Number},
    occurred_date: {type: Date},
    fillers: [{
        ask: [{type: Schema.Types.ObjectId, ref: "Ask"}],
        occurred_date: {type: Date, default: new Date()},
        amount: {
            type: Number,
            default: 0
        }
    }],
    market: {type: Schema.Types.ObjectId},
    created_at: {type: Date, default: new Date()},
    updated_at: {type: Date, default: new Date()},
    is_active: {type: Boolean, default: true}
    //condition: {} TODO think about that

});

BidSchema.statics.fill=function(_id, ask_id, amount)
{
    return;
}

let BidModel = mongoose.model('Bid', BidSchema);
module.exports = BidModel;