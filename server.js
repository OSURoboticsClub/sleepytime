'use strict';

const Sleepytime = require('./lib/sleepytime');

const SERVER_ADDR = '127.0.0.1';
const SERVER_PORT = 1990;

const worker_one = new Sleepytime(SERVER_ADDR, SERVER_PORT, 0).route().run();
const worker_two = new Sleepytime(SERVER_ADDR, SERVER_PORT, 1).route().run();
