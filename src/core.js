import {generateMnemonic, validateMnemonic, mnemonicToSeedSync, wordlists} from 'bip39'
import {fromMasterSeed}                                         from 'hdkey'
import {Address, privateToPublic}                               from 'ethereumjs-util'
import Web3                                                     from 'web3'
import Logger                                                   from './helpers/logger.js'

Logger.init({env: 'dev', logLevel: 'error'})
const PATH = `m/44'/60'/0'/0/0`

/**
 * Generates a new mnemonic for a given number of words.
 * By default, 15 words.
 * @param {number} wordsCount - Available options are 12, 15, 18, 21 or 24 words.
 * @returns {string} Mnemonic phrase
 */
export function generateNewMnemonic(wordsCount = 15) {
  const bitsOfEntropy = {
    12: 128,
    15: 160,
    18: 192,
    21: 224,
    24: 256
  }
  
  if (!bitsOfEntropy.hasOwnProperty(+wordsCount)) {
    Logger.throwArgumentError('Invalid count of words', 'wordsCount', wordsCount)
  }
  
  try {
    return generateMnemonic(bitsOfEntropy[wordsCount])
  }
  catch (e) {
    Logger.throwError(e.message, Logger.errors.BAD_MNEMONIC)
  }
}

/**
 * Returns the necessary information about the Graphite wallet by the mnemonic
 * @param {string} mnemonic - Mnemonic phrase
 * @returns {Object} wallet instance
 * @returns {string} wallet.mnemonic - Mnemonic phrase
 * @returns {string} wallet.address - Graphite address
 * @returns {string} wallet.privateKey - Graphite private key
 * @returns {string} wallet.publicKey - Graphite public key
 */
export function getWalletFromMnemonic(mnemonic) {
  try {
    mnemonic = mnemonic?.toLowerCase()
    if (!mnemonic || !validateMnemonic(mnemonic)) {
      Logger.throwArgumentError('Invalid mnemonic', 'mnemonic', mnemonic)
    }
    
    const seed = mnemonicToSeedSync(mnemonic)
    const hdwallet = fromMasterSeed(seed)
    const node = hdwallet.derive(PATH)
    const publicKey = privateToPublic(node._privateKey) // fix?
    const address = getAddressFromPublicKey(publicKey)
    
    return {
      mnemonic,
      address,
      privateKey: '0x' + node._privateKey.toString('hex'),
      publicKey: publicKey.toString('hex')
    }
  }
  catch (e) {
    Logger.throwArgumentError(e.message, 'mnemonic', mnemonic)
  }
}

/**
 * Returns the necessary information about a Graphite wallet by the private key
 * @param {string} privateKey - Graphite private key
 * @returns {Object} wallet instance
 * @returns {string} wallet.address - Graphite address
 * @returns {string} wallet.privateKey - Graphite private key
 * @returns {string} wallet.publicKey - Graphite public key
 */
export function getWalletFromKey(privateKey = '') {
  if (!privateKey) {
    Logger.throwArgumentError(Logger.errors.INVALID_ARGUMENT, 'privateKey', privateKey)
  }
  
  try {
    if (privateKey.startsWith('0x')) {
      privateKey = privateKey.slice(2)
    }
    const privateKeyBuffer = Buffer.from(privateKey, 'hex')
    const publicKey = privateToPublic(privateKeyBuffer)
    const address = getAddressFromPublicKey(publicKey)
    
    let finalPrivateKey = privateKey
    
    if (finalPrivateKey.startsWith('0x')) {
      privateKey = privateKey.slice(2)
    }
    return {
      address,
      privateKey: '0x' + privateKey,
      publicKey: publicKey.toString('hex')
    }
  }
  catch (e) {
    Logger.throwArgumentError(e.message, 'privateKey', privateKey)
  }
}

/**
 * Returns a Graphite address by the public key
 * @param {Buffer} publicKey - Graphite public key
 * @returns {string} address - Graphite address
 */
export function getAddressFromPublicKey(publicKey) {
  try {
    const address = Address.fromPublicKey(publicKey)
    
    return Web3.utils.toChecksumAddress(address.toString())
  }
  catch (e) {
    Logger.throwArgumentError(e.message, 'publicKey', publicKey)
  }
}
