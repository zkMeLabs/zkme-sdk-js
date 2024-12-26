import type { WidgetOptions, VerificationLevel, LoginMode, Theme, ZkMeWidgetMessageBody, Provider, TransactionRequest, CosmosTransactionRequest, AptosTransactionRequest, ZkMeWidgetEvent, KycFinishedHook, MeidFinishedHook, ZkMeWidgetMemberIndex, ZkMeWidget as _ZkMeWidget, AptosSignMessagePayload, AptosSignature, StdSignature, FinishedHook, Language, TonTransactionRequest } from '..'
import { verifyKycWithZkMeServices, verifyMeidWithZkMeServices } from './verify';

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
    if (deta > 0) {
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

function formatErrorMessage(error: any): string {
  try {
    const r = JSON.stringify(error)
    if (r !== '{}') {
      return r
    }
  } catch {
    //
  }
  return error?.message || 'Unknown error'
}

export class ZkMeWidget implements _ZkMeWidget {
  #appId: string
  #name: string
  #chainId: string
  #provider: Provider
  #programNo?: string

  #endpoint?: string
  #kycApiEndpoint?: string
  #meidApiEndpoint?: string

  #accessToken?: string
  #lv?: VerificationLevel
  #mode?: LoginMode
  #theme?: Theme
  // #primaryColor?: string
  #locale?: Language
  #checkAddress?: boolean

  #widgetMask: HTMLElement | null = null
  #widgetNode: HTMLIFrameElement | null = null
  #loadingNode: HTMLElement | null = null
  #customContainer?: string | HTMLElement

  #visibility: boolean = false
  #events = new Map<string, (() => void | FinishedHook | KycFinishedHook | MeidFinishedHook)[]>()
  #channelId: string

  #darkSchemeQuery?: MediaQueryList
  #isDestroyed = false

  searchParams?: URLSearchParams

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

  get programNo() {
    return this.#programNo
  }

  get endpoint() {
    return this.#endpoint
  }

  get accessToken() {
    return this.#accessToken
  }

  get lv() {
    return this.#lv === 'MeID' ? '2' : '1'
  }

  get mode() {
    return this.#mode === 'wallet' ? '1' : '0'
  }

  get theme() {
    return this.#theme
  }

  // get primaryColor() {
  //   return this.#primaryColor
  // }

  get locale() {
    return this.#locale
  }

  get checkAddress() {
    if (this.#checkAddress)
      return this.#checkAddress ? '1' : '0'
  }

  constructor(appId: string, name: string, chainId: string, provider: Provider, options?: WidgetOptions) {
    if (options?.mode === 'wallet' && options?.lv === 'zkKYC') {
      throw new Error('Wallet login mode only available with lv="MeID".')
    }
    if (options?.checkAddress) {
      if (options?.mode === 'email')
        throw new Error('Check address only available with mode="Wallet".')
      if (!provider.signMessage)
        throw new Error('The provider must implement "signMessage" when a checksum address is "true".')
    }
    // if (options?.lv === 'zkKYC' && !provider.delegateTransaction && !provider.delegateCosmosTransaction) {
    //   throw new Error('You must choose to implement one of the methods "delegateTransaction" and "delegateCosmosTransaction" depending on the type of blockchain your project is running on.')
    // }

    this.#appId = appId
    this.#name = name
    this.#chainId = chainId
    this.#provider = provider
    this.#programNo = options?.programNo
    this.#endpoint = options?.endpoint
    this.#kycApiEndpoint = options?.kycApiEndpoint
    this.#meidApiEndpoint = options?.meidApiEndpoint
    this.#accessToken = options?.accessToken
    this.#lv = options?.lv
    this.#mode = options?.mode
    this.#theme = options?.theme
    // this.#primaryColor = options?.primaryColor
    this.#locale = options?.locale
    this.#checkAddress = options?.checkAddress
    this.#channelId = `${Date.now()}-${ZkMeWidget.#id++}`
    this.#customContainer = options?.rootContainer
    this.searchParams = options?.searchParams

    window.addEventListener('message', this.#listener)

    // Fixed the issue where iframe cannot monitor system color theme changes
    if (
      (!this.#theme || this.#theme === 'auto') &&
      window.matchMedia
    ) {
      this.#darkSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
      this.#darkSchemeQuery.addEventListener('change', this.#handleColorChange)
    }
  }

  #handleColorChange = (ev: MediaQueryListEvent) => {
    this.#widgetNode?.contentWindow?.postMessage({
      event: 'colorChanged',
      data: ev.matches ? 'dark' : 'light'
    }, this.#endpoint || ZKME_WIDGET_ORIGIN)
  }

  #listener = async (ev: MessageEvent<ZkMeWidgetMessageBody>) => {
    if (
      ev.origin !== (this.endpoint || ZKME_WIDGET_ORIGIN) ||
      this.#channelId !== ev.data.channelId
    ) {
      return
    }
    const {
      id,
      method,
      params,
      verifiedAddress,
      programNo,
      event
    } = ev.data

    if (event === 'prepared') {
      this.#loadingNode?.classList.add('hide')
      animation(300, undefined, () => {
        this.#loadingNode?.remove()
      })
    } else if (event === 'finished' && verifiedAddress) {
      let results: any
      let callbacks: KycFinishedHook[] | MeidFinishedHook[]

      if (this.#lv === 'MeID') {
        results = await this.verifyMeidWithZkMeServices(verifiedAddress)
        results.associatedAccount = verifiedAddress
        callbacks = this.#events.get('meidFinished') || []
      } else {
        results = await this.verifyKycWithZkMeServices(verifiedAddress, programNo)
        results = {
          status: results.isGrant ? 'matching' : 'mismatch',
          associatedAccount: verifiedAddress,
          programNo,
          ...results
        }
        callbacks = this.#events.get('kycFinished') || []
      }

      this.hide()
      callbacks.forEach((cb) => {
        cb(results)
      })

      // ----deprecated since version 0.3.0----
      const finishedCallbacks = this.#events.get('finished') || []
      finishedCallbacks.forEach((cb: FinishedHook) => {
        cb(verifiedAddress, results.status)
      })
      // ----deprecated since version 0.3.0----

      // Clear the dom when the hide animation ends
      animation(320, undefined, () => {
        this.#clearDom()
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
        handleReject(formatErrorMessage(err))
      }

    } else if (method === 'delegateTransaction') {
      try {
        let txHash: string

        if (is<CosmosTransactionRequest>(params, 'senderAddress')) {
          txHash = await this.#provider.delegateCosmosTransaction!(params)
        } else if (is<AptosTransactionRequest>(params, 'function')) {
          txHash = await this.#provider.delegateAptosTransaction!(params)
        } else if (is<TonTransactionRequest>(params, 'payload')) {
          txHash = await this.#provider.delegateTonTransaction!(params)
        } else {
          txHash = await this.#provider.delegateTransaction!(params as TransactionRequest)
        }
        handleApprove(txHash)
      } catch (err: any) {
        handleReject(formatErrorMessage(err))
      }

    } else if (method === 'getAccessToken') {
      try {
        const accessToken = await this.#provider.getAccessToken()
        handleApprove(accessToken)
      } catch (err: any) {
        handleReject(formatErrorMessage(err))
      }

    } else if (method === 'signMessage') {
      try {
        let results: string | StdSignature | AptosSignature

        if (typeof params === 'string') {
          results = await this.#provider.signMessage!(params)
        } else {
          if (!this.#provider.signAptosMessage) {
            throw new Error('The provider does not implement the "signAptosMessage" method.')
          }
          results = await this.#provider.signAptosMessage(params as unknown as AptosSignMessagePayload)
        }
        handleApprove(results)
      } catch (err: any) {
        handleReject(formatErrorMessage(err))
      }
    }
  }

  #generateUrl(accessToken?: string) {
    if (accessToken)
      this.#accessToken = accessToken

    const url = new URL(this.#endpoint || ZKME_WIDGET_ORIGIN)

    const params = Array<ZkMeWidgetMemberIndex>('appId', 'name', 'chainId', 'programNo', 'accessToken', 'lv', 'mode', 'theme', 'locale', 'checkAddress')
    params.forEach((p) => {
      const v = this[p]
      v && url.searchParams.set(p, String(v))
    })
    url.searchParams.set('origin', location.origin)
    url.searchParams.set('channelId', this.#channelId)
    if (this.#darkSchemeQuery) {
      url.searchParams.set('sysColor', this.#darkSchemeQuery.matches ? 'dark' : 'light')
    }
    if (this.#customContainer) {
      url.searchParams.set('isCustomContainer', '1')
    }

    if (this.searchParams) {
      return url.toString() + '&' + this.searchParams.toString()
    }

    return url.toString()
  }

  #clearDom() {
    if (this.#widgetMask) {
      this.#widgetMask.remove()
      this.#widgetMask = this.#widgetNode = null
      this.#visibility = false
    }
  }

  #getRootContainer() {
    if (this.#customContainer) {
      if (typeof this.#customContainer === 'string') {
        const nd = document.querySelector<HTMLElement>(this.#customContainer)
        if (!nd) {
          throw new Error('Invalid root container.')
        }
        return nd
      } else {
        return this.#customContainer
      }
    }
  }

  launch() {
    if (this.#widgetNode) {
      this.show()
      return
    }
    if (this.#isDestroyed) {
      window.addEventListener('message', this.#listener)
      this.#darkSchemeQuery?.addEventListener('change', this.#handleColorChange)
    }

    const container = this.#getRootContainer() || document.body

    this.#widgetMask = document.createElement('div')
    this.#widgetMask.classList.add('zkme-transition')

    if (!this.#customContainer) {
      const maxZIndex = getMaxZIndex()
      this.#widgetMask.classList.add('zkme-widget-mask')
      this.#widgetMask.style.zIndex = `${maxZIndex + 1}`
    }

    const src = this.#generateUrl()
    let wrapStyle = ''

    if (this.#customContainer) {
      wrapStyle += '; width: auto; max-width: 510px'
    }

    if (this.#theme && this.#theme !== 'auto') {
      const cssVar = {
        light: { background: '#fff', txt: '#005563' },
        dark: { background: '#141414', txt: '#fff' },
      }[this.#theme]
      const docEl = document.documentElement
      docEl.style.setProperty('--zkme-c-background', cssVar.background)
      docEl.style.setProperty('--zkme-c-txt', cssVar.txt)
    }

    this.#widgetMask.innerHTML = `
      <div class="zkme-widget-wrap" style="${wrapStyle}">
        <div class="zkme-loading">
          <div class="left-cylinder">
            <div class="left-point"></div>
          </div>
          <div class="right-cylinder">
            <div class="right-point"></div>
          </div>
        </div>
        <iframe allow="camera" src="${src}" width="100%" height="100%"></iframe>
      </div>
    `
    this.#widgetNode = this.#widgetMask.querySelector('iframe')
    this.#loadingNode = this.#widgetMask.querySelector('.zkme-loading')
    container.appendChild(this.#widgetMask)
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
      // this.show()
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
    if (!this.#widgetNode) {
      return this.launch()
    }
    if (this.#visibility)
      return
    this.#visibility = true
    const display = this.#customContainer ? 'block' : 'flex'
    this.#widgetMask && (this.#widgetMask.style.display = display)
    animation(300, () => {
      this.#widgetMask?.classList.add('zkme-fade')
    })
  }

  on(event: 'finished', callback: FinishedHook): void
  on(event: 'kycFinished', callback: KycFinishedHook): void
  on(event: 'meidFinished', callback: MeidFinishedHook): void
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
    window.removeEventListener('message', this.#listener)
    this.#darkSchemeQuery?.removeEventListener('change', this.#handleColorChange)
    this.#clearDom()
    this.#isDestroyed = true
  }

  verifyKycWithZkMeServices(userAccount: string, programNo?: string) {
    return verifyKycWithZkMeServices(this.appId, userAccount, {
      programNo: programNo || this.#programNo,
      endpoint: this.#kycApiEndpoint
    })
  }

  verifyMeidWithZkMeServices(userAccount: string) {
    return verifyMeidWithZkMeServices(this.appId, userAccount, {
      endpoint: this.#meidApiEndpoint
    })
  }
}
