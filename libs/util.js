export function rotate90(arr, row, col) {
  const res = [], step = 4, len = row * col * step
  for(let i = 0; i < len; i += step) {
    const x = (i / step) / col | 0
    const y = (i / step) % col
    let index = (y + 1) * row - 1 - x
    index *= step
    res[index] = arr[i]
    res[index + 1] = arr[i + 1]
    res[index + 2] = arr[i + 2]
    res[index + 3] = arr[i + 3]
  }
  return res
}
