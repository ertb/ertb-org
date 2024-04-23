const cronTime = require('./crontime')
const { every, daily, weekly, monthly } = cronTime

describe('crontTime', () => {
  it('should default to every minute', () => {
    expect(cronTime().toString()).toBe('* * * * *')
  })
  it('should render as every minute', () => {
    expect(cronTime().every().minute()).toBe('* * * * *')
    expect(every().minute()).toBe('* * * * *')
  })
  it('should render as every nth minute', () => {
    expect(cronTime().every(5).minutes()).toBe('*/5 * * * *')
    expect(every(5).minutes()).toBe('*/5 * * * *')
  })
  it('should render as every hour', () => {
    expect(cronTime().every().hour()).toBe('0 * * * *')
  })
  it('should render as every nth hour', () => {
    expect(cronTime().every(8).hours()).toBe('0 */8 * * *')
  })
  it('should render as daily', () => {
    expect(cronTime().every().day().at('2:00')).toBe('0 2 * * *')
    expect(cronTime().daily().at('2:00')).toBe('0 2 * * *')
    expect(daily().at('2:00')).toBe('0 2 * * *')
  })
  it('should render as every nth day', () => {
    expect(cronTime().every(2).days().at('2:00')).toBe('0 2 */2 * *')
  })
  it('should render as weekly', () => {
    expect(cronTime().weekly().at('2:00')).toBe('0 2 * * 0')
    expect(weekly().at('2:00')).toBe('0 2 * * 0')
    expect(cronTime().onDays(0).at('2:00')).toBe('0 2 * * 0')
    expect(cronTime().onDays(2,4).at('2:00')).toBe('0 2 * * 2,4')
    expect(cronTime().tue().at('2:00')).toBe('0 2 * * 2')
    expect(cronTime().thu().at('2:00')).toBe('0 2 * * 4')
    expect(cronTime().onWeekdays().at('2:00')).toBe('0 2 * * 1-5')
    expect(cronTime().onWeekend().at('2:00')).toBe('0 2 * * 0,6')
  })
  it('should render as monthly', () => {
    expect(cronTime().every().month().at('2:00')).toBe('0 2 1 * *')
    expect(cronTime().monthly().at('2:00')).toBe('0 2 1 * *')
    expect(monthly().at('2:00')).toBe('0 2 1 * *')
  })
  it('should render as annually', () => {
    expect(cronTime().feb().at('2:00')).toBe('0 2 1 2 *')
    expect(cronTime().dec(25).at('2:00')).toBe('0 2 25 12 *')
    expect(cronTime().onMonths(2,10).at('2:00')).toBe('0 2 1 2,10 *')
  })
  it('should render as every nth month', () => {
    expect(cronTime().every(6).month().at('2:00')).toBe('0 2 1 */6 *')
  })
  it('should render as monthly on the nth day', () => {
    expect(cronTime().monthly().on(1,15).at('2:00')).toBe('0 2 1,15 * *')
  })
})
