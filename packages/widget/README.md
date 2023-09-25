# zkMe zkKYC and Anti-Sybil SDK

## Getting Started

1. Installation.
``` shell
pnpm add @zkme/widget

# or
yarn add @zkme/widget

# or
npm install @zkme/widget
```

2. Import styles.
``` javascript
import '@zkme/widget/dist/style.css'
```

3. Create a new ``ZkMeWidget`` instance.
``` javascript
import { ZkMeWidget, type Provider } from '@zkme/widget'

const provider: Provider = {
  async getAccessToken() {
    // Request a new token from your backend service and return it to the widget
    return fetchNewToken()
  },
  async getUserAccounts() {
    if (!userConnectedAddress) {
      userConnectedAddress = await connect()
    }
    return [userConnectedAddress]
  },
  async delegateTransaction(tx) {
    const txResponse = await signer.sendTransaction(tx)
    return txResponse.hash
  },
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

## Helper functions

Before launching the zkMe widget, you may need to check the user's KYC status first

``` typescript
import { verifyKYCWithZkMeServices } from '@zkme/widget'

const results: boolean = await verifyKYCWithZkMeServices(
  appId, // This parameter means the same thing as "mchNo"
  userAccount // User's wallet address
)

```