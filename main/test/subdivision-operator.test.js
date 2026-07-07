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

// --- level 2 composed operator is numerically identical to two sequential
//     level-1 applications (catches composeRows argument-order bugs that
//     affinity checks cannot)
{
  let index = [0, 1, 2, 0, 2, 3]
  let src = new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0])
  let op1 = buildLoopOperator(index, 4, 1)
  let mid = new Float32Array(op1.rows.length * 3)
  applyOperator(op1.rows, src, 3, mid)
  let op1b = buildLoopOperator(op1.index, op1.rows.length, 1)
  let expected = new Float32Array(op1b.rows.length * 3)
  applyOperator(op1b.rows, mid, 3, expected)
  let op2 = buildLoopOperator(index, 4, 2)
  let actual = new Float32Array(op2.rows.length * 3)
  applyOperator(op2.rows, src, 3, actual)
  assert.equal(actual.length, expected.length)
  for (let i = 0; i < actual.length; i++) {
    assert(Math.abs(actual[i] - expected[i]) < 1e-5, 'level-2 mismatch at ' + i)
  }
}

// --- derived index validity + winding preservation on a planar CCW quad
//     (this repo has been bitten by gl_FrontFacing before)
{
  let index = [0, 1, 2, 0, 2, 3] // both CCW, signed area > 0
  let src = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]) // 2D positions
  let op = buildLoopOperator(index, 4, 2)
  let pos = new Float32Array(op.rows.length * 2)
  applyOperator(op.rows, src, 2, pos)
  for (let t = 0; t < op.index.length; t += 3) {
    let a = op.index[t], b = op.index[t + 1], c = op.index[t + 2]
    assert(a < op.rows.length && b < op.rows.length && c < op.rows.length, 'index out of range')
    let area = (pos[b * 2] - pos[a * 2]) * (pos[c * 2 + 1] - pos[a * 2 + 1]) -
               (pos[c * 2] - pos[a * 2]) * (pos[b * 2 + 1] - pos[a * 2 + 1])
    assert(area > 0, 'winding flipped on child triangle at ' + t)
  }
}

// --- guards: invalid levels and edgeKey vertex-count ceiling must throw
{
  assert.throws(() => buildLoopOperator([0, 1, 2], 3, 0), /levels/)
  assert.throws(() => buildLoopOperator([0, 1, 2], 3, undefined), /levels/)
  assert.throws(() => buildLoopOperator([0, 1, 2], 70000, 1), /65536/)
}

console.log('subdivision-operator: all tests passed')
