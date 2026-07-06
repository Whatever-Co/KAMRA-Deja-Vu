// Loop subdivision precomputed as sparse linear weights over cage vertices.
// Pure arrays in/out - no THREE, no gl-matrix - so it is testable standalone.

function edgeKey(a, b) {
  return a < b ? a * 65536 + b : b * 65536 + a
}

// one level of Loop subdivision on (index, vertexCount)
// returns {index, rows} where rows reference THIS level's input vertices
function subdivideOnce(index, vertexCount) {
  let triCount = index.length / 3

  // adjacency
  let edges = new Map() // key -> {a, b, opposite: [c...], count}
  let vertexEdges = []  // vertex -> Set of neighbor vertices
  let vertexBoundary = new Array(vertexCount).fill(false)
  let referenced = new Array(vertexCount).fill(false)
  for (let v = 0; v < vertexCount; v++) {
    vertexEdges.push(new Set())
  }
  for (let t = 0; t < triCount; t++) {
    let i0 = index[t * 3], i1 = index[t * 3 + 1], i2 = index[t * 3 + 2]
    referenced[i0] = referenced[i1] = referenced[i2] = true
    let corners = [[i0, i1, i2], [i1, i2, i0], [i2, i0, i1]]
    corners.forEach((e) => {
      let key = edgeKey(e[0], e[1])
      let edge = edges.get(key)
      if (!edge) {
        edge = {a: Math.min(e[0], e[1]), b: Math.max(e[0], e[1]), opposite: [], count: 0}
        edges.set(key, edge)
      }
      edge.opposite.push(e[2])
      edge.count++
      vertexEdges[e[0]].add(e[1])
      vertexEdges[e[1]].add(e[0])
    })
  }
  edges.forEach((edge) => {
    if (edge.count == 1) {
      vertexBoundary[edge.a] = true
      vertexBoundary[edge.b] = true
    }
  })

  // even (original) vertex rows
  let rows = []
  let fixedVertexCount = 0
  let nonManifoldEdgeCount = 0
  edges.forEach((edge) => {
    if (edge.count > 2) {
      nonManifoldEdgeCount++
    }
  })
  for (let v = 0; v < vertexCount; v++) {
    if (!referenced[v]) {
      rows.push([[v, 1]])
      continue
    }
    if (vertexBoundary[v]) {
      // boundary rule: 1/8, 3/4, 1/8 along boundary neighbors only
      let bn = []
      vertexEdges[v].forEach((n) => {
        if (edges.get(edgeKey(v, n)).count == 1) {
          bn.push(n)
        }
      })
      if (bn.length == 2) {
        rows.push([[v, 0.75], [bn[0], 0.125], [bn[1], 0.125]])
      } else {
        rows.push([[v, 1]]) // corner / non-manifold pinch: keep fixed
        fixedVertexCount++
      }
    } else {
      let neighbors = Array.from(vertexEdges[v])
      let n = neighbors.length
      let beta = n == 3 ? 3 / 16 : 3 / (8 * n)
      let row = [[v, 1 - n * beta]]
      neighbors.forEach((nb) => row.push([nb, beta]))
      rows.push(row)
    }
  }

  // odd (edge) vertex rows
  let edgeVertexIndex = new Map()
  edges.forEach((edge, key) => {
    let row
    if (edge.count == 1) {
      row = [[edge.a, 0.5], [edge.b, 0.5]]
    } else {
      row = [[edge.a, 0.375], [edge.b, 0.375],
             [edge.opposite[0], 0.125], [edge.opposite[1], 0.125]]
    }
    edgeVertexIndex.set(key, rows.length)
    rows.push(row)
  })

  // build-time only (never per-frame): make degenerate topology visible
  // instead of shipping a mysteriously dimpled mesh
  if (fixedVertexCount > 0 || nonManifoldEdgeCount > 0) {
    console.warn('subdivision-operator: kept ' + fixedVertexCount +
      ' corner/non-manifold vertices fixed, ' + nonManifoldEdgeCount +
      ' non-manifold edges treated as interior')
  }

  // new topology: each triangle -> 4
  let newIndex = []
  for (let t = 0; t < triCount; t++) {
    let i0 = index[t * 3], i1 = index[t * 3 + 1], i2 = index[t * 3 + 2]
    let m01 = edgeVertexIndex.get(edgeKey(i0, i1))
    let m12 = edgeVertexIndex.get(edgeKey(i1, i2))
    let m20 = edgeVertexIndex.get(edgeKey(i2, i0))
    newIndex.push(
      i0, m01, m20,
      m01, i1, m12,
      m20, m12, i2,
      m01, m12, m20
    )
  }
  return {index: newIndex, rows: rows}
}

// compose: outer rows reference inner's outputs; rewrite over inner's inputs
function composeRows(outerRows, innerRows) {
  return outerRows.map((outerRow) => {
    let acc = new Map()
    outerRow.forEach((ow) => {
      innerRows[ow[0]].forEach((iw) => {
        acc.set(iw[0], (acc.get(iw[0]) || 0) + ow[1] * iw[1])
      })
    })
    return Array.from(acc.entries())
  })
}

export function buildLoopOperator(index, vertexCount, levels) {
  if (!(levels >= 1)) {
    throw new Error('buildLoopOperator: levels must be >= 1, got ' + levels)
  }
  if (vertexCount >= 65536) {
    // edgeKey packs two vertex indices into a*65536+b; beyond this the
    // keys collide and the topology corrupts silently
    throw new Error('buildLoopOperator: vertexCount ' + vertexCount + ' exceeds the 65536 edgeKey limit')
  }
  let current = subdivideOnce(index, vertexCount)
  for (let l = 1; l < levels; l++) {
    if (current.rows.length >= 65536) {
      throw new Error('buildLoopOperator: intermediate mesh exceeds the 65536 edgeKey limit at level ' + (l + 1))
    }
    let next = subdivideOnce(current.index, current.rows.length)
    current = {index: next.index, rows: composeRows(next.rows, current.rows)}
  }
  return current
}

export function applyOperator(rows, src, itemSize, dst) {
  for (let i = 0; i < rows.length; i++) {
    let row = rows[i]
    for (let c = 0; c < itemSize; c++) {
      let v = 0
      for (let k = 0; k < row.length; k++) {
        v += src[row[k][0] * itemSize + c] * row[k][1]
      }
      dst[i * itemSize + c] = v
    }
  }
}
