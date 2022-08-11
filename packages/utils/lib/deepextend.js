import { $set } from "./modify"
import is from "./type"

export default function deepExtend(origin, target = {}, mode) {
  let isArr = false
  for (const key in target) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      let clone = target[key]
      if ((isArr = Array.isArray(clone)) || is.Object(clone)) {
        const nst = origin[key] === undefined
        if (isArr) {
          isArr = false
          nst && $set(origin, key, [])
        } else if (clone._clone && mode !== undefined) {
          if (mode) {
            clone = clone.getRule()
            nst && $set(origin, key, {})
          } else {
            $set(origin, key, clone._clone())
            continue
          }
        } else {
          nst && $set(origin, key, {})
        }
        origin[key] = deepExtend(origin[key], clone, mode)
      } else {
        $set(origin, key, clone)
        if (!is.Undef(clone)) {
          if (!is.Undef(clone.__json)) {
            origin[key].__json = clone.__json
          }
          if (!is.Undef(clone.__origin)) {
            origin[key].__origin = clone.__origin
          }
        }
      }
    }
  }
  return mode !== undefined && Array.isArray(origin)
    ? origin.filter(v => !v || !v.__ctrl)
    : origin
}

export function deepCopy(value) {
  return deepExtend({}, { value }).value
}

export function deepExtendArgs(origin, ...lst) {
  lst.forEach(target => {
    origin = deepExtend(origin, target)
  })
  return origin
}
