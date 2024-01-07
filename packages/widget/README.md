# zkMe zkKYC and Anti-Sybil SDK

zkMe zkKYC and Anti-Sybil SDK.

## Getting Started

1. Installation.
``` shell
pnpm add @zkmelabs/widget

# or
yarn add @zkmelabs/widget

# or
npm install @zkmelabs/widget
```

2. Import styles.
``` javascript
import '@zkmelabs/widget/dist/style.css'
```

3. Create a new ``ZkMeWidget`` instance.
``` javascript
import { ZkMeWidget, type Provider } from '@zkmelabs/widget'

const provider: Provider = {
  async getAccessToken() {
    // Request a new token from your backend service and return it to the widget.
    // For the access token, see https://docs.zk.me/zkme-dochub/zkkyc-compliance-suite/integration-guide/widget-sdk-integration#usage-example
    return fetchNewToken()
  },

  async getUserAccounts() {
    // If your project is a Dapp,
    // you need to return the user's connected wallet address.
    if (!userConnectedAddress) {
      userConnectedAddress = await connect()
    }
    return [userConnectedAddress]

    // If your project is a Web2 project and the KYC program configured
    // in the zkMe dashboard does not contain Identity verification,
    // you can return the user's email address, phone number, or any other unique identifier.
    //
    // return ['email address']
    // or
    // return ['phone number']
    // or
    // return ['unique identifier']
  },

  // The following methods implement one of these
  // depending on the type of blockchain your project is running on.

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
  appId,
  'Your Dapp name',
  chainId,
  provider
)
```

4. Launch the zkMe widget and it will be displayed in the center of your webpage.
``` javascript
zkMeWidget.launch()
```

5. Listen to the ``finished`` widget events to detect when the user has completed the KYC process.
``` typescript
import { verifyKYCWithZkMeServices } from '@zkmelabs/widget'

type KycResults = 'matching' | 'mismatch'

function handleFinished(verifiedAddress: string, kycResults: KycResults) {
  // We recommend that you double-check this by calling the functions mentioned in the "Helper functions" section.
  if (
    kycResults === 'matching' &&
    verifiedAddress === userConnectedAddress
  ) {
    const results = await verifyKYCWithZkMeServices(appId, userConnectedAddress)
    if (results) {
      // Prompts the user that KYC verification has been completed
    }
  }
}

zkMeWidget.on('finished', handleFinished)
```

## Helper functions

Before launching the widget you should check the KYC status of the user and launch the widget when the check result is ``false``.

``` typescript
import { verifyKYCWithZkMeServices } from '@zkmelabs/widget'

const results: boolean = await verifyKYCWithZkMeServices(
  appId, // This parameter means the same thing as "mchNo"
  userAccount // Same value as in provider.getUserAccounts
)

if (!results) {
  zkMeWidget.launch()
}

```
You can also get a way to query a user's KYC status from a Smart Contract [here](https://github.com/zkMeLabs/zkme-sdk-js/tree/main/packages/verify-abi#readme).
