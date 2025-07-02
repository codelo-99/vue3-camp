import { endTrack, Link, startTrack } from './system'

interface Fn {
  (...args: any[]): any
}

export let activeSub: ReactiveEffect | undefined

export class ReactiveEffect {
  deps: Link | undefined
  depsTail: Link | undefined
  tracking = false

  constructor(public fn) {}
  run() {
    const prevSub = activeSub
    activeSub = this
    // if (this.deps && this.deps.dep) {
    //   this.deps.dep.subsTail = undefined
    // }

    startTrack(this)
    try {
      return this.fn()
    } finally {
      endTrack(this)
      activeSub = prevSub
    }
  }
  scheduler() {
    this.run()
  }
  notify() {
    this.scheduler()
  }
}

export function effect(fn: Fn, options?: { scheduler?: Fn }) {
  const e = new ReactiveEffect(fn)
  if (options) {
    Object.assign(e, options)
  }
  e.run()
  /**
   * 绑定函数的 this
   */
  const runner = e.run.bind(e)

  /**
   * 把 effect 的实例, 放到函数属性中
   */
  runner.effect = e
  return runner
}
