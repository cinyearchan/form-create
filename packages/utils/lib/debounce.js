export default function debounce(fn, wait) {
  let timeout = null
  return function (...arg) {
    if (timeout !== null) clearTimeout(timeout)
    timeout = setTimeout(() => fn.call(this, ...arg), wait)
  }
}
