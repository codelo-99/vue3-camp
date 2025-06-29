import { activeSub, ReactiveEffect } from './effect'

enum ReactiviFlags {
  IS_REF = '__v_isRef',
}

export class Dep {
  subs: Link | undefined
}

export class Link {
  dep: Dep
  sub: ReactiveEffect
  constructor(dep: Dep, sub: ReactiveEffect) {
    this.dep = dep
    this.sub = sub
  }
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
    trigger(this)
  }
}

/**
 * 收集依赖
 */
function track(self: RefImpl) {
  console.log('收集依赖', self)
  if (activeSub) {
    if (!self.dep.subs) {
      self.dep.subs = new Link(self.dep, activeSub)
    }
  }
}

/**
 * 触发更新
 */
function trigger(self: RefImpl) {
  console.log(self)
  // self.dep.forEach(fn => fn())
  self.dep.subs.sub.fn()
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
