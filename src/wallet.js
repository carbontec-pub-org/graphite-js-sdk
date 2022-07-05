import * as Core                                 from './core'
import {getFeeContract, getEncodedFeeData}       from './contracts/fee'
import {getFilterContract, getEncodedFilterData} from './contracts/filter'
import {getKycContract, getEncodedKycData}       from './contracts/kyc'
import {defineReadOnly} from './helpers/utils'
import Logger                                    from './helpers/logger'
import {wordlists} from 'bip39'
console.log('wordlists', wordlists)
import {
  CONTRACT_ADDRESS,
  DEFAULT_GAS_LIMIT,
  DEFAULT_KYC_VALUE,
  SEPARATOR,
  ENTRYPOINT_NODE_ADDRESS
}                                                from './helpers/config'

import Web3 from 'web3'

const utils = Web3.utils

Logger.init({env: 'dev', logLevel: 'error'})

/**
 * Class Wallet
 * @class
 */

export class Wallet {
  _mnemonic = () => null
  _privateKey = () => null
  _publicKey = () => null
  feeContract = null
  kycContract = null
  filterContract = null
  
  /**
   * Creating a Wallet instance
   * @param {string} nodeUrl - Url of a Graphite http provider
   */
  constructor(nodeUrl) {
    this.web3 = nodeUrl ? new Web3(new Web3.providers.HttpProvider(nodeUrl)) : null
    this.provider = this.web3 ? this.web3.eth : null
    this.address = null
  }
  
  get mnemonic() {
    return this._mnemonic()
  }
  
  get privateKey() {
    return this._privateKey()
  }
  
  get publicKey() {
    return this._publicKey()
  }
  
  fromMnemonic(phrase, wordlist) {
    const {mnemonic, privateKey, publicKey, address} = Core.getWalletFromMnemonic(phrase)
    this.#setWalletData(mnemonic, privateKey, publicKey, address)
    
    return this
  }
  
  fromPrivateKey(privateKey) {
    const {publicKey, address} = Core.getWalletFromKey(privateKey)
    this.#setWalletData(null, privateKey, publicKey, address)
    
    return this
  }
  
  /**
   * Generate a random mnemonic
   */
  createRandom(wordCount) {
    const mnemonic = Core.generateNewMnemonic(wordCount)
    this.fromMnemonic(mnemonic)
    
    return this
  }
  
  #setWalletData(mnemonic, privateKey, publicKey, address) {
    this.address = address
    defineReadOnly(this, '_mnemonic', () => mnemonic)
    defineReadOnly(this, '_privateKey', () => privateKey)
    defineReadOnly(this, '_publicKey', () => publicKey)
  }
  
  createContracts() {
    this.feeContract = getFeeContract(this.web3)
    this.filterContract = getFilterContract(this.web3)
    this.kycContract = getKycContract(this.web3)
  }
  
  async signTransaction({to, gasLimit, gasPrice, gas, nonce, value, data}) {
    let txData
    
    if (data) {
      txData = SEPARATOR.concat(utils.hexToBytes(ENTRYPOINT_NODE_ADDRESS)).concat(utils.hexToBytes(data))
    } else {
      txData = SEPARATOR.concat(utils.hexToBytes(ENTRYPOINT_NODE_ADDRESS))
    }
    
    const transaction = await this.provider.accounts.signTransaction(
      {
        from: this.address,
        gas: gas ? utils.numberToHex(gas) : '',
        gasLimit: gasLimit ? utils.numberToHex(gasLimit) : '',
        gasPrice: gasPrice ? utils.numberToHex(gasPrice) : '',
        data: utils.bytesToHex(txData),
        value,
        to,
        nonce
      },
      this.privateKey
    )
    
    return transaction.rawTransaction
  }
  
  async signAndSendTransaction({to, gasLimit, gasPrice, value, data}) {
    const rawTx = await this.signTransaction({to, gasLimit, gasPrice, value, data})
    
    return this.sendTransaction(rawTx)
  }
  
  async sendTransaction(rawTx) {
    try {
      return this.provider.sendSignedTransaction(rawTx)
    }
    catch (e) {
      Logger.throwArgumentError(e.message, 'rawTx', rawTx)
    }
  }
  
  async getActivationStatus() {
    return await this.feeContract.methods.paidFee(this.address).call()
  }
  
  async activateAccount() {
    if (!this.feeContract) {
      this.createContracts()
    }
    const activated = await this.getActivationStatus()
    
    if (activated) {
      Logger.throwError('This account is already activated', Logger.errors.ACCOUNT_ALREADY_ACTIVATED)
    }
    
    const gasPrice = await this.provider.getGasPrice()
    const nonce = await this.provider.getTransactionCount(this.address)
    const data = getEncodedFeeData(this.feeContract)
    
    const transaction = await this.provider.accounts.signTransaction(
      {
        from: this.address,
        to: CONTRACT_ADDRESS.FEE,
        gasLimit: utils.numberToHex(DEFALT_GAS_LIMIT),
        gasPrice: utils.numberToHex(gasPrice),
        data,
        nonce
      },
      this.privateKey
    )
    
    return this.sendTransaction(transaction.rawTransaction)
  }
  
  async getFilterLevel() {
    if (!this.filterContract) {
      this.createContracts()
    }
    
    return this.filterContract.methods.viewFilterLevel().call({from: this.address})
  }
  
  async updateFilterLevel(newLevel = 0) {
    if (!Number.isInteger(newLevel)) {
      Logger.throwArgumentError('The newLevel must be an integer', 'newLevel', newLevel)
    }
    if (!this.filterContract) {
      this.createContracts()
    }
    
    const activated = await this.getActivationStatus()
    if (!activated) {
      Logger.throwError('You need to activate your account before changing the filter level', Logger.errors.ACCOUNT_NOT_ACTIVATED)
    }
    
    const gasPrice = await this.provider.getGasPrice()
    const nonce = await this.provider.getTransactionCount(this.address)
    const data = getEncodedFilterData(this.filterContract, newLevel)
    const transaction = await this.provider.accounts.signTransaction(
      {
        from: this.address,
        to: CONTRACT_ADDRESS.FILTER,
        gasLimit: utils.numberToHex(DEFAULT_GAS_LIMIT),
        gasPrice: utils.numberToHex(gasPrice),
        data,
        nonce
      },
      this.privateKey)
    
    return this.sendTransaction(transaction.rawTransaction)
  }
  
  async getKycLevel() {
    if (!this.kycContract) {
      this.createContracts()
    }
    
    return this.kycContract.methods.level(this.address).call()
  }
  
  async viewMyLastKycRequest() {
    if (!this.kycContract) {
      this.createContracts()
    }
    
    return this.kycContract.methods.viewMyLastRequest().call({from: this.address})
  }
  
  async repairLostKycRequest() {
    if (!this.kycContract) {
      this.createContracts()
    }
    
    return this.kycContract.methods.repairLostRequest().call({from: this.address})
  }
  
  async updateKycLevel(newLevel = 0) {
    if (!Number.isInteger(newLevel)) {
      Logger.throwArgumentError('The newLevel must be an integer', 'newLevel', newLevel)
    }
    if (!this.kycContract) {
      this.createContracts()
    }
    
    const activated = await this.getActivationStatus()
    if (!activated) {
      Logger.throwError('You need to activate your account before changing the KYC level', Logger.errors.ACCOUNT_NOT_ACTIVATED)
    }
    
    const gasPrice = await this.provider.getGasPrice()
    const nonce = await this.provider.getTransactionCount(this.address)
    const data = getEncodedKycData(this.kycContract, newLevel)
    
    const transaction = await this.provider.accounts.signTransaction(
      {
        from: this.address,
        to: CONTRACT_ADDRESS.KYC,
        gasLimit: utils.numberToHex(DEFAULT_GAS_LIMIT),
        gasPrice: utils.numberToHex(gasPrice),
        value: utils.numberToHex(DEFAULT_KYC_VALUE),
        data,
        nonce
      },
      this.privateKey
    )
    
    return this.sendTransaction(transaction.rawTransaction)
  }
}
