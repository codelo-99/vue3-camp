import { ReactiveEffect } from './effect'
import { Dep, Sub } from './dep'
import { ComputedRefImpl } from './computed'

export class Link {
  dep: Dep
  sub: Sub
  nextSub: Link | undefined
  prevSub: Link | undefined
  nextDep: Link | undefined

  constructor(dep: Dep, sub: Sub) {
    this.dep = dep
    this.sub = sub
  }
}

/**
 * 链接链表关系
 * @param dep
 * @param sub
 */
export function link(dep: Dep, sub: Sub) {
  const currentDep = sub.depsTail
  const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep

  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep
    return
  }

  /**
   * 防止节点重复链接
   */
  let existingLink = dep.subs
  while (existingLink) {
    if (existingLink.sub === sub) return
    existingLink = existingLink.nextSub
  }

  const link = new Link(dep, sub)

  // 将未被复用的节点放在当前节点的后面, 用于清理
  link.nextDep = nextDep

  /**
   * 关联链表和dep的关系, 分两种情况
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

  /**
   * 关联链表和sub的关系,分两种情况
   * 1. 尾节点没有, 则表示第一次关联, 那就往头节点加, 头尾相同
   * 2. 尾节点有, 那就往尾节点后面加, 并且更新尾指针
   */
  if (!sub.depsTail) {
    sub.deps = link
    sub.depsTail = link
  } else {
    sub.depsTail.nextDep = link
    sub.depsTail = link
  }
}

function processComputedUpdate(sub: ComputedRefImpl) {
  /**
   * 更新计算属性
   * 1. 调用 update
   * 2. 通知 subs 链表上所有的 sub, 重新执行
   */
  if (sub.subs) {
    sub.dirty = true
    if (sub.update()) {
      propagate(sub.subs)
    }
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
    const sub = link.sub
    if (!sub.tracking) {
      // sub.dirty = true
      if ('update' in sub) {
        // TODO 处理 computed
        processComputedUpdate(sub)
      } else {
        queuedEffects.push(sub)
      }
    }
    link = link.nextSub
  }
  queuedEffects.forEach(effect => effect.notify())
}

/**
 * 开始追踪依赖, 将depsTail尾节点设置成undefined
 * @param sub
 */
export function startTrack(sub: Sub) {
  sub.tracking = true
  // 副作用函数首次或重复执行时, 将尾节点置为空, 开始重新收集依赖
  sub.depsTail = undefined
}

/**
 * 结束追踪，找到需要清理的依赖，断开关联关系
 * @param sub
 */
export function endTrack(sub: Sub) {
  sub.tracking = false
  const depsTail = sub.depsTail
  // 追踪完了，不脏了
  // sub.dirty = false
  /**
   * 1. 结束追踪后, 有   尾节点 并且还有下一个节点, 则清理掉他们
   * 2. 结束追踪后, 没有 尾节点, 则从头部开始清理
   */
  if (depsTail) {
    if (depsTail.nextDep) {
      clearTracking(depsTail.nextDep)
      depsTail.nextDep = undefined
    }
  } else {
    clearTracking(sub.deps)
    sub.deps = undefined
  }
}

/**
 * 清除依赖链表关系
 * @param link
 */
export function clearTracking(link: Link) {
  while (link) {
    const { nextSub, nextDep, prevSub } = link

    /**
     * 处理纵向链表
     * 1. 如果当前节点有上一个节点, 就将上一个节点的nextSub指向当前节点的下一个节点, 当前节点的nextSub置空
     * 2. 否则代表当前是头节点, 将头节点指针指向下一个节点
     */
    if (prevSub) {
      prevSub.nextSub = nextSub
      link.nextSub = undefined
    } else {
      link.dep.subs = nextSub
    }

    /**
     * 处理横向链表
     * 1. 如果当前节点有下一个节点, 就把下一个节点的prevSub, 指向当前节点的上一个节点, 当前节点的prevSub置空
     * 2. 否则代表当前节点是尾节点, 将尾节点指针指向当前节点的上一个节点
     */
    if (nextSub) {
      nextDep.prevSub = prevSub
      link.prevSub = undefined
    } else {
      link.dep.subsTail = prevSub
    }

    link.dep = undefined
    link.sub = undefined

    link = nextDep
  }
}
