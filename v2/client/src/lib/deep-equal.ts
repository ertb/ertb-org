export const deepEqual = <T>(x:T, y:T) => {
  if (x === y) return true
  if (typeof x != typeof y) return false

  if (typeof x == 'object') {
    const a = x as {[key:string]:any}
    const b = y as {[key:string]:any}
    if (Object.keys(a).length != Object.keys(b).length) return false
    for (let prop in a) {
      if (!a.hasOwnProperty(prop)) return false
      if (!deepEqual(a[prop], b[prop])) return false
    }
    return true
  } else if (Array.isArray(x) && Array.isArray(y)) {
    if (x.length != y.length) return false
    for (let i in x) if (!deepEqual(x[i],y[i])) return false
    return true
  }
  return false
}