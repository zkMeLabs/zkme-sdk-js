# zkMe zkKYC and Anti-Sybil SDK

zkMe zkKYC and Anti-Sybil SDK.

## Installation

``` shell
pnpm add @zkmelabs/widget

# or
yarn add @zkmelabs/widget

# or
npm install @zkmelabs/widget
```

## Getting Started

### Step 1. Import styles

``` javascript
import '@zkmelabs/widget/dist/style.css'
```

### Step 2. Create a new ``ZkMeWidget`` instance

``` javascript
import { ZkMeWidget, type Provider } from '@zkmelabs/widget'

const provider: Provider = {
  async getAccessToken() {
    // Request a new token from your backend service and return it to the widget.
    // For the access token, see https://docs.zk.me/zkme-dochub/verify-with-zkme-protocol/integration-guide/javascript-sdk/zkkyc-compliance-suite#how-to-generate-an-access-token-with-api_key
    return fetchNewToken()
  },

  async getUserAccounts() {
    // If your project is a Dapp,
    // you need to return the user's connected wallet address.
    const userConnectedAddress = await connect()
    return [userConnectedAddress]

    // If not,
    // you should return the user's e-mail address, phone number or any other unique identifier.
    //
    // return ['email address']
    // or
    // return ['phone number']
    // or
    // return ['unique identifier']
  },

  // According to which blockchain your project is integrated with,
  // choose and implement the corresponding methods as shown below.
  // If you are integrating Anti-Sybil(MeID) or Cross-chain zkKYC, you don't need to implement them.

  // EVM
  async delegateTransaction(tx) {
    const txResponse = await signer.sendTransaction(tx)
    return txResponse.hash
  },
  // Cosmos
  async delegateCosmosTransaction(tx) {
    const txResponse = await signingCosmWasmClient.execute(
      tx.senderAddress,
      tx.contractAddress,
      tx.msg,
      'auto'
    )
    return txResponse.transactionHash
  },
  // Aptos
  async delegateAptosTransaction(tx) {
    const txResponse = await aptos.signAndSubmitTransaction(tx)
    return txResponse.hash
  },
  // TON
  async delegateTonTransaction(tx) {
    const { boc } = await tonConnectUI.sendTransaction({
      validUntil: Date.now() + 5 * 60 * 1000, // You can customize this value
      messages: [tx]
    })
    const { hash } = Cell.fromBase64(boc)
    return hash().toString('hex')
  },
  // ...
  // See the Provider interface definition for more details on other chains.
}

const zkMeWidget = new ZkMeWidget(
  appId, // This parameter means the same thing as "mchNo"
  'YourDappName',
  chainId,
  provider,
  // Optional configurations are detailed in the table below
  options
)
```

| Param             | Type               | Description |
|-------------------|--------------------|------------------------------------------------------|
| options.lv        | VerificationLevel? | ``"zkKYC"`` or ``"MeID"``, default ``"zkKYC"`` |
| options.programNo | string?            | The number of the program created in the dashboard system and make sure the program is enabled (dashboard.zk.me - Configuration - zkKYC). If you do not specify a value for this parameter, the SDK will default to the earliest program you configured in the dashboard. |
| options.theme     | Theme?             | ``"auto"``, ``"light"`` or ``"dark"``, default ``"auto"``. |
| options.locale    | Language?          | ``"en"`` or ``"zh-hk"``, default ``"en"`` |

### Step 3. Listen to the ``kycFinished``/``meidFinished`` widget events to detect when the user has completed the zkKYC/MeID process.

#### zkKYC

``` typescript
function handleFinished(results) {
  const { isGrant, associatedAccount } = results

  if (
    isGrant &&
    associatedAccount === userConnectedAddress.toLowerCase()
  ) {
    // Prompts the user that zkKYC verification has been completed
  }
}

zkMeWidget.on('kycFinished', handleFinished)
```

#### MeID

``` typescript
zkMeWidget.on('meidFinished', handleFinished)
```

### Step 4. Launch the zkMe widget and it will be displayed in the center of your webpage.

``` javascript
// Button on your page
button.addEventListener('click', () => {
  zkMeWidget.launch()
})
```

## Helper functions

- verifyKycWithZkMeServices()
- verifyMeidWithZkMeServices()

Before launching the widget you should check the zkKYC/MeID status of the user and launch the widget when the check result is ``false``.

``` typescript
import { verifyKycWithZkMeServices } from '@zkmelabs/widget'

// zkKYC
const { isGrant } = await verifyKycWithZkMeServices(
  appId,
  userAccount,
  // Optional configurations are detailed in the table below
  options
)
```

| Param                  | Type               | Description                                             |
|------------------------|--------------------|---------------------------------------------------------|
| appId                  | string             | This parameter means the same thing as "mchNo"          |
| userAccount            | string             | The ``userAccount`` info (such as wallet address, email, phone number, or unique identifier) must match the format of accounts returned by ``provider.getUserAccounts``.           |
| options.programNo      | string?            | The number of the program created in the dashboard system and make sure the program is enabled (dashboard.zk.me - Configuration - zkKYC). If you do not specify a value for this parameter, the SDK will default to the earliest program you configured in the dashboard. |

You can also get a way to query a user's zkKYC status from a Smart Contract [here](https://github.com/zkMeLabs/zkme-sdk-js/tree/main/packages/verify-abi#readme).

## ZkMeWidget instance methods

### launch()

Launch the zkMe widget and it will be displayed in the center of your webpage.

``` typescript
launch(): void
```

### on()

Listen to zkMe widget events.

``` typescript
on(event: 'kycFinished', callback: KycFinishedHook): void;
on(event: 'meidFinished', callback: MeidFinishedHook): void;
on(event: 'close', callback: () => void): void;
```

### switchChain()

If your Dapp integrates multiple chains, use this method to synchronize the new chain to the zkMe widget when the user switches chains in your Dapp.

``` typescript
switchChain(chainId: string): void
```

| Param            | Type               | Description                                             |
|------------------|--------------------|---------------------------------------------------------|
| chainId          | string             | String in hex format, e.g. ``"0x89"``                   |

### hide()

Hide the zkMe widget.

``` typescript
hide(): void
```

### destroy()

Remove the message event listener registered by the zkMe widget from the window and destroy the DOM node.

``` typescript
destroy(): void
```
