# zkMe Verify & Certify Smart Contract ABI

A simple NPM package that exports the Smart Contract ABI for zkMe Verify & Certify.

## Installation
``` shell
pnpm add @zkme/verify-abi

# or
yarn add @zkme/verify-abi

# or
npm install @zkme/verify-abi
```

## Example of Goerli test network
``` typescript
import zkMeVerifyAbi from '@zkme/verify-abi'
import { Contract, JsonRpcProvider } from 'ethers'

const zkMeContract = new Contract(
  '0xD231fF30102B34446035BA327ad4c596a5231cE3',
  zkMeVerifyAbi,
  new JsonRpcProvider(rpcUrl)
)

const results: boolean = await zkMeContract.hasApproved(
  dappAccount,
  userWalletAddress
)
```
