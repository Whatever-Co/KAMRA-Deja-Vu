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
childrenMat = [doc.SearchMaterial("stranger.%d" % i) for i in xrange(8)]

userAltsRoot = [
	search("user_alt0_root"),
	search("user_alt1_root")
]
userAltsOff = [
	search("user_alt0_off"),
	search("user_alt1_off")
]
userAlts = [
	search("user_alt0"),
	search("user_alt1")
]


slices = [search("user_slice.%d" % i) for i in xrange(5)]
sliceStrangerOrder = [5, 6, 3, 0, -1, 2, 7, 1, 4]

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
		"out_frame": 1661,
		"property": {
			"position": [],
			"quaternion": [],
			"scale": [],
			"face_vertices": [],
			"eyemouth_vertices": []
		}
	},

	#----------
	# I

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

	#----------
	# A2 - A3

	"user_children": {
		"in_frame": inFrame["A2"],
		"out_frame": 1766,
		"property": [
		]
	},

	#----------
	# A3

	"user_alt": {
		"in_frame": 1380,
		"out_frame": 1470,
		"property": [
			{
				"enabled": [],
				"position": [],
				"quaternion": [],
				"scale": [],
				"face_vertices": [],
				"eyemouth_vertices": []
			},
			{
				"enabled": [],
				"position": [],
				"quaternion": [],
				"scale": [],
				"face_vertices": [],
				"eyemouth_vertices": []
			}
		]

	},

	#----------
	# B
	"slice_row": {
		"in_frame": 1662,
		"out_frame": 2119,
		"property": [
			{"offset_x": [], "rotation": []},
			{"offset_x": [], "rotation": []},
			{"offset_x": [], "rotation": []},
			{"offset_x": [], "rotation": []},
			{"offset_x": [], "rotation": []}
		]
	},

	"slice_col": {
		"in_frame": 1662,
		"out_frame": 2119,
		"property": [
			{
				"stranger_id": "stranger_%02d" % sliceStrangerOrder[i],
				"position_x": (i-4) * 200,
				"enabled": []
			}
			for i in xrange(9)
		]
	},

	"b_extra": {
		"in_frame": inFrame["B"],
		"out_frame": inFrame["C"]-1,
		"property": {
			"scale_z": []
		}
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
	# part A2 - A3

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
				"scale": [],
				"stranger_id": "stranger_%02d" % i,
				"stranger_weight": []
			})

	if keyframes["user_children"]["in_frame"] <= f <= keyframes["user_children"]["out_frame"]:

		for i, child in enumerate(children):
			childPoly = childrenPoly[i]
			childMorph = childPoly.GetTag(c4d.Tposemorph)
			childMat = childrenMat[i]
			prop = keyframes["user_children"]["property"][i]
			enabled = childPoly[c4d.ID_BASEOBJECT_VISIBILITY_EDITOR] == 2

			prop["enabled"].append(enabled)
			prop["weight"]["emo-spherize"].append(childMorph[4000,4301])
			prop["stranger_weight"].append(childMat[c4d.MATERIAL_LUMINANCE_BRIGHTNESS])

			if enabled:
				prop["position"].extend(toPosition(child.GetAbsPos()))
				prop["quaternion"].extend(toQuaternion(child.GetMg()))
				prop["scale"].extend(toScale(child.GetAbsScale()))
			else:
				prop["position"].extend([0, 0, 0])
				prop["quaternion"].extend([0, 0, 0, 1])
				prop["scale"].extend([1, 1, 1])

	#-------------------------
	# part A3

	if keyframes["user_alt"]["in_frame"] <= f <= keyframes["user_alt"]["out_frame"]:

		for i in xrange(2):
			userAlt = userAlts[i]
			userAltOff = userAltsOff[i]
			userAltRoot = userAltsRoot[i]
			prop = keyframes["user_alt"]["property"][i]
			enabled = userAltRoot[c4d.ID_BASEOBJECT_VISIBILITY_EDITOR] == 2

			prop["enabled"].append(enabled)

			if enabled:
				faceVertices, eyemouthVertices = getFaceVertices(userAlt)

				prop["position"].extend(toPosition(userAltOff.GetAbsPos()))
				prop["quaternion"].extend(toQuaternion(userAltOff.GetMg()))
				prop["scale"].extend(toScale(userAltOff.GetAbsScale()))
				prop["face_vertices"].append(faceVertices)
				prop["eyemouth_vertices"].append(eyemouthVertices)

			else:
				prop["position"].extend([0, 0, 0])
				prop["quaternion"].extend([0, 0, 0, 1])
				prop["scale"].extend([1, 1, 1])
				prop["face_vertices"].append(None)
				prop["eyemouth_vertices"].append(None)

	#-------------------------
	# part B

	if keyframes["slice_row"]["in_frame"] <= f <= keyframes["slice_row"]["out_frame"]:

		for i in xrange(5):
			slice = slices[i]
			prop = keyframes["slice_row"]["property"][i]

			prop["offset_x"].append(slice.GetRelPos().x)
			prop["rotation"].append(slice.GetRelRot().x)

	if keyframes["slice_col"]["in_frame"] <= f <= keyframes["slice_col"]["out_frame"]:

		for i in xrange(9):
			prop = keyframes["slice_col"]["property"][i]

			# sidekicks
			if f < 1768:
				prop["enabled"].append(False)
			else:
				prop["enabled"].append(True)

			# main
			if f < 2092:
				keyframes["slice_col"]["property"][4][-1] = True
			else:
				keyframes["slice_col"]["property"][4][-1] = False

	if keyframes["b_extra"]["in_frame"] <= f <= keyframes["b_extra"]["out_frame"]:
		prop = keyframes["b_extra"]["property"]
		prop["scale_z"].append(userWrapper[c4d.ID_USERDATA,2])

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
