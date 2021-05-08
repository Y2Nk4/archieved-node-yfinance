export function checkType(constructor: any, fn: Function, name: string, argLength:any = null) {
  if (fn !== undefined) {
    if (typeof fn != "function") {
      throw new TypeError(`Magic method ${constructor.name}.${name} must be defined as a function`)
    } else if (argLength !== undefined && fn.length !== argLength) {
      throw new SyntaxError(`Magic method ${constructor.name}.${name} must have ${argLength} parameter${argLength === 1 ? "" : "s"}`)
    }
  }
}

export function setProp(target, prop, value, writable: boolean = true) {
  Object.defineProperty(target, prop, {
    configurable: true,
    enumerable: false,
    writable: !!writable,
    value: value
  })
}

export function applyMagic(constructor: any) {
  function PsudoClass(...args) {
    if (typeof this == "undefined") { // function call
      let invoke = constructor.prototype.__invoke

      checkType(constructor, invoke, "__invoke")

      return invoke ? invoke(...args) : constructor(...args)
    } else {
      Object.assign(this, new constructor(...args))

      let get = this.__get,
        set = this.__set,
        has = this.__has,
        _delete = this.__delete

      checkType(new.target, get, "__get", 1)
      checkType(new.target, set, "__set", 2)
      checkType(new.target, has, "__has", 1)
      checkType(new.target, _delete, "__delete", 1)

      return new Proxy(this, {
        get: (target, prop) => {
          console.log('get', target, prop)
          return get ? get.call(target, prop) : target[prop]
        },
        set: (target, prop, value) => {
          set ? set.call(target, prop, value) : (target[prop] = value)
          return true
        },
        has: (target, prop) => {
          return has ? has.call(target, prop) : (prop in target)
        },
        deleteProperty: (target, prop) => {
          _delete ? _delete.call(target, prop) : (delete target[prop])
          return true
        }
      })
    }
  }

  Object.setPrototypeOf(PsudoClass, constructor)
  Object.setPrototypeOf(PsudoClass.prototype, constructor.prototype)

  setProp(PsudoClass, "name", constructor.name)
  setProp(PsudoClass, "length", constructor.length)
  setProp(PsudoClass, "toString", function toString() {
    let target = this === PsudoClass ? constructor : this
    return Function.prototype.toString.call(target)
  }, true)

  return PsudoClass
}
