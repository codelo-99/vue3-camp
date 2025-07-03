// packages/reactivity/src/system.ts
var Dep = class {
  subs;
  subsTail;
};
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
function propagate(subs) {
  let link2 = subs;
  const queuedEffects = [];
  while (link2) {
    const sub = link2.sub;
    if (!sub.tracking) {
      queuedEffects.push(sub);
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
var ReactiveEffect = class {
  constructor(fn) {
    this.fn = fn;
  }
  deps;
  depsTail;
  tracking = false;
  run() {
    const prevSub = activeSub;
    activeSub = this;
    startTrack(this);
    try {
      return this.fn();
    } finally {
      endTrack(this);
      activeSub = prevSub;
    }
  }
  scheduler() {
    this.run();
  }
  notify() {
    this.scheduler();
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

// packages/reactivity/src/ref.ts
var RefImpl = class {
  // 保存实际的值
  _value;
  // ref 标记, 证明是一个 ref
  ["__v_isRef" /* IS_REF */];
  dep = new Dep();
  constructor(value) {
    this._value = value;
  }
  get value() {
    track(this.dep);
    return this._value;
  }
  set value(newValue) {
    this._value = newValue;
    trigger(this.dep);
  }
};
function track(dep) {
  if (activeSub) {
    link(dep, activeSub);
  }
}
function trigger(dep) {
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

// packages/shared/src/index.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}

// packages/reactivity/src/reactive.ts
function createReactiveObject(target) {
  if (!isObject(target)) return target;
  const proxy = new Proxy(target, {
    get(target2, p, receiver) {
      track2(target2, p, receiver);
      return Reflect.get(target2, p);
    },
    set(target2, p, newValue, receiver) {
      const result = Reflect.set(target2, p, newValue);
      trigger2(target2, p, newValue, receiver);
      return result;
    }
  });
  return proxy;
}
var reactiveMap = /* @__PURE__ */ new WeakMap();
console.log(reactiveMap);
function track2(target, p, receiver) {
  if (activeSub) {
    let depsMap = reactiveMap.get(target);
    if (!depsMap) {
      depsMap = /* @__PURE__ */ new Map();
      reactiveMap.set(target, depsMap);
    }
    let dep = depsMap.get(p);
    if (!dep) {
      dep = new Dep();
      depsMap.set(p, dep);
    }
    link(dep, activeSub);
  }
}
function trigger2(target, p, newValue, receiver) {
  const depsMap = reactiveMap.get(target);
  if (depsMap) {
    const dep = depsMap.get(p);
    if (dep && dep.subs) {
      propagate(dep.subs);
    }
  }
}
function reactive(value) {
  return createReactiveObject(value);
}
var reactiveSet = /* @__PURE__ */ new WeakSet();
function isReactive(proxy) {
  return reactiveSet.has(proxy);
}
export {
  Dep,
  Link,
  ReactiveEffect,
  RefImpl,
  activeSub,
  createReactiveObject,
  effect,
  isReactive,
  isRef,
  link,
  propagate,
  reactive,
  ref
};
//# sourceMappingURL=index.esm.js.map
