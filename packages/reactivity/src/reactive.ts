import { isObject } from '@vue/shared'
import { activeSub } from './effect'
import { Dep, link, propagate } from './system'

export function createReactiveObject(target: any) {
  if (!isObject(target)) return target

  const proxy = new Proxy(target, {
    get(target: any, p: string | symbol, receiver: any) {
      track(target, p, receiver)
      return Reflect.get(target, p)
    },
    set(
      target: any,
      p: string | symbol,
      newValue: any,
      receiver: any,
    ): boolean {
      const result = Reflect.set(target, p, newValue)
      trigger(target, p, newValue, receiver)
      return result
    },
  })
  return proxy
}

/**
 * 响应式变量池
 * map: {
 *   [target]: {
 *     a: 1,
 *     b: 2,
 *   }
 * }
 */
const reactiveMap = new WeakMap<Record<any, any>, Map<string | symbol, Dep>>()
console.log(reactiveMap)

function track(target: any, p: string | symbol, receiver: any) {
  if (activeSub) {
    let depsMap = reactiveMap.get(target)
    if (!depsMap) {
      depsMap = new Map()
      reactiveMap.set(target, depsMap)
    }
    let dep = depsMap.get(p)
    if (!dep) {
      dep = new Dep()
      depsMap.set(p, dep)
    }
    link(dep, activeSub)
  }
}

function trigger(
  target: any,
  p: string | symbol,
  newValue: any,
  receiver: any,
) {
  const depsMap = reactiveMap.get(target)
  if (depsMap) {
    const dep = depsMap.get(p)
    if (dep && dep.subs) {
      propagate(dep.subs)
    }
  }
}

export function reactive(value: any) {
  return createReactiveObject(value)
}

const reactiveSet = new WeakSet()
export function isReactive(proxy: any) {
  return reactiveSet.has(proxy)
}
