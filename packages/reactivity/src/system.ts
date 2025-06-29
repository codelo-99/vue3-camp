import { ReactiveEffect } from './effect'

export class Dep {
  subs: Link | undefined
  subsTail: Link | undefined
}

export class Link {
  dep: Dep
  sub: ReactiveEffect
  nextSub: Link | undefined
  prevSub: Link | undefined

  constructor(dep: Dep, sub: ReactiveEffect) {
    this.dep = dep
    this.sub = sub
  }
}

/**
 * 链接链表关系
 * @param dep
 * @param sub
 */
export function link(dep: Dep, sub: ReactiveEffect) {
  const link = new Link(dep, sub)
  // 没有尾 说明是新的, 头尾相同
  /**
   * 关联链表关系, 分两种情况
   * 1. 尾节点没有, 则表示第一次关联, 那就往头节点加, 头尾相同
   * 2. 尾节点有, 那就往尾节点后面加, 并且更新尾指针
   */
  if (!dep.subsTail) {
    dep.subs = link
    dep.subsTail = link
  } else {
    dep.subsTail.nextSub = link
    link.prevSub = dep.subsTail
    dep.subsTail = link
  }
}

/**
 * 传播更新的函数
 * @param subs
 */
export function propagate(subs: Link) {
  let link = subs
  const queuedEffects = []
  while (link) {
    queuedEffects.push(link.sub)
    link = link.nextSub
  }
  queuedEffects.forEach(effect => effect.notify())
}
