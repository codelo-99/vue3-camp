import { ReactiveEffect } from './effect'
import { isRef } from './ref'

export function watch(source, cb, options) {
  let getter

  if (isRef(source)) {
    getter = () => source.value
  }

  let oldValue

  function job() {
    // 执行 effect.run 拿到 getter 的返回值, 不能直接执行 getter, 因为要收集依赖
    const newValue = effect.run()
    // 执行用户回调, 把 newValue 和 oldValue 传进去
    cb(newValue, oldValue)
    // 下一次的 oldValue 就等于这一次的 newValue
    oldValue = newValue
  }

  const effect = new ReactiveEffect(getter)
  effect.scheduler = job

  oldValue = effect.run()

  return () => {
    effect.stop()
  }
}
