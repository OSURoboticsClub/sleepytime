'use strict'

const fs            = require('fs')
const EventEmitter  = require('events')
const express       = require('express')
const net           = require('net')
const app           = express()
const router        = express.Router()
const request       = require('request')

const SETTINGS_FILE = './settings.json'
const DATABASE_URL  = 'https://script.google.com/macros/s/AKfycbwh53E9u-ADQyE996zc0x6PlmLvnEmssMSO7pAGpqCPhPbI0Fk/exec'

/**
 * @Sleepytime - Simple implementation of a REST server in NodeJS. Should be
 * used in conjunction with the load balancing functionality provided by NGINX.
 *
 * @param ip   - Server IP address
 * @param port - Server port
 * @param offs - Worker ID
 *
 * @extends EventEmitter
 */
class Sleepytime extends EventEmitter {
  constructor(ip = '127.0.0.1', port = 1990, offs = 0) {
    super()

    this.ip       = ip
    this.port     = port + offs
    this.offs     = offs
    this.app      = express()
    this.router   = express.Router()

    this.loadSettings(SETTINGS_FILE)
  }

  loadSettings(file) {
    file = file || SETTINGS_FILE

    fs.readFile(file, (err, data) => {
      if (err) {
        throw err
      }

      this.settings = JSON.parse(data)
    })
  }

  /**
   * @route - Builds the express router used to parse requests 
   *
   * @returns self-reference
   */
  route() {
    this.router.use((req, res, next) => {
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress

      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept")
      res.header('Content-Type', 'application/json')

      this.log(`Received ${req.path} from ${ip}`)

      next()
    })

    this.router.get('/', (req, res) => {
      const {codes} = this.http
      var code = codes.OK
      var json = JSON.stringify(this.settings, null, 2)

      res.status(code).send(json)
    })

    this.router.route('/places/:place/:node/since/:since').get((req, res, next) => {
      req.url += `/until/${this.date}`
      next()
    })

    this.router.route('/places/:place/:node/since/:since/until/:until').get((req, res) => {
      const {places} = this.settings
      const {codes} = this.http
      const {params} = req
      const place = params['place']
      const node  = params['node']
      const since = params['since']
      const until = params['until']

      var code = codes.OK
      var json

      if (places[place] === undefined) {
        code = codes.EINVAL
        json = { error: true, reason: `${place} is not a valid place` }

        res.status(code).send(json)
      } else if (places[place]['nodes'][node] === undefined) {
        code = codes.EINVAL
        json = { error: true, reason: `${node} is not a valid node` }

        res.status(code).send(json)
      } else {
        this.fetch(node, since, until, (err, body) => {
          if (err) {
            json = { error: true, reason: err }
          } else {
            json = body
          }

          res.status(code).send(json)
        })
      }
    })

    return this
  }

  fetch(node, since, until, callback) {
    var ret

    var query = `?since=${since}&until=${until}`
    var url   = `${DATABASE_URL}${query}`
    
    request(url, (err, res, body) => {
      callback(err, body)
    })
  }

  /**
   * @run - Starts the server
   * 
   * @return self-reference
   */
  run() {
    this.app.use('/', this.router)
    this.app.listen(this.port, () => {
      this.log("Started sleepytime on %s:%d", this.ip, this.port)
    })

    return this
  }

  /**
   * @log - Logs a message along with the worker id and a timestamp
   *
   * @param format  - Message format
   * @param ...args - message args
   *
   * @see - ES6 extended parameter handling
   */
  log(format, ...args) {
    var header = `[${this.offs}][${this.date}] `
    process.stdout.write(header)
    console.log(format, ...args)
  }

  /**
   * @settings - Server settings
   */
  get http() {
    return {
      codes: {
        OK:     200,
        EINVAL: 400,
        EIMPL:  501
      }
    }
  }

  get date() {
    const now = new Date()

    const YY  = now.getFullYear()
    var MM    = now.getMonth() + 1
    var DD    = now.getDate()
    var hh    = now.getHours()
    var mm    = now.getMinutes()
    var ss    = now.getSeconds()
    var ms    = now.getMilliseconds()

    MM = (MM >  9) ? MM : ('0' + MM)
    DD = (DD >  9) ? DD : ('0' + DD)
    hh = (hh >  9) ? hh : ('0' + hh)
    mm = (mm >  9) ? mm : ('0' + mm)
    ss = (ss >  9) ? ss : ('0' + ss)

    if      (ms < 10) ms = '00' + ms
    else if (ms < 100) ms = '0' + ms

    return `${YY}-${MM}-${DD}T${hh}:${mm}:${ss}.${ms}Z`
  }

  dateToMS(dateStr) {
    dateStr.replace(/-/g,"/")
    const ms = new Date(dateStr).getTime()

    return ms
  }
}

module.exports = Sleepytime
