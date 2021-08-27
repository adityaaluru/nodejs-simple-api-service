const express = require("express");
const config = require("config");
const cors = require("cors");
//Load express routers
const apiRouter = require("./routers/api");


let PORT = 3000;

//Read and apply listener port configuration, if available
if(config.has("config.listenerPort")){
PORT = config.get("config.listenerPort");
}


//utilify this debug as a framework -
//get a common logger with info, error, warn methods and automatically add the filename of the JS file
const debug = require("debug");
debug.enable("*");
const info = debug("info").extend("index");
const error = debug("error").extend("index");
const warn = debug("warn").extend("index");

//Configure Express and its JSON middleware
const app = express();
app.use(express.json()); //required middleware for POST calls
app.use(cors());

//Change this later for an extensive access logging - that includes headers, payload as necessary
if (
  config.has("config.enableAccessLogs") &&
  config.get("config.enableAccessLogs")
) {
  const morgan = require("morgan");
  app.use(morgan("common"));
  info("Enabled access logs...");
}

//Configure default route
app.get("/", function (request, response) {
  response.redirect("/index.html");
});

//Configure various route handles
app.use("/api", apiRouter);

//Start the app
app.listen(PORT, function () {
  console.log("Server listening on port " + PORT);
});
