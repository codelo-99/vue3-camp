import { hasChanged, isObject } from '@vue/shared'
import { activeSub } from './effect'
import { link, propagate } from './system'
import { isRef } from './ref'
import { Dep } from './dep'

const mutableHandlers = {
  get(target, key, receiver) {
    if (key === '__v_isReactive') return true
    /**
     * target = { a: 0 }
     * 收集依赖, 绑定 target 中某一个 key 和 sub 之间的关系
     */

    track(target, key)

    const res = Reflect.get(target, key, receiver)

    if (isRef(res)) {
      /**
       * target = { a: ref(0) }
       * 如果 target.a 是一个 ref, 那么就直接把值给它, 不要让它 .value
       */
      return res.value
    }

    if (isObject(res)) {
      /**
       * 如果访问的是嵌套对象, 那么就用 reactive 包裹一下
       */
      return reactive(res)
    }

    return res
  },
  set(target, key, newValue, receiver) {
    /**
     * 触发更新, set 的时候, 通知之前收集的依赖, 重新执行
     */
    const oldValue = target[key]
    const res = Reflect.set(target, key, newValue, receiver)

    if (isRef(oldValue) && !isRef(newValue)) {
      oldValue.value = newValue
      // 这里需要提前 return, 因为 ref.value 更新会触发 effect, 下面不需要再次触发
      return res
    }

    if (hasChanged(newValue, oldValue)) {
      trigger(target, key)
    }
    return res
  },
}

export function reactive(target) {
  return isReactive(target) ? target : createReactiveObject(target)
}

const reactiveMap = new WeakMap()

function createReactiveObject(target) {
  /**
   * reactive 必须接受一个对象
   */
  if (!isObject(target)) {
    /**
     * target 不是一个对象, 哪来的回哪去
     */
    return target
  }
  if (isReactive(target)) return target
  const existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }
  /**
   * 创建 target 的代理对象
   */
  const proxy = new Proxy(target, mutableHandlers)
  reactiveMap.set(target, proxy)

  return proxy
}

/**
 * 绑定 target 的 key 关联的所有 Dep
 * obj = { a: 0, b: 1 }
 * targetMap = {
 *   [obj]: {
 *     a: Dep,
 *     b: Dep,
 *   }
 * }
 */
const targetMap = new WeakMap()

function track(target, key) {
  if (!activeSub) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Dep(target[key])))
  }
  link(dep, activeSub)
}

function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const dep = depsMap.get(key)
  if (!dep) return
  propagate(dep.subs)
}

export function isReactive(value) {
  return !!(value && value['__v_isReactive'])
}
