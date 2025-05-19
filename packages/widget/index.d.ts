/**
 * Verify the user's KYC/MeID status.
 *
 * @deprecated since version 0.3.0, please use ``verifyKycWithZkMeServices`` or ``verifyMeidWithZkMeServices`` instead.
 * @param appId This parameter means the same thing as ``mchNo``.
 * @param userAccount Same value as in provider.getUserAccounts.
 * @param programNo The number of the program created in the dashboard system and make sure the program is enabled (dashboard.zk.me - Configuration - zkKYC). If you do not specify a value for this parameter, the SDK will default to the earliest program you configured in the dashboard.
 * @param lv ``"zkKYC"`` or ``"MeID"``, default ``"zkKYC"``
 */
export declare function verifyWithZkMeServices(appId: string, userAccount: string, programNo?: string, lv?: VerificationLevel): Promise<boolean>

/**
 * Verify the user's KYC status.
 *
 * @param appId This parameter means the same thing as ``mchNo``.
 * @param userAccount Same value as in provider.getUserAccounts.
 * @param options.programNo The number of the program created in the dashboard system and make sure the program is enabled (dashboard.zk.me - Configuration - zkKYC). If you do not specify a value for this parameter, the SDK will default to the earliest program you configured in the dashboard.
 */
export declare function verifyKycWithZkMeServices(
  appId: string,
  userAccount: string,
  options?: KycVerificationOptions
): Promise<{
  isGrant: boolean
  verifyTime: number | null
  verifyTimeAsIso: string | null
  programNo: string
}>

/**
 * Verify the user's MeID status.
 *
 * @param appId This parameter means the same thing as ``mchNo``.
 * @param userAccount Same value as in provider.getUserAccounts.
 */
export declare function verifyMeidWithZkMeServices(
  appId: string,
  userAccount: string,
  options?: MeIdVerificationOptions
): Promise<{
  isGrant: boolean
}>

export interface KycVerificationOptions {
  /**
   * The number of the program created in the dashboard system and make sure the program is enabled (dashboard.zk.me - Configuration - zkKYC).
   *
   * If you do not specify a value for this parameter, the SDK will default to the earliest program you configured in the dashboard.
   */
  programNo?: string
  endpoint?: string
}

export interface MeIdVerificationOptions {
  endpoint?: string
}

export interface KycResults {
  isGrant: boolean
  status: 'matching' | 'mismatch'
  verifyTime: number | null
  verifyTimeAsIso: string | null
  associatedAccount: string,
  programNo: string
}

export interface MeidResults {
  isGrant: boolean,
  associatedAccount: string
}

export interface TransactionRequest {
  from: string
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

export interface CosmosTransactionRequest {
  senderAddress: string,
  contractAddress: string,
  msg: any
}

export interface AptosTransactionRequest {
  function: string
  type_arguments: Array<string>
  arguments: Array<any>
}

export interface TonTransactionRequest {
  address: string,
  amount: string,
  payload: string,
}

export interface SolanaTransactionRequest {
  message: string
}

export interface StdSignature {
  pub_key: {
    type: string
    value: any
  }
  signature: string
}

export interface AptosSignMessagePayload {
  address?: boolean; // Should we include the address of the account in the message
  application?: boolean; // Should we include the domain of the dapp
  chainId?: boolean; // Should we include the current chain id the wallet is connected to
  message: string; // The message to be signed and displayed to the user
  nonce: number | string; // A nonce the dapp should generate
}

export interface AptosSignature {
  signature: string
  publicKey: string
  fullMessage: string
}

export type Base58String = string

export interface SolanaSignature {
  /**
   * bas58 string
   */
  signature: Base58String
  /**
   * bas58 string
   */
  publicKey: Base58String
}

export type ZkMeWidgetEvent = 'prepared' | 'close' | 'finished' | 'kycFinished' | 'meidFinished'
export type BaseEvent = 'prepared' | 'close' | 'finished'

export type FinishedHook = (verifiedAccount: string, kycResults?: 'matching' | 'mismatch') => void
export type KycFinishedHook = (results: KycResults) => void
export type MeidFinishedHook = (results: MeidResults) => void

export interface ZkMeWidgetMessageBody {
  id?: string
  channelId: string
  method?: 'getUserAccounts' | 'delegateTransaction' | 'signMessage' | 'getAccessToken'
  params?: TransactionRequest | CosmosTransactionRequest | AptosTransactionRequest | TonTransactionRequest | SolanaTransactionRequest | string
  kycResults?: 'matching' | 'mismatch'
  verifiedAddress?: string
  programNo?: string
  event?: BaseEvent
  email?: string
}

export type TransactionHash = string

export interface Provider {
  /**
   * This method is used to get the user's connected wallet address or unique identifier from you.
   *
   * If your project is a Dapp, you need to return the user's connected wallet address, if not, you should return the user's e-mail address, phone number or any other unique identifier.
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
   * This method is the same as ``delegateTransaction``, but it is an TON blockchain transaction, just implement one of them depending on the type of blockchain your project is running on.
   */
  delegateTonTransaction?(tx: TonTransactionRequest): Promise<TransactionHash>
  /**
   * This method is the same as ``delegateTransaction``, but it is an Solana blockchain transaction, just implement one of them depending on the type of blockchain your project is running on.
   */
  delegateSolanaTransaction?(tx: SolanaTransactionRequest): Promise<string>
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
  /**
   * This method is the same as ``signMessage``, just implement one of them depending on the type of blockchain your project is running on.
   */
  signSolanaMessage?(payload: Uint8Array): Promise<SolanaSignature>
}

export type VerificationLevel = 'zkKYC' | 'MeID'

export type LoginMode = 'email' | 'wallet'

export type Theme = 'light' | 'dark' | 'auto'

export type Language = 'en' | 'zh-hk'

export interface WidgetOptions {
  programNo?: string

  endpoint?: string
  kycApiEndpoint?: string
  meidApiEndpoint?: string

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
  locale?: Language
  /**
   * In wallet address login mode (``mode`` = ``"wallet"``), whether or not to check the user's wallet address.
   *
   * If ``true``, the ``provider.signMessage`` method must be implemented.
   * @default false
   */
  checkAddress?: boolean

  rootContainer?: string | HTMLElement

  searchParams?: URLSearchParams
}

export type ZkMeWidgetMemberIndex = 'appId' | 'name' | 'chainId' | 'programNo' | 'accessToken' | 'lv' | 'mode' | 'theme' | 'locale' | 'checkAddress'

export type ZkMeWidgetMember = {
  [k in ZkMeWidgetMemberIndex]: string | undefined
}

export declare class ZkMeWidget implements ZkMeWidgetMember {
  get appId(): string

  get name(): string

  get chainId(): string

  get programNo(): string | undefined

  get endpoint(): string | undefined

  get accessToken(): string | undefined

  get lv(): '1' | '2' | undefined

  get mode(): '0' | '1' | undefined

  get theme(): Theme | undefined

  // get primaryColor(): string | undefined

  get locale(): Language | undefined

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

  /**
   * @deprecated since version 0.3.0, please use ``on('kycFinished', cb)`` or ``on('meidFinished', cb)`` instead.
   */
  on(event: 'finished', callback: FinishedHook): void
  on(event: 'kycFinished', callback: KycFinishedHook): void
  on(event: 'meidFinished', callback: MeidFinishedHook): void
  on(event: 'close', callback: () => void): void

  destroy(): void
}

export declare const ZKME_WIDGET_ORIGIN: string
