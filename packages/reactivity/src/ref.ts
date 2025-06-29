import { activeSub } from './effect'
import { Dep, link, propagate } from './system'

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
    this._value = value
  }
  get value() {
    track(this)
    return this._value
  }
  set value(newValue) {
    this._value = newValue
    trigger(this.dep)
  }
}

/**
 * 收集依赖
 */
function track(self: RefImpl) {
  if (activeSub) {
    link(self.dep, activeSub)
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
