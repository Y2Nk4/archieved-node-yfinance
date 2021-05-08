import * as api from '../api/url'
import { InvalidParameterError } from '../exceptions/InvalidParameterError'
import { RequestError } from '../exceptions/RequestError'
import { SessionManager } from './SessionManager'
import TickerFundamentals from '../structs/TickerFundamentals'
import cheerio from 'cheerio'
import { DataFrame } from 'danfojs-node'

const stringTemplate = require('string-template')

export class Ticker {
  public symbol: string;
  public proxy: any;
  private sessionManager: SessionManager;
  private tickerFundamentals: TickerFundamentals;

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
        symbol: this.symbol
      }
    )

    let client = this.sessionManager.session()

    // console.log(url)
    // console.log(params)
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

    return data.body
  }

  async _getFundamentals (prop: string) {
    if (this.tickerFundamentals && this.tickerFundamentals[prop]) {
      return this.tickerFundamentals[prop]
    } else {
      // fetch fundamentals and cache
      let url = stringTemplate(
        api.tickerFundamentals,
        {
          symbol: this.symbol
        }
      )

      let client = this.sessionManager.session()

      // console.log(params)
      let data = await client.get(url)
        .catch((error) => {
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

      let quoteSummary = Ticker.getQuotePageJson(data.body)
      console.log(quoteSummary, 'data')

      let holderUrl = stringTemplate(
        api.tickerHolders,
        {
          symbol: this.symbol
        }
      )
      let holdersData = await client.get(holderUrl)
        .then(resp => {
          return Promise.resolve(Ticker.parseHoldersTable(resp.body))
        })
        .catch(error => {
          console.error(error.response.body)
          return Promise.resolve({})
        })

      console.log('holders', holdersData)
      this.tickerFundamentals = {
        earnings: new DataFrame(quoteSummary.earnings.financialsChart.yearly.map((yearlyData) => {
          return {
            date: yearlyData.date,
            earnings: yearlyData.earnings.raw,
            revenue: yearlyData.revenue.raw
          }
        })),
        quarterly_earnings: new DataFrame(quoteSummary.earnings.financialsChart.quarterly.map((yearlyData) => {
          return {
            date: yearlyData.date,
            earnings: yearlyData.earnings.raw,
            revenue: yearlyData.revenue.raw
          }
        }))
      }

      return this.tickerFundamentals[prop]
    }
  }

  private static parseHoldersTable (pageContent: string) {
    let $ = cheerio.load(pageContent)
    console.log('loaded')
    function parseTable (table) {
      let result = []
      let header = []
      $(table).find('thead tr th').each((index, th) => {
        header.push($(th).text())
      })
      $(table).find('tbody tr').each((index, row) => {
        let rowData = {}
        $(row).find('td').each((index, td) => {
          if (index < header.length) {
            rowData[header[index]] = $(td).text()
          } else {
            rowData[index] = $(td).text()
          }
        })
        result.push(rowData)
      })
      return new DataFrame(result)
    }

    let tables = $('div#Main table')

    let holders = {
      major_holders: null,
      institutional_holders: null,
      mutualfund_holders: null
    }
    if (tables.length >= 3) {
      holders.major_holders = parseTable(tables[0])
      holders.institutional_holders = parseTable(tables[1])
      holders.mutualfund_holders = parseTable(tables[2])
    } else if (tables.length >= 2) {
      holders.major_holders = parseTable(tables[0])
      holders.institutional_holders = parseTable(tables[1])
    } else if (tables.length >= 1) {
      holders.major_holders = parseTable(tables[0])
    }

    // data is not cleaned yet
    // cleaning process includes process `Shares`, `Date Reported` and `Value`
    return holders
  }

  private static getQuotePageJson (pageContent: string){
    console.log('page content length: ', pageContent.length)
    if (pageContent.indexOf('QuoteSummaryStore') === -1) {
      return {}
    } else {
      let jsonStr = pageContent
        .split('root.App.main =')[1]
        .split('(this)')[0]
        .split(';\n}')[0]
        .trim()
      let data = JSON.parse(jsonStr)
      console.log(data, 'quoteRawJSON')
      return data.context.dispatcher.stores.QuoteSummaryStore
    }
  }

  get actions() {
    return this._getFundamentals('actions')
  }

  get earnings () {
    return this._getFundamentals('earnings')
  }

  get quarterly_earnings () {
    return this._getFundamentals('quarterly_earnings')
  }
}
