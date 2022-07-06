import * as Core                                 from './core'
import {getFeeContract, getEncodedFeeData}       from './contracts/fee'
import {getFilterContract, getEncodedFilterData} from './contracts/filter'
import {getKycContract, getEncodedKycData}       from './contracts/kyc'
import {defineReadOnly}                          from './helpers/utils'
import Logger                                    from './helpers/logger'
import {
  CONTRACT_ADDRESS,
  DEFAULT_GAS_LIMIT,
  DEFAULT_KYC_VALUE,
  SEPARATOR,
  ENTRYPOINT_NODE_ADDRESS,
  DEFAULT_NODE_URL
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
   * Creating a Wallet instance.
   */
  constructor() {
    this.web3 = new Web3(new Web3.providers.HttpProvider(DEFAULT_NODE_URL))
    this.provider = this.web3 ? this.web3.eth : null
    this.address = null
  }
  
  /**
   * Creates a Web3 provider.
   * @param {string} nodeUrl - Url of a Graphite http provider.
   */
  connect(nodeUrl) {
    if (!nodeUrl) {
      Logger.throwArgumentError('The nodeUrl is a required parameter', 'nodeUrl', nodeUrl)
    }
    this.web3 = new Web3(new Web3.providers.HttpProvider(nodeUrl))
  }
  
  /**
   * Creates a new wallet by a mnemonic phrase.
   * @param {string} phrase - Mnemonic phrase.
   * @returns {this}
   */
  fromMnemonic(phrase) {
    const {mnemonic, privateKey, publicKey, address} = Core.getWalletFromMnemonic(phrase)
    this.#setWalletData(mnemonic, privateKey, publicKey, address)
    
    return this
  }
  
  /**
   * Creates a new wallet by a Graphite private key.
   * @param {string} privateKey - Graphite private key in hex.
   */
  fromPrivateKey(privateKey) {
    const {publicKey, address} = Core.getWalletFromKey(privateKey)
    this.#setWalletData(null, privateKey, publicKey, address)
    
    return this
  }
  
  /**
   * Generate a random mnemonic.
   * @param {number} wordCount - The number of words in a new mnemonic phrase.
   */
  createRandom(wordCount) {
    const mnemonic = Core.generateNewMnemonic(wordCount)
    this.fromMnemonic(mnemonic)
    
    return this
  }
  
  /**
   * Sets the basic data for the wallet.
   * @param {string} mnemonic - Mnemonic phrase.
   * @param {string} privateKey - Graphite private key in hex.
   * @param {string} publicKey - Graphite public key in hex.
   * @param {string} address - Wallet address.
   */
  #setWalletData(mnemonic, privateKey, publicKey, address) {
    this.address = address
    defineReadOnly(this, '_mnemonic', () => mnemonic)
    defineReadOnly(this, '_privateKey', () => privateKey)
    defineReadOnly(this, '_publicKey', () => publicKey)
  }
  
  /**
   * Creates contract instances.
   * A connection to a Web3 provider is required.
   */
  createContracts() {
    this.feeContract = getFeeContract(this.web3)
    this.filterContract = getFilterContract(this.web3)
    this.kycContract = getKycContract(this.web3)
  }
  
  /**
   * Creates and sings a transaction with the specified parameters.
   * @param {string} to - Recipient's address.
   * @param {number} gasLimit - The amount of gas to use for the transaction.
   * @param {number} gasPrice - The price of gas for this transaction in wei.
   * @param {number} nonce - Transaction count. This allows to overwrite your own pending transactions that use the same nonce.
   * @param {number} value - The value transferred for the transaction in wei.
   * @param {string} data (optional) - Either a ABI byte string containing the data of the function call on a contract, or in the case of a contract-creation transaction the initialisation code.
   * @returns {Promise<string>} Raw Graphite transaction in hex string.
   */
  async signTransaction({to, gasLimit, gasPrice, nonce, value, data}) {
    let txData
    
    if (data) {
      txData = SEPARATOR.concat(utils.hexToBytes(ENTRYPOINT_NODE_ADDRESS)).concat(utils.hexToBytes(data))
    } else {
      txData = SEPARATOR.concat(utils.hexToBytes(ENTRYPOINT_NODE_ADDRESS))
    }
    
    try {
      const transaction = await this.provider.accounts.signTransaction({
          from: this.address,
          data: utils.bytesToHex(txData),
          gasLimit: utils.numberToHex(gasLimit),
          gasPrice: utils.numberToHex(gasPrice),
          value,
          to,
          nonce
        },
        this.privateKey
      )
      
      return transaction.rawTransaction
    }
    catch (e) {
      Logger.throwError(e.message, Logger.errors.TRANSACTION_FAILED)
    }
  }
  
  /**
   * Sings and sends a transaction with the specified parameters.
   * @param {string} to - Recipient's address.
   * @param {number} gasLimit - The amount of gas to use for the transaction.
   * @param {number} gasPrice - The price of gas for this transaction in wei.
   * @param {number} nonce - Transaction count. This allows to overwrite your own pending transactions that use the same nonce.
   * @param {number} value - The value transferred for the transaction in wei.
   * @param {string} data (optional) - Either a ABI byte string containing the data of the function call on a contract, or in the case of a contract-creation transaction the initialisation code.
   * @returns {Promise<Object>}  A promise combined event emitter. Will be resolved when the transaction receipt is available.
   */
  async signAndSendTransaction({to, gasLimit, gasPrice, value, data, nonce}) {
    const rawTx = await this.signTransaction({to, gasLimit, gasPrice, nonce, value, data})
    
    return this.sendTransaction(rawTx)
  }
  
  /**
   * Sends a raw Graphite transaction.
   * @param {string} rawTx - Transaction in hex string.
   * @returns {Promise<Object>} A promise combined event emitter. Will be resolved when the transaction receipt is available.
   */
  async sendTransaction(rawTx) {
    try {
      return this.provider.sendSignedTransaction(rawTx)
    }
    catch (e) {
      Logger.throwArgumentError(e.message, 'rawTx', rawTx)
    }
  }
  
  /**
   * Returns the wallet activation status.
   * @returns {Promise<boolean>} True if the account is activated. False if it isn't.
   */
  async getActivationStatus() {
    return await this.feeContract.methods.paidFee(this.address).call()
  }
  
  /**
   * Request for account activation.
   * There must be funds on the wallet balance. The commission for account activation is gasPrice (from network) * DEFAULT_GAS_LIMIT (300000)
   * @returns {Promise<Object>} A promise combined event emitter. Will be resolved when the transaction receipt is available.
   */
  async activateAccount() {
    if (!this.feeContract) {
      this.createContracts()
    }
    const activated = await this.getActivationStatus()
    
    if (activated) {
      Logger.throwError('This account is already activated', Logger.errors.ACCOUNT_ALREADY_ACTIVATED)
    }
    
    try {
      const gasPrice = await this.provider.getGasPrice()
      const nonce = await this.provider.getTransactionCount(this.address)
      const data = getEncodedFeeData(this.feeContract)
      const transaction = await this.provider.accounts.signTransaction(
        {
          from: this.address,
          to: CONTRACT_ADDRESS.FEE,
          gasLimit: utils.numberToHex(DEFAULT_GAS_LIMIT),
          gasPrice: utils.numberToHex(gasPrice),
          data,
          nonce
        },
        this.privateKey
      )
      
      return this.sendTransaction(transaction.rawTransaction)
    }
    catch (e) {
      Logger.throwError(e.message, Logger.errors.ACTIVATION_FAILED)
    }
  }
  
  /**
   * Returns the wallet filter level.
   * @returns {Promise<string>} Integer in string format.
   */
  async getFilterLevel() {
    if (!this.filterContract) {
      this.createContracts()
    }
    
    return this.filterContract.methods.viewFilterLevel().call({from: this.address})
  }
  
  /**
   * Request to update the account filter level.
   * The wallet must be activated and there must be funds on it for the commission.
   * @params {number} newLevel - New filter level.
   * @returns {Promise<Object>} A promise combined event emitter. Will be resolved when the transaction receipt is available.
   */
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
  
  /**
   * Returns the wallet KYC level.
   * @returns {Promise<string>} Integer in string format.
   */
  async getKycLevel() {
    if (!this.kycContract) {
      this.createContracts()
    }
    
    return this.kycContract.methods.level(this.address).call()
  }
  
  /**
   * Returns the last request to change the KYC level.
   * @returns {Promise<Object>} Last request.
   */
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
  
  /**
   * Request to update the account KYC level.
   * The wallet must be activated and there must be funds on it for the commission.
   * @params {number} newLevel - New KYC level.
   * @returns {Promise<Object>} A promise combined event emitter. Will be resolved when the transaction receipt is available.
   */
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
  
  get mnemonic() {
    return this._mnemonic()
  }
  
  get privateKey() {
    return this._privateKey()
  }
  
  get publicKey() {
    return this._publicKey()
  }
}
