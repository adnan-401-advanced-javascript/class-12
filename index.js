const mongoose = require("mongoose");

const app = require("./src/app");

require("dotenv").config();

const mongoURL = process.env.MONGOOSE_URL;

mongoose.connect(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

const port = process.env.PORT;
app.start(port);
