import { endTrack, Link, startTrack } from './system'
import { Sub } from './dep'

interface Fn {
  (...args: any[]): any
}

export let activeSub: Sub | undefined

export function setActiveSub(sub: Sub) {
  activeSub = sub
}

export class ReactiveEffect {
  // 表示这个 effect 是否激活
  active = true

  deps: Link | undefined
  depsTail: Link | undefined
  tracking = false
  dirty = false

  constructor(public fn) {}
  run() {
    const prevSub = activeSub
    setActiveSub(this)
    // if (this.deps && this.deps.dep) {
    //   this.deps.dep.subsTail = undefined
    // }

    startTrack(this)
    try {
      return this.fn()
    } finally {
      endTrack(this)
      setActiveSub(prevSub)
    }
  }
  scheduler() {
    this.run()
  }
  notify() {
    this.scheduler()
  }
  stop() {
    console.log('stop')
    if (this.active) {
      // 清理依赖
      startTrack(this)
      endTrack(this)
    }
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
