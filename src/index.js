import {Wallet} from './wallet.js'
import * as FeeContract from './contracts/fee'
import * as FilterContract from './contracts/filter'
import * as KycContract from './contracts/kyc'
import Web3 from 'web3'

const provider = Web3.providers
const utils = Web3.utils

export {
  Wallet,
  FeeContract,
  FilterContract,
  KycContract,
  utils,
  provider
}

