import { Ticker } from '../../src/models/Ticker'
import { InvalidParameterError } from '../../src/exceptions/InvalidParameterError'

test('fundamental', async () => {
  let ticker = new Ticker('TSM')
  console.log('sd', ticker.financials)
  console.log('type', typeof ticker)
})
