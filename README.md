# graphite-lib

A library for working with a Graphite cryptocurrency.

## Installation (soon)

``` console
npm install graphite-lib
# or
yarn add graphite-lib
```

## Supported Environments

- Node.js >= v16.15.0
- npm >= 8.5.0
- yarn >= 1.15.0

## Getting Started

The library allows you to create a new wallet or import wallet from a mnemonic/private key.

```js
import {Wallet, utils, FeeContract, FilterContract, KycContract} from 'graphite-lib'
```

To create a new Wallet you need to call `createRandom` method. Default word count for new wallet is 15 words.

```js
import {Wallet} from 'graphite-lib'

const wallet = new Wallet()
const wordCount = 21
wallet.createRandom(wordCount) // Takes values equal to 12, 15, 18, 21 or 24
// => {
//   mnemonic: 'new mnemonic ...',
//   address: '0xAE9E7967Dc4...',
//   privateKey: '0x8eee191b5824...',
//   publicKey: 'f9588986d85ad35da07228acd...',
//   provider // web3 provider
// }
```
You can connect to your own node using method `.connect()`. Only non-anonymous nodes are allowed.
```js
const nodeUrl = 'http://...'
wallet.connect(nodeUrl)
```

You can also import wallet from a mnemonic or a Graphite private key.

```js
const wallet = new Wallet()
const mnemonic = 'kite pencil ...'
wallet.fromMnemonic(mnemonic)

// or

const privateKey = '0x8eee191b5824eb9f...'
wallet.fromPrivateKey(privateKey)
```

## Sending transaction

```js
const nonce = await wallet.provider.getTransactionCount(wallet.address)
const rawTx = await wallet.signTransaction({
  to: '0x5e2FE9Fda4cd5F6F...',
  gasLimit: 300000,
  gasPrice: 20000000000,
  value: 10000000000000000000,
  nonce
})
// => '0xf8840a8504a817c800830493e0945e2fe9fda4cd5f6f...'

const tx = await wallet.sendTransaction(rawTx)
// => {
//   blockHash: "0x715367917e04967dafbf7c54b60f...",
//   blockNumber: 4718,
//   transactionHash: "0x2e964c31fe21f55cb3ef8d7599...",
//   ...
// }

// or you can use .signAndSendTransaction() method instead

const tx = await wallet.signAndSendTransaction({
  to: '0x5e2FE9Fda4cd5F6F...',
  gasLimit: 300000,
  gasPrice: 20000000000,
  value: 10000000000000000000,
  nonce
})
```

## Provider

When creating a class, the provider will be available to you to access the network. Based
on web3 provider.
    
```js
const wallet = new Wallet()

await wallet.provider.getBlockNumber() // => 4718
await wallet.provider.getGasPrice() // => '20000000000'
```

## Contracts

Wallet provides access to Graphite contracts. To create contracts, call method `.createContracts()`

```js
wallet.createContracts()
// wallet.feeContract - Contract for account activation
// wallet.filterContract - Contract for managing account filters
// wallet.kycContract - Contract for managing KYC levels
```

### Account activation

To activate the account, the wallet must have funds. Gas limit for account activation is 300000 Gwei.

```js
const status = await wallet.getActivationStatus()
// > false - account is not activated
//   true - account is activated

const tx = await wallet.activateAccount()
// Will return the transaction upon successful activation
```

### Filters

To get current filter level, use `.getFilterLevel()`.
```js
const level = await wallet.getFilterLevel()
// > 0
```

To change filter level, use .updateFilterLevel(newLevel)
```js
const tx = await wallet.updateFilterLevel(1)
```

### KYC

To get current KYC level, use `.getKycLevel()`.
```js
const level = await wallet.getKycLevel()
// > 0
```

To change filter level, use `.updateKycLevel(newLevel)`
```js
const tx = await wallet.updateKycLevel(1)
```

To get the last request, call the method `.viewMyLastKycRequest()`
```js
const lastRequest = await wallet.viewMyLastKycRequest()
```

## Re-Exports

- [web3 utils](https://github.com/ChainSafe/web3.js)

## Tests

```console
$ npm run test
```

## Dev installation

Download this repository. On command line, type in the following commands:

```console
$ cd graphite-lib
$ npm i
$ npm run build
$ npm link 
```

Go to a necessary project. Add a graphite-lib like a local dependency:

```console
$ cd another-project
$ npm link 'graphite-lib'
```
