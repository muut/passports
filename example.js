#!/usr/bin/env node

var express = require("express"),
    Passports = require("passports"),
    Passport = require("passport").Passport,
    BasicStrategy = require("passport-http").BasicStrategy,
    session = require('express-session'),
    cookieParser = require('cookie-parser');

var passports = new Passports();

passports._getConfig = function _getConfig(req, cb) {
  return cb(null, req.hostname, {
    realm: req.hostname,
  });
};

passports._createInstance = function _createInstance(options, cb) {
  var instance = new Passport();

  instance.use("basic", new BasicStrategy(options, function(name, password, done) {
    return done(null, {name: name});
  }));

  instance.serializeUser(function(user, cb) {
    user.realm = options.realm;

    cb(null, JSON.stringify(user));
  });

  instance.deserializeUser(function(id, cb) {
    cb(null, JSON.parse(id));
  });

  cb(null, instance);
};

var app = express();

app.use(express.logger());
app.use(cookieParser());
app.use(session({secret: "keyboard cat"}));
app.use(passports.attach());
app.use(passports.middleware("initialize"));
app.use(passports.middleware("session"));
app.use(app.router);

app.get("/login", passports.middleware("authenticate", "basic", {
  successRedirect: "/",
}));

app.get("/", function(req, res, next) {
  if (!req.user) {
    return res.redirect("/login");
  }

  return res.send("hello, " + JSON.stringify(req.user));
});

app.listen(3000, function() {
  console.log("listening");
});
