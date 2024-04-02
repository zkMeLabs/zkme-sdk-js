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
    // For the access token, see https://docs.zk.me/zkme-dochub/zkkyc-compliance-suite/zkkyc-integration-guide/sdk-integration#exchanging-api_key-for-access-token
    return fetchNewToken()
  },

  async getUserAccounts() {
    // If your project is a Dapp,
    // you need to return the user's connected wallet address.
    if (!userConnectedAddress) {
      userConnectedAddress = await connect()
    }
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

| Param            | Type               | Description                                             |
|------------------|--------------------|---------------------------------------------------------|
| options.lv       | VerificationLevel? | ``"zkKYC"`` or ``"Anti-Sybil"``, default ``"zkKYC"``    |

### Step 3. Listen to the ``finished`` widget events to detect when the user has completed the zkKYC/MeID process.

``` typescript
import { verifyWithZkMeServices } from '@zkmelabs/widget'

function handleFinished(verifiedAccount: string) {
  // We recommend that you double-check this by calling
  // the functions mentioned in the "Helper functions" section.
  if (
    verifiedAccount === userConnectedAddress
  ) {
    // zkKYC
    const results = await verifyWithZkMeServices(appId, userConnectedAddress)

    // Anti-Sybil(MeID)
    // const results = await verifyWithZkMeServices(appId, userConnectedAddress, 'Anti-Sybil')

    if (results) {
      // Prompts the user that zkKYC/MeID verification has been completed
    }
  }
}

zkMeWidget.on('finished', handleFinished)
```

### Step 4. Launch the zkMe widget and it will be displayed in the center of your webpage.

``` javascript
zkMeWidget.launch()
```

## Helper functions

### verifyWithZkMeServices()

Before launching the widget you should check the zkKYC/MeID status of the user and launch the widget when the check result is ``false``.

``` typescript
import { verifyWithZkMeServices } from '@zkmelabs/widget'

const results: boolean = await verifyWithZkMeServices(
  appId,
  userAccount
)

if (!results) {
  zkMeWidget.launch()
}
```

| Param            | Type               | Description                                             |
|------------------|--------------------|---------------------------------------------------------|
| appId            | string             | This parameter means the same thing as "mchNo"          |
| userAccount      | string             | Same value as in ``provider.getUserAccounts``           |
| lv               | VerificationLevel? | ``"zkKYC"`` or ``"Anti-Sybil"``, default ``"zkKYC"``    |

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
on(event: 'finished', callback: FinishedHook): void;
on(event: 'close', callback: () => void): void;

type FinishedHook = (verifiedAccount: string, kycResults?: KycResults) => void;
type KycResults = 'matching' | 'mismatch';
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
