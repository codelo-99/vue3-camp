import { ReactiveEffect } from './effect'
import { isRef } from './ref'
import { isFunction, isObject } from '@vue/shared'
import { isReactive } from './reactive'

export function watch(source, cb, options = {}) {
  let { immediate, once, deep } = options

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
  } else if (isReactive(source)) {
    if (deep === undefined) {
      deep = true
    }
    getter = () => source
  } else if (isFunction(source)) {
    // 如果 source 是一个函数, 那 getter 就等于 source
    getter = source
  }

  if (deep) {
    const baseGetter = getter
    const depth = deep === true ? Infinity : deep
    getter = () => traverse(baseGetter(), depth)
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

/**
 * 递归触发 getter
 * @param value
 * @param depth
 * @param seen
 */
function traverse(value, depth = Infinity, seen = new Set()) {
  // 如果不是一个对象, 或者监听层级到了, 直接返回 value
  if (!isObject(value) || depth <= 0) {
    return value
  }

  // 如果之前访问过, 那直接返回, 防止循环引用栈溢出
  if (seen.has(value)) {
    return value
  }
  // 加到 seen 中
  seen.add(value)

  // 层级 -1
  depth--
  for (const key in value) {
    // 递归触发 getter
    traverse(value[key], depth, seen)
  }

  return value
}
