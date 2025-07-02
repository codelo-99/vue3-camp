import { Link } from './ref'

type Fn = (...args: any[]) => any

export interface Sub {
  deps: Link | undefined
  depsTail: Link | undefined
}

export let activeSub: ReactiveEffect
export class ReactiveEffect implements Sub {
  deps: Link | undefined
  depsTail: Link | undefined
  constructor(public fn: Fn) {}
  run() {
    /**
     * prevSub 解决effect嵌套调用, activeSub 指向问题
     */
    const prevSub = activeSub
    activeSub = this
    this.depsTail = undefined
    try {
      this.fn()
    } finally {
      activeSub = prevSub
    }
  }
  notify() {
    this.scheduler()
  }
  scheduler() {
    this.run()
  }
}

interface EffectOptions {
  scheduler?: Fn
}
export function effect(fn: Fn, options?: EffectOptions) {
  const eff = new ReactiveEffect(fn)
  Object.assign(eff, options)

  eff.run()

  const runner = eff.run.bind(eff)
  runner.effect = eff
  return runner
}
