from djv import *

#========================================
# config

destFile = projDir + "/0b/data/3 - JSON/keyframes.json"

# user face
cam = doc.SearchObject("Camera")

user = doc.SearchObject("user")
userWrapper = doc.SearchObject("user_wrapper")
userMorph = user.GetTag(c4d.Tposemorph)

children = [doc.SearchObject("child.%d" % i) for i in xrange(8)]
childrenPoly = [child.GetChildren()[0] for child in children]

#========================================
# keyframe format

keyframes = {
	"camera": {
		"in_frame": 0,
		"out_frame": duration-1,
		"property": {
			"position": [],
			"quaternion": [],
			"fov": []
		}
	},
	"user": {
		"in_frame": 0,
		"out_frame": duration-1,
		"property": {
			"position": [],
			"quaternion": [],
			"scale": [],
			"face_vertices": [],
			"eyemouth_vertices": []
		}
	},

	"i_extra": {
		"in_frame": 0,
		"out_frame": inFrame["A1"]-1,
		"property": {
			"curl_strength": [],
			"curl_rotation": [],
			"curl_offset": [],
			"interpolation": [],
			"scale_z": []
		}
	},

	"user_children": {
		"in_frame": inFrame["A2"],
		"out_frame": duration - 1,
		"property": [
		]
	}
}



#========================================
def addFrame(f):
	global keyframes

	# print "processing.. %04d/%04d" % (f, duration)

	cameraProp = keyframes["camera"]["property"]
	cameraProp["position"].extend(toPosition(cam.GetAbsPos()))
	cameraProp["quaternion"].extend(toQuaternion(cam.GetMg()))
	cameraProp["fov"].append(math.degrees(cam[c4d.CAMERAOBJECT_FOV_VERTICAL]))

	if f <= keyframes["user"]["out_frame"]:
		userProp = keyframes["user"]["property"]
		faceVertices, eyemouthVertices = getFaceVertices(user)
		userProp["position"].extend(toPosition(userWrapper.GetAbsPos()))
		userProp["quaternion"].extend(toQuaternion(userWrapper.GetMg()))
		userProp["scale"].extend(toScale(userWrapper.GetAbsScale()))
		userProp["face_vertices"].append(faceVertices)
		userProp["eyemouth_vertices"].append(eyemouthVertices)

	#-------------------------
	# part I
	if f <= keyframes["i_extra"]["out_frame"]:
		curl = doc.SearchObject("user_curl")
		curlRot = doc.SearchObject("user_curl_rot")

		prop = keyframes["i_extra"]["property"]
		prop["curl_strength"].append(curl[c4d.DEFORMOBJECT_STRENGTH])
		prop["curl_rotation"].append(curlRot.GetRelRot().x)
		prop["curl_offset"].append(curl.GetRelPos().y)
		prop["interpolation"].append(userWrapper[c4d.ID_USERDATA,3])
		prop["scale_z"].append(userWrapper[c4d.ID_USERDATA,2])

		# ignore user matrix
		userProp = keyframes["user"]["property"]
		userProp["position"][-3] = 0
		userProp["position"][-2] = 0
		userProp["position"][-1] = 0
		userProp["scale"][-3] = 1
		userProp["scale"][-2] = 1
		userProp["scale"][-1] = 1

	#-------------------------
	# part A2

	if f == keyframes["user_children"]["in_frame"]:

		print "init user_children"

		prop = keyframes["user_children"]["property"]

		for i in xrange(8):
			prop.append({
				"enabled": [],
				"weight": {
					"emo-spherize": []
				},
				"position": [],
				"quaternion": [],
				"scale": []
			})

	if keyframes["user_children"]["in_frame"] <= f <= keyframes["user_children"]["out_frame"]:

		for i, child in enumerate(children):
			childPoly = childrenPoly[i]
			childMorph = childPoly.GetTag(c4d.Tposemorph)
			prop = keyframes["user_children"]["property"][i]
			enabled = childPoly[c4d.ID_BASEOBJECT_VISIBILITY_EDITOR] == 2

			prop["enabled"].append(enabled)
			prop["weight"]["emo-spherize"].append(childMorph[4000,4301])

			if enabled:
				prop["position"].extend(toPosition(child.GetAbsPos()))
				prop["quaternion"].extend(toQuaternion(child.GetMg()))
				prop["scale"].extend(toScale(child.GetAbsScale()))
			else:
				prop["position"].extend([0, 0, 0])
				prop["quaternion"].extend([0, 0, 0, 0])
				prop["scale"].extend([1, 1, 1])

def getFaceVertices(face):
	# global morphData

	points = face.GetAllPoints()
	facePoints = points[:eyemouthVertexIndex]
	eyemouthPoints = points[eyemouthVertexIndex:]

	# vertices
	faceVertices = []
	for pt in facePoints:
		faceVertices.extend(toFaceVertex(pt))
	
	eyemouthVertices = []
	for pt in eyemouthPoints:
		eyemouthVertices.extend(toFaceVertex(pt))

	return (faceVertices, eyemouthVertices)

#========================================
def main():

	setFrame(0)

	f = 0
	for f in range(0, duration):
		setFrame(f)
		addFrame(f)

		if escPressed():
			break

	with open(destFile, 'w') as outFile:
		json.dump(keyframes, outFile, separators=(',',':'))

	print "Done (%04d/%04d)" % (f, duration)
	
if __name__=='__main__':
	main()
