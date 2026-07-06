import assert from 'assert'
import {buildLoopOperator, applyOperator} from '../src/pc/subdivision-operator'

function rowSum(row) {
  return row.reduce((s, iw) => s + iw[1], 0)
}

// --- two triangles sharing an edge (quad), all edges boundary except the shared one
{
  let index = [0, 1, 2, 0, 2, 3]
  let op = buildLoopOperator(index, 4, 1)
  // V' = V + E = 4 + 5 = 9, F' = 4F = 8
  assert.equal(op.rows.length, 9)
  assert.equal(op.index.length, 8 * 3)
  op.rows.forEach((row) => assert(Math.abs(rowSum(row) - 1) < 1e-6))
  // boundary odd vertex (edge 0-1) must be the midpoint: weights 1/2,1/2
  let mid01 = op.rows.find((row) =>
    row.length == 2 && row.every((iw) => Math.abs(iw[1] - 0.5) < 1e-6) &&
    row.map((iw) => iw[0]).sort().join() == '0,1')
  assert(mid01, 'boundary edge midpoint row missing')
}

// --- closed tetrahedron: no boundary, interior rules everywhere
{
  let index = [0, 1, 2, 0, 3, 1, 1, 3, 2, 2, 3, 0]
  let op = buildLoopOperator(index, 4, 1)
  assert.equal(op.rows.length, 4 + 6)
  op.rows.forEach((row) => assert(Math.abs(rowSum(row) - 1) < 1e-6))
  // interior odd vertex: 4 contributors (3/8,3/8,1/8,1/8)
  let odd = op.rows[4]
  assert.equal(odd.length, 4)
  let ws = odd.map((iw) => iw[1]).sort()
  assert(Math.abs(ws[0] - 0.125) < 1e-6 && Math.abs(ws[3] - 0.375) < 1e-6)
}

// --- level 2 composes: rows still reference ORIGINAL cage indices only
{
  let index = [0, 1, 2, 0, 2, 3]
  let op = buildLoopOperator(index, 4, 2)
  op.rows.forEach((row) => {
    assert(Math.abs(rowSum(row) - 1) < 1e-6)
    row.forEach((iw) => assert(iw[0] >= 0 && iw[0] < 4))
  })
}

// --- applyOperator: identity rows copy source
{
  let rows = [[[0, 1]], [[0, 0.5], [1, 0.5]]]
  let dst = new Float32Array(2 * 3)
  applyOperator(rows, new Float32Array([0, 0, 0, 2, 4, 6]), 3, dst)
  assert.deepEqual(Array.from(dst), [0, 0, 0, 1, 2, 3])
}

// --- unreferenced vertices keep identity rows
{
  let index = [0, 1, 2]
  let op = buildLoopOperator(index, 5, 1) // vertices 3,4 unreferenced
  assert.deepEqual(op.rows[3], [[3, 1]])
  assert.deepEqual(op.rows[4], [[4, 1]])
}

console.log('subdivision-operator: all tests passed')
