let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let MemberSchema = new Schema({

    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    name: {type: String, required: true}

});


let MemberModel = mongoose.model('Member', MemberSchema);
module.exports = MemberModel;