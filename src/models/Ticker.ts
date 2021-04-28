import * as api from '../api/url'
import { InvalidParameterError } from '../exceptions/InvalidParameterError'
import { RequestError } from '../exceptions/RequestError'
import { SessionManager } from './SessionManager'

const stringTemplate = require('string-template')

export class Ticker {
  public symbol: string;
  public proxy: any;
  private sessionManager: SessionManager;

  constructor(symbol: string, proxy: string | any = null) {
    this.symbol = symbol
    this.proxy = proxy
    this.sessionManager = new SessionManager(proxy)
  }

  /**
   * get historical data of a stock
   *
   * @param {string=} period -
   *    Valid periods: 1d,5d,1mo,3mo,6mo,1y,2y,5y,10y,ytd,max
   *    Either Use period parameter or use start and end
   * @param {string=} interval -
   *    Valid intervals: 1m,2m,5m,15m,30m,60m,90m,1h,1d,5d,1wk,1mo,3mo
   *    Intraday data cannot extend last 60 days
   * @param {string|Date=} start -
   *    Download start date string (YYYY-MM-DD) or Date.
   *    Default is 1900-01-01
   * @param {string=} end -
   *    Download end date string (YYYY-MM-DD) or Date.
   *    Default is now
   * @param {boolean=false} prepost -
   *    Include Pre and Post market data in results?
   *    Default is False
   * @param {boolean=true} actions -
   * @param {boolean=true} auto_adjust -
   *    Adjust all OHLC automatically? Default is True
   * @param {boolean=false} back_adjust -
   *    Back-adjusted data to mimic true historical prices
   * @param {boolean=false} rounding -
   *    Round values to 2 decimal places?
   *    Optional. Default is False = precision suggested by Yahoo!
   * @param {string=}tz -
   *    Optional timezone locale for dates.
   *    (default data is returned as non-localized dates)
   * */
  async history (period: string = "1mo", interval: string = "1d",
           start: string | number | Date = null, end: string | number | Date = null,
           prepost: boolean = false, actions: boolean = true,
           auto_adjust: boolean =true, back_adjust: boolean = false,
           rounding: boolean = false, tz=null) {

    let params = {
      range: undefined,
      period1: undefined,
      period2: undefined,
      interval: undefined,
      includePrePost: undefined,
      events: 'div,splits'
    }

    if (start || !period || period.toLowerCase() === 'max') {
      if (!start) {
        // timestamp of 1900-01-01
        start = -2208988800
      } else if (start instanceof Date) {
        start = Math.round(start.getTime() / 1000)
      } else {
        let splitDateString: Array<string> = start.toString().split('-')
        if (splitDateString.length === 3) {
          start = Math.round(new Date(
            Number(splitDateString[0]),
            Number(splitDateString[1]),
            Number(splitDateString[2])
          ).getTime() / 1000)
        } else {
          start = -2208988800
        }
      }

      if (!end) {
        end = Math.round(Date.now() / 1000)
      } else if (end instanceof Date) {
        end = Math.round(end.getTime() / 1000)
      } else {
        let splitDateString: Array<string> = end.toString().split('-')
        if (splitDateString.length === 3) {
          end = Math.round(new Date(
            Number(splitDateString[0]),
            Number(splitDateString[1]),
            Number(splitDateString[2])
          ).getTime())
        } else {
          end = Math.round(Date.now() / 1000)
        }
      }

      params.period1 = start.toString()
      params.period2 = end.toString()
    } else {
      // test if `period` is valid

      if (![
        '1d', '5d', '1mo', '3mo', '6mo',
        '1y', '2y', '5y', '10y', 'ytd', 'max'
      ].includes(period)) {
        throw new InvalidParameterError(`period [${period}] is not valid`)
      }

      period = period.toLowerCase()
      params.range = period
    }

    // test if `interval` is valid
    if (![
      '1m', '2m', '5m', '15m', '30m', '60m',
      '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo'
    ].includes(interval)) {
      throw new InvalidParameterError(`interval [${interval}] is not valid`)
    }

    params.interval = interval.toLowerCase()
    params.includePrePost = prepost

    if (params.interval === '30m') {
      params.interval = '15m'
    }

    let url = stringTemplate(
      api.historyChart,
      {
        baseUrl: api.baseUrl,
        symbol: this.symbol
      }
    )

    let client = this.sessionManager.session()

    console.log(url)
    console.log(params)
    let data = await client.get(url, {
      searchParams: params
    }).catch((error) => {
      console.error(error.response.body)
      let errorMsg = error.message
      let errorCode = ''
      if (error.response && error.response.body) {
        try {
          let data = JSON.parse(error.response.body)
          errorMsg = data.chart.error.description
          errorCode = data.chart.error.code
        } catch (e) {}
      }
      throw new RequestError(errorMsg, error.response, errorCode)
    })

    console.log(data.body)
  }
}
