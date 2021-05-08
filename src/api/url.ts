/**
 * Yahoo Finance API endpoints
 *
 * */

export const baseUrl = "https://query1.finance.yahoo.com"
export const scrapeUrl = "https://finance.yahoo.com"


/**
 * template variables:
 * symbol: symbol of the ticker
 *
 * */
export const historyChart = `${baseUrl}/v8/finance/chart/{symbol}`
export const tickerFundamentals = `${scrapeUrl}/quote/{symbol}`
export const tickerHolders = `${scrapeUrl}/quote/{symbol}/holders`
