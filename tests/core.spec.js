import {
  generateNewMnemonic,
  getWalletFromMnemonic,
  getWalletFromKey,
  getAddressFromPublicKey
} from '../src/core'

const testMnemonic = 'kite pencil vicious race demise verify trumpet slush still mother slot one try mutual group'
const testWallet = {
  address: '0xAE9E7967Dc4A61A82B2A5cE83344aD512754b7e2',
  privateKey: '0x8eee191b5824eb9fa4997b0c03f0e6ad35c401da430d01c0b84e01fe0077ab5e',
  publicKey: 'f9588986d85ad35da07228acd61849d463942f84383d8ead2969a94fdd1b4d5feef5f26d5e72dfea7c9cae6de52177371c13205f75e2de44dbc1bf8164541ed9'
}

describe('Core', () => {
  test('It should create a Wallet class from mnemonic', () => {
    const wallet = getWalletFromMnemonic(testMnemonic)
    expect(wallet.mnemonic).toEqual(testMnemonic)
    expect(wallet.address).toEqual(testWallet.address)
    expect(wallet.privateKey).toEqual(testWallet.privateKey)
    expect(wallet.publicKey).toEqual(testWallet.publicKey)
  })
  
  test('It should create a Wallet class from private key', () => {
    const wallet = getWalletFromKey(testWallet.privateKey)
    expect(wallet.address).toEqual(testWallet.address)
    expect(wallet.privateKey).toEqual(testWallet.privateKey)
    expect(wallet.publicKey).toEqual(testWallet.publicKey)
  })
  
  test('It should create a new wallet with 21 words', () => {
    const mnemonic = generateNewMnemonic(21)
    const length = mnemonic.split(' ').length
    expect(length).toEqual(21)
    
    const wallet = getWalletFromMnemonic(mnemonic)
    expect(wallet).toHaveProperty('mnemonic')
    expect(wallet).toHaveProperty('privateKey')
    expect(wallet).toHaveProperty('publicKey')
    expect(wallet).toHaveProperty('address')
  })
  
  test('It should throw an error for 14 words mnemonic', () => {
    try {
      const mnemonic = generateNewMnemonic(14)
    }
    catch (e) {
      expect(e.message).toContain('Invalid words count')
    }
  })
  
  test('It should create an address from public key', () => {
    const pubKeyBuffer = Buffer.from(testWallet.publicKey, 'hex')
    const address = getAddressFromPublicKey(pubKeyBuffer)
    expect(address).toEqual(testWallet.address)
  })
})
