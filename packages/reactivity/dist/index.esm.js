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
    this.depsTail = void 0;
    try {
      this.fn();
    } finally {
      activeSub = prevSub;
    }
  }
  notify() {
    this.scheduler();
  }
  scheduler() {
    this.run();
  }
};
function effect(fn, options) {
  const eff = new ReactiveEffect(fn);
  Object.assign(eff, options);
  eff.run();
  const runner = eff.run.bind(eff);
  runner.effect = eff;
  return runner;
}

// packages/reactivity/src/ref.ts
var Dep = class {
  subs;
  subsTail;
  constructor() {
  }
};
var RefImpl = class {
  _value;
  dep;
  constructor(value) {
    this._value = value;
    this.dep = new Dep(this);
  }
  get value() {
    track(this);
    return this._value;
  }
  set value(newValue) {
    this._value = newValue;
    trigger(this);
  }
};
function ref(val) {
  return new RefImpl(val);
}
function track(refImpl) {
  if (activeSub) {
    link(refImpl.dep, activeSub);
  }
}
function link(dep, sub) {
  if (sub.depsTail === void 0) {
    if (sub.deps) {
      if (sub.deps.dep === dep) {
        sub.depsTail = sub.deps;
        return;
      }
    }
  } else {
    if (sub.depsTail.nextDep && sub.depsTail.nextDep.dep === dep) {
      sub.depsTail = sub.depsTail.nextDep;
      return;
    }
  }
  let newLink = {
    dep,
    prevSub: void 0,
    nextSub: void 0,
    sub,
    nextDep: void 0
  };
  if (!dep.subsTail) {
    dep.subs = newLink;
    dep.subsTail = newLink;
  } else {
    dep.subsTail.nextSub = newLink;
    newLink.prevSub = dep.subsTail;
    dep.subsTail = newLink;
  }
  if (!sub.depsTail) {
    sub.deps = newLink;
    sub.depsTail = newLink;
  } else {
    sub.depsTail.nextDep = newLink;
    sub.depsTail = newLink;
  }
}
function trigger(refImpl) {
  let link2 = refImpl.dep.subs;
  const queuedEffect = [];
  while (link2) {
    const sub = link2.sub;
    queuedEffect.push(sub);
    link2 = link2.nextSub;
  }
  queuedEffect.forEach((sub) => sub.notify());
}
export {
  effect,
  ref
};
//# sourceMappingURL=index.esm.js.map
