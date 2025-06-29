import { Link } from './ref'

interface Fn {
  (...args: any[]): any
}

export let activeSub: ReactiveEffect | undefined

export class ReactiveEffect {
  deps: Link
  depsTail: Link
  fn: Fn
  constructor(fn: Fn) {
    this.fn = fn
  }
}

export function effect(fn: Fn) {
  activeSub = new ReactiveEffect(fn)
  fn()
  activeSub = undefined
}
