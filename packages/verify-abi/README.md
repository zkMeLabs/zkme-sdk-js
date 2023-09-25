# zkMe Verify & Certify Smart Contract ABI

A simple NPM package that exports the Smart Contract ABI for zkMe Verify & Certify.

## Installation
``` shell
pnpm add @zkmelabs/verify-abi

# or
yarn add @zkmelabs/verify-abi

# or
npm install @zkmelabs/verify-abi
```

## Example of Goerli test network
``` typescript
import zkMeVerifyAbi from '@zkmelabs/verify-abi'
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
