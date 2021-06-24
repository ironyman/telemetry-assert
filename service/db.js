//Import the mongoose module
var mongoose = require('mongoose');

//Set up default mongoose connection
var mongoDB = process.env.MONGODB;

mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose
//Define a schema
var Schema = mongoose.Schema;

var PingModelSchema = new Schema({
  count: Number,
});
var PingModel = mongoose.model('Ping', PingModelSchema);

var UserModelSchema = new Schema({
  installationId: String,
  accessToken: String, // don't need this actually.
});
var UserModel = mongoose.model('User', UserModelSchema);

var AssertionModelSchema = new Schema({
  id: String,
  // file: String,
  // stackTrace: [String],
  count: Number,
  // issueUrl: String,
  issueNumber: Number,
  // message: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});
var AssertionModel = mongoose.model('Assertion', AssertionModelSchema);

async function test() {
  var awesome_instance = new UserModel({ installationId: 'awesome' });
  console.log(awesome_instance);

  let err = await awesome_instance.save();
  console.log(err);
  let res = await UserModel.findOne({ installationId: 'awesome' });
  console.log(res);

  var awesome_instance2 = new AssertionModel({
    id: "111",
    file: __filename,
    stackTrace: new Error().stack.split("\n"),
    user: awesome_instance._id,
  });
  await awesome_instance2.save();


  let filledOut = await AssertionModel
    .findOne({ id: "111" })
    .populate('user')
    .exec();

  console.log(filledOut);
  process.exit(0);
}

module.exports = {
  PingModel,
  AssertionModel,
  UserModel,
};