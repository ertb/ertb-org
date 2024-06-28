/**
 * Human readable cron patterns
 *
 * @example
 * import {every, daily, weekly, monthly} from 'cronTime'
 *
 * every().minute()
 * every(20).minutes()
 * every().hour()
 * every(8).hours()
 * every().fri().at('16:00')
 * every().sep(21).at('7:30')
 * daily().at('23:59')
 * weekly().onWeekdays().at('1:00')
 * weekly().onDays(1,3,5).at('2:00')
 * monthly().onDates(1,15).at('3:00')
 */
const cronTime = () => { return new CronTime() }
/** @param {number|undefined} n */
cronTime.every = n => cronTime().every(n)
cronTime.daily = () => cronTime().daily()
cronTime.weekly = () => cronTime().weekly()
cronTime.monthly = () => cronTime().monthly()
module.exports = cronTime

class CronTime {
  constructor() {
    this.parts = "* * * * *".split(" ")
  }

  /** @param {number|undefined} n */
  every(n) {
    n = Math.max(Math.trunc(n), 0)
    if (!isNaN(n) || n > 1) this.lastN = n
    return this
  }
  minute() {
    this.parts[0] = this.lastN == undefined ? "*" : "*/" + this.lastN.toString()
    this.lastN = undefined
    return this.toString()
  }
  hour() {
    if (this.parts[0] == "*") this.parts[0] = "0"
    this.parts[1] = this.lastN == undefined ? "*" : "*/" + this.lastN.toString()
    return this.toString()
  }
  day() {
    if (this.parts[0] == "*") this.parts[0] = "0"
    if (this.parts[1] == "*") this.parts[1] = "0"
    this.parts[2] = this.lastN == undefined ? "*" : "*/" + this.lastN.toString()
    return this
  }
  /** @param  {number[]|[(string|number)]} weekDays */
  week(...weekDays) {
    if (this.parts[0] == "*") this.parts[0] = "0"
    if (this.parts[1] == "*") this.parts[1] = "0"
    if (this.parts[4] == "*") this.parts[4] = "0"
    updatePart(this, 4, ...weekDays)
    return this
  }
  /** @param  {number[]|[(string|number)]} weekDays */
  month(...months) {
    if (this.parts[2] == "*") this.parts[2] = "1"
    this.parts[3] = this.lastN == undefined ? "*" : "*/" + this.lastN.toString()
    updatePart(this, 3, ...months)
    return this
  }
  /** @param  {number[]|[(string|number)]} weekDays */
  on(...dates) {
    this.lastN = undefined
    updatePart(this, 2, ...dates) // days of month
    return this
  }
  /** @param {string|number} hhmm */
  at(hhmm) {
    this.lastN = undefined
    updateHHMM(this, hhmm)
    return this.toString()
  }
  toString() { return this.parts.join(" ") }

  // aliases and shortcuts
  minutes() { return this.minute() }
  hours() { return this.hour() }
  days() { return this.day() }
  daily() {
    this.lastN = undefined
    return this.day()
  }
  /** @param  {number[]|[(string|number)]} weekDays */
  onDays(...weekDays) {
    this.lastN = undefined
    return this.week(...weekDays)
  }
  /** @param  {number[]|[(string|number)]} dates */
  onDates(...dates) {
    this.lastN = undefined
    return this.on(...dates)
  }
  onWeekdays() {
    this.lastN = undefined
    return this.onDays("1-5")
  }
  onWeekend() {
    this.lastN = undefined
    return this.onDays("0,6")
  }
  /** @param  {number[]|[(string|number)]} weekDays */
  weekly(...weekDays) {
    if (!weekDays.length) weekDays = [0]
    this.lastN = undefined
    return this.onDays(...weekDays)
  }
  /** @param  {number[]|[(string|number)]} months */
  months(...months) { return this.month(...months) }
  /** @param  {number[]|[(string|number)]} months */
  monthly(...months) {
    this.lastN = undefined
    return this.month(...months)
  }
  /** @param  {number[]|[(string|number)]} months */
  onMonths(...months) {
    this.lastN = undefined
    return this.month(...months)
  }

  sun() { return this.onDays(0) }
  mon() { return this.onDays(1) }
  tue() { return this.onDays(2) }
  wed() { return this.onDays(3) }
  thu() { return this.onDays(4) }
  fri() { return this.onDays(5) }
  sat() { return this.onDays(6) }

  /** @param  {number} d day of month */
  jan(d = 1) { return this.onMonths(1).on(d) }
  /** @param  {number} d day of month */
  feb(d = 1) { return this.onMonths(2).on(d) }
  /** @param  {number} d day of month */
  mar(d = 1) { return this.onMonths(3).on(d) }
  /** @param  {number} d day of month */
  apr(d = 1) { return this.onMonths(4).on(d) }
  /** @param  {number} d day of month */
  may(d = 1) { return this.onMonths(5).on(d) }
  /** @param  {number} d day of month */
  jun(d = 1) { return this.onMonths(6).on(d) }
  /** @param  {number} d day of month */
  jul(d = 1) { return this.onMonths(7).on(d) }
  /** @param  {number} d day of month */
  aug(d = 1) { return this.onMonths(8).on(d) }
  /** @param  {number} d day of month */
  sep(d = 1) { return this.onMonths(9).on(d) }
  /** @param  {number} d day of month */
  oct(d = 1) { return this.onMonths(10).on(d) }
  /** @param  {number} d day of month */
  nov(d = 1) { return this.onMonths(11).on(d) }
  /** @param  {number} d day of month */
  dec(d = 1) { return this.onMonths(12).on(d) }
}

function updatePart(ct, index, ...args) {
  ct.lastN = undefined
  const max = [59, 23, 31, 12, 7][index]

  if (typeof args[0] == "string") {
    if (args[0].indexOf("-") > -1 || args[0].indexOf(",") > -1) {
      ct.parts[index] = args[0]
      return ct
    }
    const n = Number.parseInt(args[0])
    args = [isNaN(n) ? 0 : n]
  }
  if (args.length && typeof args[0] == "number" && !isNaN(args[0])) {
    const set = args.reduce((set, v) => {
      set.add(Math.max(Math.min(Math.trunc(v), max), 0))
      return set
    }, new Set())
    const byValue = (a, b) => (a > b ? 1 : a < b ? -1 : 0)
    const list = [...set].sort(byValue)
    ct.parts[index] = list.join(",")
  }
  return ct
}

function updateHHMM(ct, hhmm) {
  let hh = 0,
    mm = 0

  // parse '03:00' or '0300'
  if (typeof hhmm == "string") {
    if (hhmm.indexOf(":")) {
      const s = hhmm.split(":")
      hh = Math.max(Math.min(Number.parseInt(s[0]), 23), 0)
      mm = Math.max(Math.min(Number.parseInt(s[1]), 59), 0)
      hhmm = hh * 100 + mm
    } else {
      hhmm = Math.max(Number.parseInt(hhmm), 0)
    }
  }

  hh = Math.max(Math.trunc(hhmm), 0)
  if (hh > 100) {
    mm = Math.min(hh % 100, 59)
    hh = Math.min(hh / 100, 23)
  }
  ct.parts[0] = isNaN(mm) ? "0" : `${mm}`
  ct.parts[1] = "0"
  if (!isNaN(hh)) ct.parts[1] = `${hh}`
}

