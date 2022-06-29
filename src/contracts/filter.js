import ABI                                                 from './abi/filter_contract.json'
import {CONTRACT_ADDRESS, ENTRYPOINT_NODE_ADDR, SEPARATOR} from '../helpers/config'
import Logger                                              from '../helpers/logger'
import Web3   from 'web3'

Logger.init({env: 'dev', logLevel: 'error'})
const utils = Web3.utils

export function getFilterContract(web3) {
  if (!web3) {
    Logger.throwArgumentError('Invalid web3', 'web3', web3)
  }
  return new web3.eth.Contract(ABI, CONTRACT_ADDRESS.FILTER)
}

export function getEncodedFilterData(contract, newLevel = 0) {
  if (!contract) {
    Logger.throwArgumentError('Invalid filter contract', 'contract', contract)
  }
  
  const encoded = contract.methods.setFilterLevel(newLevel).encodeABI()
  const data = SEPARATOR.concat(utils.hexToBytes(ENTRYPOINT_NODE_ADDR)).concat(utils.hexToBytes(encoded))

  return utils.bytesToHex(data)
}
