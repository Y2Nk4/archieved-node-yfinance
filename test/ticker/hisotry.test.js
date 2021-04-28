import { Ticker } from '../../src/models/Ticker'
import { InvalidParameterError } from '../../src/exceptions/InvalidParameterError'

test('test_ticker_history', async () => {
  let ticker = new Ticker('TSM')
  try {
    ticker.history('5d', '15m')
  } catch (e) {
    console.log(e)
  }
})

test('incorrect_parameter', async () => {
  let ticker = new Ticker('TSM')
  try {
    ticker.history('10m')
  } catch (e) {
    expect(e instanceof InvalidParameterError).toBeTruthy()
  }
  try {
    ticker.history('1d', '300m')
  } catch (e) {
    expect(e instanceof InvalidParameterError).toBeTruthy()
  }
})
