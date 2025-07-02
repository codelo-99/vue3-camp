import { activeSub, ReactiveEffect, Sub } from './effect'

export interface Link {
  dep: Dep | undefined
  prevSub: Link | undefined
  nextSub: Link | undefined

  sub: ReactiveEffect | undefined
  nextDep: Link | undefined
}

class Dep {
  subs: Link
  subsTail: Link
  constructor() {}
}

class RefImpl {
  _value
  dep: Dep
  constructor(value: any) {
    this._value = value
    this.dep = new Dep(this)
  }
  get value() {
    track(this)
    return this._value
  }
  set value(newValue: any) {
    this._value = newValue
    trigger(this)
  }
}

export function ref(val: any) {
  return new RefImpl(val)
}

function track(refImpl: RefImpl) {
  if (activeSub) {
    link(refImpl.dep, activeSub)
  }
}

function link(dep: Dep, sub: ReactiveEffect) {
  /**
   * 依赖性的副作用函数link节点复用 (横向复用), 顺带解决纵向重复问题, 因为return了
   * 解决多次触发副作用函数, 重复收集依赖的问题
   * sub.depsTail 在 run 开始时重置为了 undefined, 表示副作用函数从头开始, 按访问顺序收集依赖
   * 1. 头节点复用
   * 2. 尾节点复用
   */
  // 尝试复用原始头节点
  if (sub.depsTail === undefined) {
    if (sub.deps) {
      if (sub.deps.dep === dep) {
        sub.depsTail = sub.deps
        return
      }
    }
  } else {
    // 尝试复用尾节点的下一个节点
    if (sub.depsTail.nextDep && sub.depsTail.nextDep.dep === dep) {
      sub.depsTail = sub.depsTail.nextDep
      return
    }
  }

  let newLink: Link = {
    dep,
    prevSub: undefined,
    nextSub: undefined,

    sub,
    nextDep: undefined,
  }

  /**
   * 绑定依赖的副作用函数链表关系
   * 1. 没有尾节点, 说明首次添加, 往头节点添加, 首尾相同
   * 2. 有尾节点, 往尾节点后面添加, 更新尾节点指针
   */
  if (!dep.subsTail) {
    dep.subs = newLink
    dep.subsTail = newLink
  } else {
    // 向尾节点后面添加
    dep.subsTail.nextSub = newLink
    // 将新节点的上一个指向尾节点
    newLink.prevSub = dep.subsTail
    // 更新尾节点指针
    dep.subsTail = newLink
  }

  /**
   * 绑定副作用函数的依赖链表关系
   * 1. 没有尾节点, 说明首次添加, 往头节点添加, 首尾相同
   * 2. 有尾节点, 往尾节点添加, 更新尾节点指针
   */
  if (!sub.depsTail) {
    sub.deps = newLink
    sub.depsTail = newLink
  } else {
    // 向尾节点后面添加
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  }
}

function trigger(refImpl: RefImpl) {
  let link = refImpl.dep.subs
  const queuedEffect = []
  while (link) {
    // debugger
    const sub = link.sub
    queuedEffect.push(sub)
    link = link.nextSub
  }
  queuedEffect.forEach(sub => sub.notify())
}
