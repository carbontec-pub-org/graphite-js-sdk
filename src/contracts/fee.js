import ABI    from './abi/activation_contract.json'
import {
  SEPARATOR,
  ENTRYPOINT_NODE_ADDR,
  CONTRACT_ADDRESS
}             from '../helpers/config'
import Logger from '../helpers/logger'
import Web3   from 'web3'

Logger.init({env: 'dev', logLevel: 'error'})
const utils = Web3.utils

export function getFeeContract(web3) {
  if (!web3) {
    Logger.throwArgumentError('Invalid web3', 'web3', web3)
  }
  return new web3.eth.Contract(ABI, CONTRACT_ADDRESS.FEE)
}

export function getEncodedFeeData(contract) {
  if (!contract) {
    Logger.throwArgumentError('Invalid fee contract', 'contract', contract)
  }
  
  const tx = contract.methods.pay()
  const methodEncoded = tx.encodeABI()
  const data = SEPARATOR.concat(utils.hexToBytes(ENTRYPOINT_NODE_ADDR)).concat(utils.hexToBytes(methodEncoded))
  
  return utils.bytesToHex(data)
}

//
// export class FeeContract {
//   constructor(web3) {
//     this.web3 = web3
//     this.contract = null
//     this.#createContract()
//   }
//
//   #createContract() {
//     this.contract = new this.web3.eth.Contract(ABI, CONTRACT_ADDRESS.FEE)
//   }
//
//   getEncodedFeeData() {
//     if (!this.contract) this.#createContract()
//
//     const tx = this.contract.methods.pay()
//     const methodEncoded = tx.encodeABI()
//     const data = SEPARATOR.concat(this.web3.utils.hexToBytes(ENTRYPOINT_NODE_ADDR)).concat(this.web3.utils.hexToBytes(methodEncoded))
//
//     return this.web3.utils.bytesToHex(data)
//   }
//
//   async checkAccountActivation(address) {
//     if (!this.contract) this.#createContract()
//
//     return await this.contract.methods.paidFee(address).call()
//   }
// }

