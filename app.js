'use strict';

const mysql = require(`mysql`);
const { initApp } = require(`./lib/appFunctions`);
const { initPrompts } = require(`./lib/prompts`);

const connection = mysql.createConnection({
  host: `localhost`,
  port: 3306,
  user: `root`,
  password: `testing123`,
  database: `employees_db`
});

connection.connect(err => {
  if (err) { throw err; }
  initPrompts();
  initApp();
});

exports.connection = connection;
