import { Link } from './system'

export class Dep {
  subs: Link | undefined
  subsTail: Link | undefined
  _value
  constructor(dep) {
    this._value = dep
  }
}

export interface Sub {
  deps: Link | undefined
  depsTail: Link | undefined
  tracking: boolean
  dirty: boolean
}
