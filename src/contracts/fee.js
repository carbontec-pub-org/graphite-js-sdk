import ABI    from './abi/activation_contract.json'
import {
  SEPARATOR,
  ENTRYPOINT_NODE_ADDRESS,
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
  const data = SEPARATOR.concat(utils.hexToBytes(ENTRYPOINT_NODE_ADDRESS)).concat(utils.hexToBytes(methodEncoded))
  
  return utils.bytesToHex(data)
}

