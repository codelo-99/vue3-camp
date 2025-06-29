// packages/reactivity/src/effect.ts
var activeSub;
var ReactiveEffect = class {
  constructor(fn) {
    this.fn = fn;
  }
  deps;
  depsTail;
  run() {
    const prevSub = activeSub;
    activeSub = this;
    try {
      return this.fn();
    } finally {
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
}

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
  constructor(dep, sub) {
    this.dep = dep;
    this.sub = sub;
  }
};
function link(dep, sub) {
  const link2 = new Link(dep, sub);
  if (!dep.subsTail) {
    dep.subs = link2;
    dep.subsTail = link2;
  } else {
    dep.subsTail.nextSub = link2;
    link2.prevSub = dep.subsTail;
    dep.subsTail = link2;
  }
}
function propagate(subs) {
  let link2 = subs;
  const queuedEffects = [];
  while (link2) {
    queuedEffects.push(link2.sub);
    link2 = link2.nextSub;
  }
  queuedEffects.forEach((effect2) => effect2.notify());
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
    track(this);
    return this._value;
  }
  set value(newValue) {
    this._value = newValue;
    trigger(this.dep);
  }
};
function track(self) {
  if (activeSub) {
    link(self.dep, activeSub);
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
export {
  Dep,
  Link,
  ReactiveEffect,
  RefImpl,
  activeSub,
  effect,
  isRef,
  link,
  propagate,
  ref
};
//# sourceMappingURL=index.esm.js.map
