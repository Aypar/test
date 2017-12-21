let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let MarketSchema = new Schema({

    name: {type: String, required: true},
    is_active: {type: Boolean, default: true},
    created_at: {type: Date, default: new Date()},
    updated_at: {type: Date, default: new Date()}
});


let MarketModel = mongoose.model('Market', MarketSchema);
module.exports = MarketModel;