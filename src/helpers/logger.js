import packageJson from '../../package.json'

export const ErrorCode = {
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  BAD_MNEMONIC: 'BAD_MNEMONIC',
  EMPTY_WALLET: 'EMPTY_WALLET',
  ACCOUNT_ALREADY_ACTIVATED: 'ACCOUNT_ALREADY_ACTIVATED',
  ACCOUNT_NOT_ACTIVATED: 'ACCOUNT_NOT_ACTIVATED',
}

let instance
const logLevels = ['error', 'warn', 'info', 'log', 'debug']

export class Logger {
  errors = ErrorCode
  version = packageJson.version
  
  constructor() {
    if (!instance) {
      instance = this
    }
    return instance
  }
  
  init({env, logLevel}) {
    try {
      this.env = env || 'dev'
      this.logLevel = logLevel || 'error'
    }
    catch (e) {
      console.error(e)
    }
  }
  
  shouldLog(method) {
    const appLogLevel = logLevels.findIndex((f) => f === this.logLevel)
    const methodLogLevel = logLevels.findIndex((f) => f === method)
    return methodLogLevel <= appLogLevel
  }
  
  send(method, ...args) {
    try {
      if (this.shouldLog(method)) {
        console.log.apply(console, args)
      }
    }
    catch (e) {
      console.error(e)
    }
  }
  
  makeError(message, code, params) {
    if (!code) {
      code = this.errors.UNKNOWN_ERROR
    }
    if (!params) {
      params = {}
    }
    const messageDetails = []
    
    for (let key in params) {
      const value = params[key]
      try {
        if (value instanceof Uint8Array) {
          let hex = ''
          for (let i = 0; i < value.length; i++) {
            hex += HEX[value[i] >> 4]
            hex += HEX[value[i] & 0x0f]
          }
          messageDetails.push(key + '=Uint8Array(0x' + hex + ')')
        } else {
          messageDetails.push(key + '=' + JSON.stringify(value))
        }
      }
      catch (error) {
        messageDetails.push(key + '=' + JSON.stringify(params[key].toString()))
      }
    }
    messageDetails.push(`code=${ code }`)
    messageDetails.push(`version=${ this.version }`)
    const reason = message
    
    if (messageDetails.length) {
      message += ' (' + messageDetails.join(', ') + ')'
    }
    
    const error = new Error(message)
    error.reason = reason
    error.code = code
    
    Object.keys(params).forEach(function(key) {
      error[key] = params[key]
    })
    
    return error
  }
  
  throwError(message, code, params) {
    throw this.makeError(message, code, params)
  }
  
  throwArgumentError(message, name, value) {
    return this.throwError(message, this.errors.INVALID_ARGUMENT, {
      argument: name,
      value: value
    })
  }
  
  log(...args) {
    return this.send('log', ...args)
  }
  
  error(...args) {
    return this.send('error', ...args)
  }
  
  warn(...args) {
    return this.send('warn', ...args)
  }
  
  info(...args) {
    return this.send('info', ...args)
  }
  
  debug(...args) {
    return this.send('debug', ...args)
  }
}

export default new Logger()
