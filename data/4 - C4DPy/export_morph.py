import djv
from djv import *
reload(djv)

#========================================
# config

user = doc.SearchObject("user")
morph = user.GetTag(c4d.Tposemorph)

patternNum = 31

morphData = []

#========================================
def main():

	for f in xrange(0, patternNum):
		setAbsFrame(f)
		name = morph[c4d.ID_USERDATA,1]
		saveMorph(name)

	print "export morph data.."

	with open("%s/0b/data/3 - JSON/morph.json" % (projDir), 'w') as outFile:
		json.dump(morphData, outFile, separators=(',',':'))

	print "END"

def saveMorph(name):
	global morphData

	points = user.GetAllPoints()
	facePoints = points[:eyemouthVertexIndex]
	eyemouthPoints = points[eyemouthVertexIndex:]

	# vertices
	faceVertices = []
	for pt in facePoints:
		pt = toFaceVertex(pt)
		faceVertices.extend(pt)
	
	eyemouthVertices = []
	for pt in eyemouthPoints:
		eyemouthVertices.extend(toFaceVertex(pt))

	morphData.append({
		"name": name,
		"face": {
			"vertices": faceVertices
		},
		"eyemouth": {
			"vertices": eyemouthVertices
		}		
	})

	print "completed: %s" % name

if __name__=='__main__':
    main()