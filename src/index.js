import {Wallet} from './wallet.js'
import Web3     from 'web3'
import * as FeeContract from './contracts/fee'
import * as FilterContract from './contracts/filter'
import * as KycContract from './contracts/kyc'
// provider
const utils = Web3.utils

export {
  Wallet,
  FeeContract,
  FilterContract,
  KycContract,
  utils
}

