export function defineReadOnly(object, name, value) {
  Object.defineProperty(object, name, {
    value: value,
    writable: false,
    enumerable: true,
    configurable: false
  })
}
