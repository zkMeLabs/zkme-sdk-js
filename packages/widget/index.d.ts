/**
 * Verify that the user passes your KYC requirements.
 *
 * @param appId This parameter means the same thing as ``mchNo``.
 * @param userAccount User's wallet address.
 */
export declare function verifyKYCWithZkMeServices(appId: string, userAccount: string): Promise<boolean>

export type KycResults = 'matching' | 'mismatch'

export type TransactionRequest = {
  type: null | number
  to: string
  data: string
  /**
   * Hex string
   * @example '0x1'
   */
  chainId: string
  /**
   * Hex string
   * @example '0x2710'
   */
  gasLimit: string
  /**
   * Hex string
   * @example '0x2710'
   */
  gasPrice: string
  /**
   * Hex string
   * @example '0x2710'
   */
  maxFeePerGas: string | null
  /**
   * Hex string
   * @example '0x2710'
   */
  maxPriorityFeePerGas: string | null
}

export type CosmosTransactionRequest = {
  senderAddress: string,
  contractAddress: string,
  msg: any
}

export type AptosTransactionRequest = {
  function: string
  type_arguments: Array<string>
  arguments: Array<any>
}

export type StdSignature = {
  pub_key: {
    type: string
    value: any
  }
  signature: string
}

export type AptosSignMessagePayload = {
  address?: boolean; // Should we include the address of the account in the message
  application?: boolean; // Should we include the domain of the dapp
  chainId?: boolean; // Should we include the current chain id the wallet is connected to
  message: string; // The message to be signed and displayed to the user
  nonce: number | string; // A nonce the dapp should generate
}

export type AptosSignature = {
  signature: string
  publicKey: string
  fullMessage: string
}

export type ZkMeWidgetEvent = 'close' | 'finished'

export type FinishedHook = (verifiedAddress: string, kycResults?: KycResults) => void

export type ZkMeWidgetMessageBody = {
  id?: string
  channelId: string
  method?: 'getUserAccounts' | 'delegateTransaction' | 'signMessage' | 'getAccessToken'
  params?: TransactionRequest | CosmosTransactionRequest | string
  kycResults?: KycResults
  verifiedAddress?: string
  event?: ZkMeWidgetEvent
  email?: string
}

export type TransactionHash = string

export interface Provider {
  /**
   * This method is used to get the user's connected wallet address from you.
   */
  getUserAccounts(): Promise<string[]>
  /**
   * When a user authorizes his ZIS to you, we delegate to you the task of requesting the user's approval of the transaction. This method must be implemented when ``options.lv`` is ``"zkKYC"`` and your project is running on EVM-compatible blockchain.
   */
  delegateTransaction?(tx: TransactionRequest): Promise<TransactionHash>
  /**
   * This method is the same as ``delegateTransaction``, but it is a Cosmos blockchain transaction, just implement one of them depending on the type of blockchain your project is running on.
   */
  delegateCosmosTransaction?(tx: CosmosTransactionRequest): Promise<TransactionHash>
  /**
   * This method is the same as ``delegateTransaction``, but it is an Aptos blockchain transaction, just implement one of them depending on the type of blockchain your project is running on.
   */
  delegateAptosTransaction?(tx: AptosTransactionRequest): Promise<TransactionHash>
  /**
   * This method is used to get a new AccessToken from you.
   */
  getAccessToken(): Promise<string>
  /**
   * This method is used to request a signature from the user to ensure that their wallet address is valid. This method must be implemented when ``options.checkAddress`` is ``true``
   */
  signMessage?(message: string): Promise<string | StdSignature>
  /**
   * This method is the same as ``signMessage``, just implement one of them depending on the type of blockchain your project is running on.
   */
  signAptosMessage?(payload: AptosSignMessagePayload): Promise<AptosSignature>
}

export type VerificationLevel = 'zkKYC' | 'Anti-Sybil'

export type LoginMode = 'email' | 'wallet'

export type Theme = 'light' | 'dark' | 'auto'

export type WidgetOptions = {
  accessToken?: string
  /**
   * @default 'zkKYC'
   */
  lv?: VerificationLevel
  /**
   * Mode of user login for zkMe widget.
   * @default 'email'
   */
  mode?: LoginMode
  /**
   * @default 'auto'
   */
  theme?: Theme
  /**
   * Coming soon.
   */
  // primaryColor?: string
  /**
   * In wallet address login mode (``mode`` = ``"wallet"``), whether or not to check the user's wallet address.
   *
   * If ``true``, the ``provider.signMessage`` method must be implemented.
   * @default false
   */
  checkAddress?: boolean

  searchParams?: URLSearchParams
}

export type ZkMeWidgetMemberIndex = 'appId' | 'name' | 'chainId' | 'accessToken' | 'lv' | 'mode' | 'theme' | 'checkAddress'

export type ZkMeWidgetMember = {
  [k in ZkMeWidgetMemberIndex]: string | undefined
}

export declare class ZkMeWidget implements ZkMeWidgetMember {
  get appId(): string

  get name(): string

  get chainId(): string

  get accessToken(): string | undefined

  get lv(): '1' | '2' | undefined

  get mode(): '0' | '1' | undefined

  get theme(): Theme | undefined

  // get primaryColor(): string | undefined

  get checkAddress(): '0' | '1' | undefined

  searchParams?: URLSearchParams

  /**
   * @param appId This parameter means the same thing as ``mchNo``.
   * @param name Name of your project
   * @param chainId The chain id in hex format of the network your project is currently on, e.g. ``"0x5"``
   * @param provider This provider is used by the zkMe widget to send requests to your project.
   * @param options Other optional parameters
   */
  constructor(appId: string, name: string, chainId: string, provider: Provider, options?: WidgetOptions)

  launch(): void

  relaunch(accessToken?: string): void

  switchChain(chainId: string): void

  hide(): void

  show(): void

  on(event: 'finished', callback: FinishedHook): void
  on(event: 'close', callback: () => void): void

  destroy(): void
}

export declare const ZKME_WIDGET_ORIGIN: string
