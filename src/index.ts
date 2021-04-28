import { Ticker } from './models/Ticker'

let tsm = new Ticker('TSM')
tsm.history('5d').then(() => {

})
