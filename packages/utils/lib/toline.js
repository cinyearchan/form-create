export default function toLine(name) {
  let line = name.replace(/([A-Z])/g, "-$1").toLocaleLowerCase()
  if (line.indexOf("-") === 0) line = line.substr(1)
  return line
}

export function upper(str) {
  return str.replace(str[0], str[0].toLocaleUpperCase())
}
