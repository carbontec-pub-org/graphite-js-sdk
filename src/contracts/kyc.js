import ABI from './abi/kyc_contract.json'
import {CONTRACT_ADDRESS, ENTRYPOINT_NODE_ADDRESS, SEPARATOR} from '../helpers/config'
import Logger                                              from '../helpers/logger'
import Web3   from 'web3'

Logger.init({env: 'dev', logLevel: 'error'})
const utils = Web3.utils

export function getKycContract(web3) {
  if (!web3) {
    Logger.throwArgumentError('Invalid web3', 'web3', web3)
  }
  return new web3.eth.Contract(ABI, CONTRACT_ADDRESS.KYC)
}

export function getEncodedKycData(contract, newLevel = 0) {
  if (!contract) {
    Logger.throwArgumentError('Invalid KYC contract', 'contract', contract)
  }
  
  const levelData = '0x0000000000000000000000000000000000000000000000000000000000000000'
  const encoded = contract.methods.createKYCRequest(newLevel, levelData).encodeABI()
  const data = SEPARATOR.concat(utils.hexToBytes(ENTRYPOINT_NODE_ADDRESS)).concat(utils.hexToBytes(encoded))
  console.log('data', data)
  
  return utils.bytesToHex(data)
}
