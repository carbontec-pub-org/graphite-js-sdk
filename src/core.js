import {generateMnemonic, validateMnemonic, mnemonicToSeedSync} from 'bip39'
import {fromMasterSeed}                                         from 'hdkey'
import {Address, privateToPublic}                               from 'ethereumjs-util'
import Web3                                                     from 'web3'
import Logger                                                   from './helpers/logger.js'

Logger.init({env: 'dev', logLevel: 'error'})
const PATH = `m/44'/60'/0'/0/0`

export function generateNewMnemonic(wordCount = 15) {
  const bitsOfEntropy = {
    12: 128,
    15: 160,
    18: 192,
    21: 224,
    24: 256
  }
  
  if (!bitsOfEntropy.hasOwnProperty(+wordCount)) {
    Logger.throwArgumentError('Invalid words count', 'wordsCount', wordCount)
  }
  
  try {
    return generateMnemonic(bitsOfEntropy[wordCount])
  }
  catch (e) {
    Logger.throwError(e.message, Logger.errors.BAD_MNEMONIC)
  }
}

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

export function getAddressFromPublicKey(publicKey) {
  try {
    const address = Address.fromPublicKey(publicKey)
    
    return Web3.utils.toChecksumAddress(address.toString())
  }
  catch (e) {
    Logger.throwArgumentError(e.message, 'publicKey', publicKey)
  }
}
