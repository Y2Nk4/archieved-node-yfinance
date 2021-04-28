import got from 'got'
import { HttpsProxyAgent } from 'hpagent'

export class SessionManager {
  private proxy: HttpsProxyAgent = null

  constructor (proxy: string | HttpsProxyAgent = null) {
    if (proxy) {
      if (typeof proxy === 'string') {
        this.proxy = new HttpsProxyAgent({
          keepAlive: true,
          keepAliveMsecs: 1000,
          maxSockets: 256,
          maxFreeSockets: 256,
          scheduling: 'lifo',
          proxy: proxy
        })
      } else if (proxy instanceof HttpsProxyAgent) {
        this.proxy = proxy
      }
    }
  }

  session () {
    return got.extend({
      agent: {
        https: this.proxy
      },
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36'
      }
    })
  }
}
