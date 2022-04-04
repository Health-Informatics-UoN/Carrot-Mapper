function arraysEqual(array1, array2) {
    if (array1.length !== array2.length) return false
    const sorted1 = array1.sort()
    const sorted2 = array2.sort()
    for (let i in sorted1) {
        if (sorted1[i] !== sorted2[i]) {
            return false
        }
    }
    return true
}

export { arraysEqual }