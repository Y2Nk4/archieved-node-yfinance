import { Ticker } from './models/Ticker'

let tsm = new Ticker('TSM')
// tsm.history('5d').then(() => {})

import { DataFrame } from 'danfojs-node'

(async () => {
  let tsmEarnings = await tsm.earnings
  tsmEarnings.tail().print()
})()
