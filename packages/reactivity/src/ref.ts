import { activeSub } from './effect'
import { Dep, link, propagate } from './system'
import { hasChanged, isObject } from '@vue/shared'
import { reactive } from './reactive'

enum ReactiviFlags {
  IS_REF = '__v_isRef',
}

export class RefImpl {
  // 保存实际的值
  _value;
  // ref 标记, 证明是一个 ref
  [ReactiviFlags.IS_REF]: true

  dep = new Dep()
  constructor(value) {
    /**
     * 如果 value 是一个对象, 那么我们使用 reactive 对它处理为响应式对象
     */
    this._value = isObject(value) ? reactive(value) : value
  }
  get value() {
    track(this.dep)
    return this._value
  }
  set value(newValue) {
    const oldValue = this._value
    this._value = isObject(newValue) ? reactive(newValue) : newValue
    if (hasChanged(newValue, oldValue)) {
      trigger(this.dep)
    }
  }
}

/**
 * 收集依赖
 */
function track(dep: Dep) {
  if (activeSub) {
    link(dep, activeSub)
  }
}

/**
 * 触发更新
 */
function trigger(dep: Dep) {
  if (dep.subs) {
    propagate(dep.subs)
  }
}

export function ref(value) {
  return new RefImpl(value)
}

/**
 * 判断是不是一个ref
 * @param value
 */
export function isRef(value) {
  return !!(value && value[ReactiviFlags.IS_REF])
}
