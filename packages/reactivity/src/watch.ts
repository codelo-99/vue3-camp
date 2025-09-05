import { ReactiveEffect } from './effect'
import { isRef } from './ref'
import { isObject } from '@vue/shared'

export function watch(source, cb, options = {}) {
  const { immediate, once, deep } = options

  if (once) {
    // 如果 once 传了, 那就保存一份, 新的 cb 等于,直接调用原来的, 加上 stop 停止监听
    const _cb = cb
    cb = (...args) => {
      _cb(...args)
      effect.stop()
    }
  }

  let getter

  if (isRef(source)) {
    getter = () => (deep ? source.value : source.value)
  }

  if (deep) {
    const baseGetter = getter
    getter = () => traverse(baseGetter())
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

  if (immediate) {
    job()
  } else {
    oldValue = effect.run()
  }

  return () => {
    effect.stop()
  }
}

function traverse(value, seen = new Set()) {
  if (!isObject(value)) {
    return value
  }

  if (seen.has(value)) {
    return value
  }
  seen.add(value)

  for (const key in value) {
    const item = value[key]
    traverse(item, seen)
  }

  return value
}
