import { ClassMeta, toMixin } from 'htmlbars-object';

export function get(obj, key) {
  return obj[key];
}

export function set(obj, key, value) {
  return obj[key] = value;
}

export function mixin(obj, ...extensions) {
  let meta: ClassMeta = obj._Meta || new ClassMeta();

  extensions.forEach(extension => {
    let mixin = toMixin(extension);
    mixin.mergeProperties(obj, obj, meta);
    meta.addMixin(mixin);
  });

  meta.seal();
  obj._Meta = meta;
  return obj;
}