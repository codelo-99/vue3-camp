// packages/reactivity/src/effect.ts
var activeSub;
var ReactiveEffect = class {
  deps;
  depsTail;
  fn;
  constructor(fn) {
    this.fn = fn;
  }
};
function effect(fn) {
  activeSub = new ReactiveEffect(fn);
  fn();
  activeSub = void 0;
}

// packages/reactivity/src/ref.ts
var Dep = class {
  subs;
};
var Link = class {
  dep;
  sub;
  constructor(dep, sub) {
    this.dep = dep;
    this.sub = sub;
  }
};
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
    trigger(this);
  }
};
function track(self) {
  console.log("\u6536\u96C6\u4F9D\u8D56", self);
  if (activeSub) {
    if (!self.dep.subs) {
      self.dep.subs = new Link(self.dep, activeSub);
    }
  }
}
function trigger(self) {
  console.log(self);
  self.dep.subs.sub.fn();
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
  ref
};
//# sourceMappingURL=index.esm.js.map
