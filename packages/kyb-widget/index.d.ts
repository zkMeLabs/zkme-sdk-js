

/**
 * Verify the user's KYC status.
 *
 * @param appId This parameter means the same thing as ``mchNo``.
 * @param externalID Same value as in provider.getExternalID.
 * @param options.programNo The number of the program created in the dashboard system and make sure the program is enabled (dashboard.zk.me - Configuration - zkKYC). If you do not specify a value for this parameter, the SDK will default to the earliest program you configured in the dashboard.
 */
export declare function verifyKybWithZkMeServices(
  appId: string,
  externalID: string,
  accessToken: string,
  options?: KybVerificationOptions
): Promise<{
  verifyTimeAsIso: string | null;
  status: number;
  statusDesc: string;
}>;

/**
 * Verify the user's MeID status.
 *
 * @param appId This parameter means the same thing as ``mchNo``.
 * @param externalID Same value as in provider.getExternalID.
 */
export declare function verifyMeidWithZkMeServices(
  appId: string,
  externalID: string,
  options?: MeIdVerificationOptions
): Promise<{
  isGrant: boolean;
}>;

export interface KybVerificationOptions {
  /**
   * The number of the program created in the dashboard system and make sure the program is enabled (dashboard.zk.me - Configuration - zkKYC).
   *
   * If you do not specify a value for this parameter, the SDK will default to the earliest program you configured in the dashboard.
   */
  programNo?: string;
  endpoint?: string;
}

export interface MeIdVerificationOptions {
  endpoint?: string;
}

export interface KybResults {
  status: number;
  externalID: string;
  zkMeAccount: string;
  programNo: string;
}


export interface TransactionRequest {
  from: string;
  to: string;
  data: string;
  /**
   * Hex string
   * @example '0x1'
   */
  chainId: string;
  /**
   * Hex string
   * @example '0x2710'
   */
  gasLimit: string;
  /**
   * Hex string
   * @example '0x2710'
   */
  gasPrice: string;
  /**
   * Hex string
   * @example '0x2710'
   */
  maxFeePerGas: string | null;
  /**
   * Hex string
   * @example '0x2710'
   */
  maxPriorityFeePerGas: string | null;
}

export interface CosmosTransactionRequest {
  senderAddress: string;
  contractAddress: string;
  msg: any;
}

export interface AptosTransactionRequest {
  function: string;
  type_arguments: Array<string>;
  arguments: Array<any>;
}

export interface TonTransactionRequest {
  address: string;
  amount: string;
  payload: string;
}

export interface SolanaTransactionRequest {
  message: string;
}

export interface StdSignature {
  pub_key: {
    type: string;
    value: any;
  };
  signature: string;
}

export interface AptosSignMessagePayload {
  address?: boolean; // Should we include the address of the account in the message
  application?: boolean; // Should we include the domain of the dapp
  chainId?: boolean; // Should we include the current chain id the wallet is connected to
  message: string; // The message to be signed and displayed to the user
  nonce: number | string; // A nonce the dapp should generate
}

export interface AptosSignature {
  signature: string;
  publicKey: string;
  fullMessage: string;
}

export type Base58String = string;

export interface SolanaSignature {
  /**
   * bas58 string
   */
  signature: Base58String;
  /**
   * bas58 string
   */
  publicKey: Base58String;
}

export type ToastType = "success" | "error" | "warning";

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

export type ZkMeKybWidgetEvent =
  | "prepared"
  | "close"
  | "finished"
  | "kybFinished";
export type BaseEvent = "prepared" | "close" | "finished" | "showToast" | "hideToast";

export type FinishedHook = (
  verifiedAccount: string,
  kybStatus?: number
) => void;
export type KybFinishedHook = (results: KybResults) => void;

export interface ZkMeWidgetMessageBody {
  id?: string;
  channelId: string;
  method?:
    | "getExternalID"
    | "delegateTransaction"
    | "signMessage"
    | "getAccessToken"
    | "getOptions";
  params?:
    | TransactionRequest
    | CosmosTransactionRequest
    | AptosTransactionRequest
    | TonTransactionRequest
    | SolanaTransactionRequest
    | string;
  kybStatus?: number; // 1-Started, 2-InfoSubmitted, 3-UnderReview, 4-ActionRequired, 5-Passed, 6-Failed
  zkMeAccount?: string; // 对应businessId
  verifiedAddress?: string;
  programNo?: string;
  event?: BaseEvent;
  email?: string;
  data?: ToastData | { id: string };
}

export type TransactionHash = string;

export interface Provider {
  /**
   * This method is used to get the user's connected wallet address or unique identifier from you.
   *
   * If your project is a Dapp, you need to return the user's connected wallet address, if not, you should return the user's e-mail address, phone number or any other unique identifier.
   */
  getExternalID(): Promise<string[]>;
  /**
   * When a user authorizes his ZIS to you, we delegate to you the task of requesting the user's approval of the transaction. This method must be implemented when ``options.lv`` is ``"zkKYC"`` and your project is running on EVM-compatible blockchain.
   */
  delegateTransaction?(tx: TransactionRequest): Promise<TransactionHash>;
  /**
   * This method is the same as ``delegateTransaction``, but it is a Cosmos blockchain transaction, just implement one of them depending on the type of blockchain your project is running on.
   */
  delegateCosmosTransaction?(
    tx: CosmosTransactionRequest
  ): Promise<TransactionHash>;
  /**
   * This method is the same as ``delegateTransaction``, but it is an Aptos blockchain transaction, just implement one of them depending on the type of blockchain your project is running on.
   */
  delegateAptosTransaction?(
    tx: AptosTransactionRequest
  ): Promise<TransactionHash>;
  /**
   * This method is the same as ``delegateTransaction``, but it is an TON blockchain transaction, just implement one of them depending on the type of blockchain your project is running on.
   */
  delegateTonTransaction?(tx: TonTransactionRequest): Promise<TransactionHash>;
  /**
   * This method is the same as ``delegateTransaction``, but it is an Solana blockchain transaction, just implement one of them depending on the type of blockchain your project is running on.
   */
  delegateSolanaTransaction?(tx: SolanaTransactionRequest): Promise<string>;
  /**
   * This method is used to get a new AccessToken from you.
   */
  getAccessToken(): Promise<string>;
  /**
   * This method is used to request a signature from the user to ensure that their wallet address is valid. This method must be implemented when ``options.checkAddress`` is ``true``
   */
  signMessage?(message: string): Promise<string | StdSignature>;
  /**
   * This method is the same as ``signMessage``, just implement one of them depending on the type of blockchain your project is running on.
   */
  signAptosMessage?(payload: AptosSignMessagePayload): Promise<AptosSignature>;
  /**
   * This method is the same as ``signMessage``, just implement one of them depending on the type of blockchain your project is running on.
   */
  signSolanaMessage?(payload: Uint8Array): Promise<SolanaSignature>;
}

export type VerificationLevel = "zkKYC" | "MeID";

export type LoginMode = "email" | "wallet";

export type Theme = "light" | "dark" | "auto";

export type Language = "en" | "zh-hk";

export interface WidgetOptions {
  programNo?: string;
  endpoint?: string;
  kybApiEndpoint?: string;
  accessToken?: string;
  rootContainer?: string | HTMLElement;
  searchParams?: URLSearchParams;
}

export type ZkMeWidgetMemberIndex =
  | "mchNo"
  | "name"
  | "programNo"
  | "accessToken";

export type ZkMeWidgetMember = {
  [k in ZkMeWidgetMemberIndex]: string | undefined;
};

export declare class ZkMeKybWidget implements ZkMeWidgetMember {
  get mchNo(): string;

  get name(): string;

  get programNo(): string | undefined;

  get endpoint(): string | undefined;

  get accessToken(): string | undefined;

  searchParams?: URLSearchParams;

  /**
   * @param mchNo Merchant number (same as appId in KYC).
   * @param name Name of your project
   * @param provider This provider is used by the zkMe widget to send requests to your project.
   * @param options Optional parameters including programNo.
   */
  constructor(
    mchNo: string,
    name: string,
    provider: Provider,
    options?: WidgetOptions
  );

  launch(): void;

  relaunch(accessToken?: string): void;

  hide(): void;

  show(): void;

  on(event: "close", callback: () => void): void;
  on(event: "kybFinished", callback: KybFinishedHook): void;

  destroy(): void;
}

export declare const ZKME_WIDGET_ORIGIN: string;

export interface ToastManagerOptions {
  channelId?: string;
  widgetOrigin?: string;
}

export declare class ToastManager {
  constructor(options?: ToastManagerOptions);
  showToast(data: ToastData): void;
  hideToast(id: string): void;
  destroy(): void;
}
