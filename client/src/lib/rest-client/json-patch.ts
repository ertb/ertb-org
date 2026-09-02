type addReplaceTestOp = {
    "op": 'add'|'replace'|'test',
    "path": string
    "value": unknown
}
type removeOp = {
    "op": 'add'|'replace'|'test',
    "path": string
}
type moveCopyOp = {
    "op": 'add'|'replace'|'test',
    "from": string
    "path": string
}
export type JSONPatch = (addReplaceTestOp|removeOp|moveCopyOp)[]