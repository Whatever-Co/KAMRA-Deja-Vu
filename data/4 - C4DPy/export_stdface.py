from djv import *

#========================================
# config

faceObj = doc.SearchObject("face_original")
uvwTag = faceObj.GetTag(c4d.Tuvw)

TRIANGLE 			= 0b0
QUAD 				= 0b1
FACE_UV 			= 0b100
FACE_VERTEX_UV		= 0b1000
FACE_VERTEX_NORMAL	= 0b100000

#========================================
def main():

	points = faceObj.GetAllPoints()
	facePoints = points[:eyemouthVertexIndex]
	eyemouthPoints = points[eyemouthVertexIndex:]

	polygons = faceObj.GetAllPolygons()
	facePolygons = polygons[:eyemouthFaceIndex]
	eyemouthPolygons = polygons[eyemouthFaceIndex:]

	normals = faceObj.CreatePhongNormals()
	faceNormals = normals[:eyemouthFaceIndex*3]
	eyemouthNormals = normals[eyemouthFaceIndex*3:]

	faceModel = getThreeJson(facePoints, facePolygons, faceNormals)
	faceModel["name"] = "face"

	with open("%s/0b/data/3 - JSON/face.json" % (projDir), 'w') as outFile:
		json.dump(faceModel, outFile, separators=(',',':'))

	# offset vertex index
	for poly in eyemouthPolygons:
		poly.a -= eyemouthVertexIndex
		poly.b -= eyemouthVertexIndex
		poly.c -= eyemouthVertexIndex
		poly.d -= eyemouthVertexIndex

	eyemouthModel = getThreeJson(eyemouthPoints, eyemouthPolygons, eyemouthNormals)
	eyemouthModel["name"] = "eyemouth"

	with open("%s/0b/data/3 - JSON/eyemouth.json" % (projDir), 'w') as outFile:
		json.dump(eyemouthModel, outFile, separators=(',',':'))

	print "END"

def getThreeJson(points, polygons, normals):

	# face
	uvsForIndex = [None for pt in points]
	normalsForIndex = [None for pt in points]

	faceArray = []

	for i, poly in enumerate(polygons):
		faceArray.append(
			FACE_VERTEX_UV |
			FACE_VERTEX_NORMAL |
			TRIANGLE
		)

		uv = uvwTag.GetSlow(i)

		if poly.IsTriangle():
			faceArray.extend([poly.a, poly.c, poly.b])
			faceArray.extend([poly.a, poly.c, poly.b])
			faceArray.extend([poly.a, poly.c, poly.b])
			uvsForIndex[poly.a] = uv['a']
			uvsForIndex[poly.b] = uv['b']
			uvsForIndex[poly.c] = uv['c']
			normalsForIndex[poly.a] = normals[i*3]
			normalsForIndex[poly.b] = normals[i*3+1]
			normalsForIndex[poly.c] = normals[i*3+2]
		else:
			print "ERROR", i
			return

	vertexArray = []
	for pt in points:
		pt = toFaceVertex(pt)
		vertexArray.extend(pt)

	# uv
	uvArray = []
	for uv in uvsForIndex:
		uvArray.extend([uv.x, uv.y])


	# normals
	normalArray = []
	for norm in normalsForIndex:
		norm = toPosition(norm)
		normalArray.extend(norm)


	return {
		"metadata": {
			"type": "Geometry",
			"uvs": 1,
			"faces": len(polygons),
			"vertices": len(points),
			"normals": len(points),
			"generator": "io_three",
			"version": 3
		},
		"vertices": vertexArray,
		"uvs": [uvArray],
		"faces": faceArray,
		"normals": normalArray
	}

if __name__=='__main__':
    main()