from djv import *

#========================================
# config

faceObj = doc.SearchObject("face_original")
hullObj = doc.SearchObject("face_hull")

TRIANGLE 			= 0b0
QUAD 				= 0b1
FACE_UV 			= 0b100
FACE_VERTEX_UV		= 0b1000
FACE_VERTEX_NORMAL	= 0b100000

#========================================
def main():

	#===================================
	# face
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

	#===================================
	# eyemouth

	for poly in eyemouthPolygons:
		poly.a -= eyemouthVertexIndex
		poly.b -= eyemouthVertexIndex
		poly.c -= eyemouthVertexIndex
		poly.d -= eyemouthVertexIndex

	# fill mouth manually
	mouthVertexOffset = len(eyemouthPoints)
	eyemouthPoints.extend([points[i] for i in mouthVertexIndices])

	print len(eyemouthPoints)


	for poly in mouthPolygons:
		cpoly = c4d.CPolygon(
			poly[0] + mouthVertexOffset,
			poly[2] + mouthVertexOffset,
			poly[1] + mouthVertexOffset)
		eyemouthPolygons.append(cpoly)

	eyemouthModel = getThreeJson(eyemouthPoints, eyemouthPolygons, eyemouthNormals)
	eyemouthModel["name"] = "eyemouth"

	with open("%s/0b/data/3 - JSON/eyemouth.json" % (projDir), 'w') as outFile:
		json.dump(eyemouthModel, outFile, separators=(',',':'))

	#===================================
	# face_hull
	# points = hullObj.GetAllPoints()
	# polygons = hullObj.GetAllPolygons()
	# normals = hullObj.CreatePhongNormals()

	# hullModel = getThreeJson(points, polygons, normals)
	# hullModel["name"] = "face_hull"

	# with open("%s/0b/data/3 - JSON/face_hull.json" % (projDir), 'w') as outFile:
	# 	json.dump(hullModel, outFile, separators=(',',':'))

	# print "END"

def getThreeJson(points, polygons, normals):

	# face
	normalsForIndex = [None for pt in points]

	faceArray = []

	for i, poly in enumerate(polygons):
		faceArray.append(
			# FACE_VERTEX_NORMAL |
			TRIANGLE
		)

		if poly.IsTriangle():
			faceArray.extend([poly.a, poly.c, poly.b])
			faceArray.extend([poly.a, poly.c, poly.b])
			# normalsForIndex[poly.a] = normals[i*3]
			# normalsForIndex[poly.b] = normals[i*3+1]
			# normalsForIndex[poly.c] = normals[i*3+2]
		else:
			print "ERROR", i
			return

	vertexArray = []
	for pt in points:
		pt = toFaceVertex(pt)
		vertexArray.extend(pt)

	# normals
	# normalArray = []
	# for norm in normalsForIndex:
	# 	norm = toPosition(norm)
	# 	normalArray.extend(norm)


	return {
		"metadata": {
			"type": "Geometry",
			"faces": len(polygons),
			"vertices": len(points),
			# "normals": len(points),
			"generator": "io_three",
			"version": 3
		},
		"vertices": vertexArray,
		"faces": faceArray,
		# "normals": normalArray
	}

if __name__=='__main__':
    main()