import type { WidgetOptions, VerificationLevel, LoginMode, Theme, ZkMeWidgetMessageBody, Provider, TransactionRequest, CosmosTransactionRequest, ZkMeWidgetEvent, FinishedHook, ZkMeWidgetMemberIndex, ZkMeWidget as _ZkMeWidget } from '..'
import { verifyKYCWithZkMeServices } from './verify'


export const ZKME_WIDGET_ORIGIN = import.meta.env.VITE_ZKME_WIDGET_ORIGIN || 'https://widget.zk.me'

function is<T> (obj: any, key: string): obj is T {
  return key in obj
}

function getMaxZIndex() {
  return Math.max(
    ...Array.from(document.querySelectorAll('body *'), el =>
      parseFloat(window.getComputedStyle(el).zIndex),
    ).filter(zIndex => !Number.isNaN(zIndex)),
    0,
  );
}

function animation(time: number, startCb?: () => void, doneCb?: () => void) {
  let start: number
  let deta: number
  const step = (timestamp: number) => {
    if (!start) {
      start = timestamp
    }
    deta = timestamp - start
    if (deta < 1) {
      startCb && startCb()
    }
    if (deta <= time) {
      window.requestAnimationFrame(step)
    } else {
      doneCb && doneCb()
    }
  }
  window.requestAnimationFrame(step)
}

export class ZkMeWidget implements _ZkMeWidget {
  #appId: string
  #name: string
  #chainId: string
  #provider: Provider
  #accessToken?: string
  #lv?: VerificationLevel
  #mode?: LoginMode
  #theme?: Theme
  #primaryColor?: string
  #checkAddress?: boolean

  #widgetMask: HTMLDivElement | null = null
  #widgetWrap: HTMLDivElement | null = null
  #widgetNode: HTMLIFrameElement | null = null

  #visibility: boolean = false
  #events = new Map<string, (() => void | FinishedHook)[]>()
  #channelId: string

  static #id: number = 0

  get appId() {
    return this.#appId
  }

  get name() {
    return this.#name
  }

  get chainId() {
    return this.#chainId
  }

  get accessToken() {
    return this.#accessToken
  }

  get lv() {
    if (this.#lv === 'zkKYC') return '1'
    if (this.#lv === 'Anti-Sybil') return '2'
  }

  get mode() {
    if (this.#mode === 'email') return '0'
    if (this.#mode === 'wallet') return '1'
  }

  get theme() {
    return this.#theme
  }

  get primaryColor() {
    return this.#primaryColor
  }

  get checkAddress() {
    if (this.#checkAddress)
      return this.#checkAddress ? '1' : '0'
  }

  constructor(appId: string, name: string, chainId: string, provider: Provider, options?: WidgetOptions) {
    if (options?.mode === 'wallet' && options?.lv === 'zkKYC') {
      throw new Error('Wallet login mode only available with lv="Anti-Sybil".')
    }
    if (options?.checkAddress) {
      if (options?.mode === 'email')
        throw new Error('Check address only available with mode="Wallet".')
      if (!provider.signMessage)
        throw new Error('The provider must implement "signMessage" when a checksum address is "true".')
    }
    if (options?.lv === 'zkKYC' && !provider.delegateTransaction && !provider.delegateCosmosTransaction) {
      throw new Error('You must choose to implement one of the methods "delegateTransaction" and "delegateCosmosTransaction" depending on the type of blockchain your project is running on.')
    }

    this.#appId = appId
    this.#name = name
    this.#chainId = chainId
    this.#provider = provider
    this.#accessToken = options?.accessToken
    this.#lv = options?.lv
    this.#mode = options?.mode
    this.#theme = options?.theme
    this.#primaryColor = options?.primaryColor
    this.#checkAddress = options?.checkAddress
    this.#channelId = `${Date.now()}-${ZkMeWidget.#id++}`

    window.addEventListener('message', this.#listener)
  }

  #listener = async (ev: MessageEvent<ZkMeWidgetMessageBody>) => {
    if (ev.origin !== ZKME_WIDGET_ORIGIN || this.#channelId !== ev.data.channelId) {
      return
    }
    const {
      id,
      method,
      params,
      kycResults,
      verifiedAddress,
      event
    } = ev.data

    if (event === 'finished' && verifiedAddress) {
      const callbacks = this.#events.get(event) || []
      callbacks.forEach((cb: FinishedHook) => {
        cb(verifiedAddress, kycResults)
      })
    } else if (event === 'close') {
      this.hide()
      const callbacks = this.#events.get(event) || []
      callbacks.forEach(cb => {
        cb()
      })
    }

    const source = ev.source as Window

    const handleApprove = (data: any) => {
      source.postMessage({
        id,
        message: 'ok',
        data
      }, ev.origin)
    }
    const handleReject = (message: string) => {
      source.postMessage({
        id,
        message
      }, ev.origin)
    }

    if (method === 'getUserAccounts') {
      try {
        const accounts = await this.#provider.getUserAccounts()
        handleApprove(accounts)
      } catch (err: any) {
        handleReject(err.message)
      }

    } else if (method === 'delegateTransaction') {
      try {
        let txHash: string
        if (is<CosmosTransactionRequest>(params, 'senderAddress')) {
          txHash = await this.#provider.delegateCosmosTransaction!(params)
        } else {
          txHash = await this.#provider.delegateTransaction!(params as TransactionRequest)
        }
        handleApprove(txHash)
      } catch (err: any) {
        handleReject(err.message)
      }

    } else if (method === 'getAccessToken') {
      try {
        const accessToken = await this.#provider.getAccessToken()
        handleApprove(accessToken)
      } catch (err: any) {
        handleReject(err.message)
      }

    } else if (method === 'signMessage') {
      try {
        if (!this.#provider.signMessage) {
          throw new Error('The provider does not implement the "signMessage" method.')
        }
        const signature = await this.#provider.signMessage(params as string)
        handleApprove(signature)
      } catch (err: any) {
        handleReject(err.message)
      }
    }
  }

  #generateUrl(accessToken?: string) {
    if (accessToken)
      this.#accessToken = accessToken

    const url = new URL(ZKME_WIDGET_ORIGIN)

    const params = Array<ZkMeWidgetMemberIndex>('appId', 'name', 'chainId', 'accessToken', 'lv', 'mode', 'theme', 'primaryColor', 'checkAddress')
    params.forEach((p) => {
      const v = this[p]
      v && url.searchParams.append(p, v)
    })
    url.searchParams.append('origin', location.origin)
    url.searchParams.append('channelId', this.#channelId)

    return url.toString()
  }

  launch() {
    if (this.#widgetNode) {
      this.show()
      return
    }
    this.#widgetMask = document.createElement('div')
    this.#widgetWrap = document.createElement('div')
    this.#widgetNode = document.createElement('iframe')

    this.#widgetMask.classList.add('zkme-widget-mask', 'zkme-fl-central')
    this.#widgetWrap.classList.add('zkme-widget-wrap')
    this.#widgetNode.width = '100%'
    this.#widgetNode.height = '100%'
    this.#widgetNode.allow = 'camera'

    const maxZIndex = getMaxZIndex()
    this.#widgetMask.style.zIndex = String(maxZIndex + 1)

    this.#widgetNode.src = this.#generateUrl()
    this.#widgetWrap.appendChild(this.#widgetNode)
    this.#widgetMask.appendChild(this.#widgetWrap)
    document.body.appendChild(this.#widgetMask)
    this.show()
  }

  relaunch(accessToken?: string) {
    if (this.#widgetNode) {
      this.#widgetNode.src = this.#generateUrl(accessToken)
      this.show()
    }
  }

  switchChain(chainId: string) {
    this.#chainId = chainId
    if (this.#widgetNode) {
      this.#widgetNode.src = this.#generateUrl()
      this.show()
    }
  }

  hide() {
    if (!this.#visibility)
      return
    this.#visibility = false
    this.#widgetMask?.classList.remove('zkme-fade')
    animation(300, undefined, () => {
      this.#widgetMask && (this.#widgetMask.style.display = 'none')
    })
  }

  show() {
    if (this.#visibility)
      return
    this.#visibility = true
    this.#widgetMask && (this.#widgetMask.style.display = 'flex')
    animation(300, () => {
      this.#widgetMask?.classList.add('zkme-fade')
    })
  }

  on(event: 'finished', callback: FinishedHook): void
  on(event: 'close', callback: () => void): void
  on(event: ZkMeWidgetEvent, callback: any) {
    const callbacks = this.#events.get(event)
    if (callbacks) {
      callbacks.push(callback)
    } else {
      this.#events.set(event, [callback])
    }
  }

  destroy() {
    window.addEventListener('message', this.#listener)
    if (this.#widgetMask) {
      document.body.removeChild(this.#widgetMask)
      this.#widgetMask = this.#widgetWrap = this.#widgetNode = null
    }
  }

  static async verifyKYCWithZkMeServices(appId: string, userAccount: string) {
    return verifyKYCWithZkMeServices(appId, userAccount)
  }
}
