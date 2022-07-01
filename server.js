const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
const compression = require("compression");
const { PORT, MONGODB_URI } = require("./config");

const app = express();

app.use(logger("dev"));

app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useFindAndModify: false,
  autoCreate: true,
  user: "admin",
  pass: "tmp12345",
  dbName: "budget",
  useUnifiedTopology: true,
});

// routes
app.use(require("./routes/api.js"));

// database connection
mongoose.connection
  .on("error", (e) => {
    console.log(e);
  })
  .once("open", () => {
    app.listen(PORT, () => {
      console.log(`App running on port ${PORT}!`);
    });
  });
