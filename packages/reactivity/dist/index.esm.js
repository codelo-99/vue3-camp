// packages/reactivity/src/system.ts
var Link = class {
  dep;
  sub;
  nextSub;
  prevSub;
  nextDep;
  constructor(dep, sub) {
    this.dep = dep;
    this.sub = sub;
  }
};
function link(dep, sub) {
  const currentDep = sub.depsTail;
  const nextDep = currentDep === void 0 ? sub.deps : currentDep.nextDep;
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep;
    return;
  }
  const link2 = new Link(dep, sub);
  link2.nextDep = nextDep;
  if (!dep.subsTail) {
    dep.subs = link2;
    dep.subsTail = link2;
  } else {
    dep.subsTail.nextSub = link2;
    link2.prevSub = dep.subsTail;
    dep.subsTail = link2;
  }
  if (!sub.depsTail) {
    sub.deps = link2;
    sub.depsTail = link2;
  } else {
    sub.depsTail.nextDep = link2;
    sub.depsTail = link2;
  }
}
function processComputedUpdate(sub) {
  if (sub.subs && sub.update()) {
    propagate(sub.subs);
  }
}
function propagate(subs) {
  let link2 = subs;
  const queuedEffects = [];
  while (link2) {
    const sub = link2.sub;
    if (!sub.tracking && !sub.dirty) {
      sub.dirty = true;
      if ("update" in sub) {
        processComputedUpdate(sub);
      } else {
        queuedEffects.push(sub);
      }
    }
    link2 = link2.nextSub;
  }
  queuedEffects.forEach((effect2) => effect2.notify());
}
function startTrack(sub) {
  sub.tracking = true;
  sub.depsTail = void 0;
}
function endTrack(sub) {
  sub.tracking = false;
  const depsTail = sub.depsTail;
  sub.dirty = false;
  if (depsTail) {
    if (depsTail.nextDep) {
      clearTracking(depsTail.nextDep);
      depsTail.nextDep = void 0;
    }
  } else {
    clearTracking(sub.deps);
    sub.deps = void 0;
  }
}
function clearTracking(link2) {
  while (link2) {
    const { nextSub, nextDep, prevSub } = link2;
    if (prevSub) {
      prevSub.nextSub = nextSub;
      link2.nextSub = void 0;
    } else {
      link2.dep.subs = nextSub;
    }
    if (nextSub) {
      nextDep.prevSub = prevSub;
      link2.prevSub = void 0;
    } else {
      link2.dep.subsTail = prevSub;
    }
    link2.dep = void 0;
    link2.sub = void 0;
    link2 = nextDep;
  }
}

// packages/reactivity/src/effect.ts
var activeSub;
function setActiveSub(sub) {
  activeSub = sub;
}
var ReactiveEffect = class {
  constructor(fn) {
    this.fn = fn;
  }
  // 表示这个 effect 是否激活
  active = true;
  deps;
  depsTail;
  tracking = false;
  dirty = false;
  run() {
    const prevSub = activeSub;
    setActiveSub(this);
    startTrack(this);
    try {
      return this.fn();
    } finally {
      endTrack(this);
      setActiveSub(prevSub);
    }
  }
  scheduler() {
    this.run();
  }
  notify() {
    this.scheduler();
  }
  stop() {
    if (this.active) {
      startTrack(this);
      endTrack(this);
    }
  }
};
function effect(fn, options) {
  const e = new ReactiveEffect(fn);
  if (options) {
    Object.assign(e, options);
  }
  e.run();
  const runner = e.run.bind(e);
  runner.effect = e;
  return runner;
}

// packages/shared/src/index.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}
function hasChanged(newValue, oldValue) {
  return !Object.is(newValue, oldValue);
}
function isFunction(value) {
  return typeof value === "function";
}

// packages/reactivity/src/dep.ts
var Dep = class {
  subs;
  subsTail;
  _value;
  constructor(dep) {
    this._value = dep;
  }
};

// packages/reactivity/src/reactive.ts
var mutableHandlers = {
  get(target, key, receiver) {
    if (key === "__v_isReactive") return true;
    track(target, key);
    const res = Reflect.get(target, key, receiver);
    if (isRef(res)) {
      return res.value;
    }
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  },
  set(target, key, newValue, receiver) {
    const oldValue = target[key];
    const res = Reflect.set(target, key, newValue, receiver);
    if (isRef(oldValue) && !isRef(newValue)) {
      oldValue.value = newValue;
      return res;
    }
    if (hasChanged(newValue, oldValue)) {
      trigger(target, key);
    }
    return res;
  }
};
function reactive(target) {
  return isReactive(target) ? target : createReactiveObject(target);
}
var reactiveMap = /* @__PURE__ */ new WeakMap();
function createReactiveObject(target) {
  if (!isObject(target)) {
    return target;
  }
  if (isReactive(target)) return target;
  const existingProxy = reactiveMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}
var targetMap = /* @__PURE__ */ new WeakMap();
function track(target, key) {
  if (!activeSub) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, dep = new Dep(target[key]));
  }
  link(dep, activeSub);
}
function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const dep = depsMap.get(key);
  if (!dep) return;
  propagate(dep.subs);
}
function isReactive(value) {
  return !!(value && value["__v_isReactive"]);
}

// packages/reactivity/src/ref.ts
var ReactiveFlags = /* @__PURE__ */ ((ReactiveFlags2) => {
  ReactiveFlags2["IS_REF"] = "__v_isRef";
  return ReactiveFlags2;
})(ReactiveFlags || {});
var RefImpl = class {
  // 保存实际的值
  _value;
  // ref 标记, 证明是一个 ref
  ["__v_isRef" /* IS_REF */] = true;
  dep;
  constructor(value) {
    this.dep = new Dep(this);
    this._value = isObject(value) ? reactive(value) : value;
  }
  get value() {
    track2(this.dep);
    return this._value;
  }
  set value(newValue) {
    const oldValue = this._value;
    this._value = isObject(newValue) ? reactive(newValue) : newValue;
    if (hasChanged(newValue, oldValue)) {
      trigger2(this.dep);
    }
  }
};
function track2(dep) {
  if (activeSub) {
    link(dep, activeSub);
  }
}
function trigger2(dep) {
  if (dep.subs) {
    propagate(dep.subs);
  }
}
function ref(value) {
  return new RefImpl(value);
}
function isRef(value) {
  return !!(value && value["__v_isRef" /* IS_REF */]);
}

// packages/reactivity/src/computed.ts
var ComputedRefImpl = class {
  constructor(fn, setter) {
    this.fn = fn;
    this.setter = setter;
  }
  // computed 也是一个 ref, 通过 isRef 也返回 true
  ["__v_isRef" /* IS_REF */] = true;
  // 保存 fn 的返回值
  _value;
  //region 作为 dep, 要关联 subs, 等我的值更新了, 我要通知它们重新执行
  /**
   * 订阅者链表的头节点, 理解为我们讲的 head
   */
  subs;
  /**
   * 订阅者链表的尾节点, 理解为我们讲的 tail
   */
  subsTail;
  //endregion
  //region 作为 dep, 要关联 subs, 等我的值更新了, 我要通知它们重新执行
  /**
   * 依赖项链表的头节点
   */
  deps;
  /**
   * 依赖项链表的尾节点
   */
  depsTail;
  tracking = false;
  //endregion
  // 计算属性, 脏不脏, 如果 dirty 为 true, 表示计算属性是脏的
  // get value 的时候, 需要执行 update
  dirty = true;
  get value() {
    if (this.dirty) {
      this.update();
    }
    if (activeSub) {
      link(this, activeSub);
    }
    return this._value;
  }
  set value(newValue) {
    if (this.setter) {
      this.setter(newValue);
    } else {
      console.warn("\u6211\u662F\u53EA\u8BFB\u7684, \u4F60\u522B\u778E\u73A9\u4E86");
    }
  }
  update() {
    const prevSub = activeSub;
    setActiveSub(this);
    startTrack(this);
    try {
      const oldValue = this._value;
      this._value = this.fn();
      return hasChanged(this._value, oldValue);
    } finally {
      endTrack(this);
      setActiveSub(prevSub);
    }
  }
};
function computed(getterOrOptions) {
  let getter;
  let setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}

// packages/reactivity/src/watch.ts
function watch(source, cb, options = {}) {
  const { immediate, once, deep } = options;
  if (once) {
    const _cb = cb;
    cb = (...args) => {
      _cb(...args);
      effect2.stop();
    };
  }
  let getter;
  if (isRef(source)) {
    getter = () => deep ? source.value : source.value;
  }
  if (deep) {
    const baseGetter = getter;
    getter = () => traverse(baseGetter());
  }
  let oldValue;
  function job() {
    const newValue = effect2.run();
    cb(newValue, oldValue);
    oldValue = newValue;
  }
  const effect2 = new ReactiveEffect(getter);
  effect2.scheduler = job;
  if (immediate) {
    job();
  } else {
    oldValue = effect2.run();
  }
  return () => {
    effect2.stop();
  };
}
function traverse(value, seen = /* @__PURE__ */ new Set()) {
  if (!isObject(value)) {
    return value;
  }
  if (seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const key in value) {
    const item = value[key];
    traverse(item, seen);
  }
  return value;
}
export {
  ComputedRefImpl,
  Dep,
  Link,
  ReactiveEffect,
  ReactiveFlags,
  RefImpl,
  activeSub,
  clearTracking,
  computed,
  effect,
  endTrack,
  isReactive,
  isRef,
  link,
  propagate,
  reactive,
  ref,
  setActiveSub,
  startTrack,
  watch
};
//# sourceMappingURL=index.esm.js.map
