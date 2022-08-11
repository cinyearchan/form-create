import is from "./type"

export default function toDate(timeStamp) {
  if (is.Date(timeStamp)) return timeStamp
  else {
    const date = new Date(timeStamp)
    return date.toString() === "Invalid Date" ? timeStamp : date
  }
}
