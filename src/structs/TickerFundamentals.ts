import { DataFrame } from 'danfojs-node'

export default interface TickerFundamentals {
  earnings: DataFrame
  quarterly_earnings: DataFrame
  dividends?
  splits?
  financials?
  quarterly_financials?
  major_holders?
  institutional_holders?
  balance_sheet?
  quarterly_balance_sheet?
  cashflow?
  quarterly_cashflow?
  sustainability?
  recommendations?
  calendar?
  isin?
}
