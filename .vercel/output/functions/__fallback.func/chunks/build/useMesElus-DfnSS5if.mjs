import { toRef, isRef } from 'vue';
import { d as useNuxtApp } from './server.mjs';

const useStateKeyPrefix = "$s";
function useState(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (typeof args[0] !== "string") {
    args.unshift(autoKey);
  }
  const [_key, init] = args;
  if (!_key || typeof _key !== "string") {
    throw new TypeError("[nuxt] [useState] key must be a string: " + _key);
  }
  if (init !== void 0 && typeof init !== "function") {
    throw new Error("[nuxt] [useState] init must be a function: " + init);
  }
  const key = useStateKeyPrefix + _key;
  const nuxtApp = useNuxtApp();
  const state = toRef(nuxtApp.payload.state, key);
  if (init) {
    nuxtApp._state[key] ??= { _default: init };
  }
  if (state.value === void 0 && init) {
    const initialValue = init();
    if (isRef(initialValue)) {
      nuxtApp.payload.state[key] = initialValue;
      return initialValue;
    }
    state.value = initialValue;
  }
  return state;
}
function useMesElus() {
  const ids = useState("mes-elus", () => []);
  const loaded = useState("mes-elus-loaded", () => false);
  const has = (id) => ids.value.includes(id);
  const toggle = (id) => {
    ids.value = has(id) ? ids.value.filter((x) => x !== id) : [...ids.value, id];
  };
  const add = (id) => {
    if (!has(id)) ids.value = [...ids.value, id];
  };
  const remove = (id) => {
    ids.value = ids.value.filter((x) => x !== id);
  };
  return { ids, has, toggle, add, remove, loaded };
}

export { useMesElus as u };
//# sourceMappingURL=useMesElus-DfnSS5if.mjs.map
