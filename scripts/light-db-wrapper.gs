function query(sinceStr, untilStr) {
  const since = new Date(sinceStr)
  const until = new Date(untilStr)

  // By fire be purged.... Taste the flames of Sulfuron!
  if (isNaN(since.getTime()) || isNaN(until.getTime())) {
    return "invalid date (@param " + sinceStr + ", " + untilStr + ')'
  }

  // For some idiotic reason Google's memesters made their API calls non-zero indexed
  const db = '1S3mY4QyrRh3ClZ8L4VfxgaghnU_26cFPRBEn8SnsEdU'
  const app = SpreadsheetApp.openById(db)
  const sheet = app.getSheets()[0]
  const range = sheet.getRange(2, 1, sheet.getLastRow(), 2)  
  const values = range.getValues()

  var date, state
  var dates = []
  var states = []

  for (var i = 0; i < values.length; i++) {
    date  = values[i][0]
    state = values[i][1]

    date  = new Date(date)

    if (date.getTime() > until.getTime()) {
      break
    } else if (date.getTime() >= since.getTime()) {
      dates.push(date)
      states.push(state)
    }
  }

  return { dates: dates, states: states }
}

function doGet(e) {
  var res = {}
  var req = e.parameters
  var json

  // Link was followed without a request
  if (Object.keys(req).length == 0) {
    res.error = true
    res.reason = 'request was empty'
  } else if (req.since === undefined || req.until === undefined) {
    res.error = true
    res.reason = 'invalid request'
  } else {
    const tmp = query(req.since, req.until)

    if (typeof tmp === 'string') {
      res.error = true
      res.reason = tmp
    } else {
      res.error = false
      res.payload = tmp
    }
  }

  json = JSON.stringify(res);

  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}