from djv import *

#========================================
# config

destKeyframeFile = projDir + "/0b/data/3 - JSON/keyframes.json"
destConfigFile = projDir + "/0b/data/3 - JSON/config.json"

# user face
cam = doc.SearchObject("Camera")

user = doc.SearchObject("user")
userWrapper = doc.SearchObject("user_wrapper")
userMorph = user.GetTag(c4d.Tposemorph)

children = [doc.SearchObject("child.%d" % i) for i in xrange(8)]
childrenPoly = [child.GetChildren()[0] for child in children]
childrenMat = [doc.SearchMaterial("stranger.%d" % i) for i in xrange(8)]

childrenFrac = search("children_frac")

webcamMat = doc.SearchMaterial("webcam")
webcamFadeShader = webcamMat[c4d.MATERIAL_ALPHA_SHADER]

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
			"scale_z": [],
			"webcam_fade": []
		}
	},

	#----------
	# A2 - A3

	"user_children": {
		"in_frame": inFrame["A2"],
		"out_frame": 1766,
		"property": [
			{
				"enabled": [],
				"position": [],
				"quaternion": [],
				"scale": [],
				"face_vertices": [],
				"eyemouth_vertices": [],
			} for i in xrange(8)
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
# config format

config = {
	"user_children": [
		{
			"enabled_in_frame": None,
			"stranger_in_frame": None
		} for i in xrange(8)
	]
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

	if f <= keyframes["i_extra"]["out_frame"]:
		curl = doc.SearchObject("user_curl")
		curlRot = doc.SearchObject("user_curl_rot")

		prop = keyframes["i_extra"]["property"]
		prop["curl_strength"].append(curl[c4d.DEFORMOBJECT_STRENGTH])
		prop["curl_rotation"].append(curlRot.GetRelRot().x)
		prop["curl_offset"].append(curl.GetRelPos().y)
		prop["interpolation"].append(userWrapper[c4d.ID_USERDATA,3])
		prop["scale_z"].append(userWrapper[c4d.ID_USERDATA,2])
		prop["webcam_fade"].append(webcamFadeShader[c4d.COLORSHADER_BRIGHTNESS])

		# ignore user matrix
		userProp = keyframes["user"]["property"]
		userProp["position"][-3] = 0
		userProp["position"][-2] = 0
		userProp["position"][-1] = 0
		userProp["scale"][-3] = 1
		userProp["scale"][-2] = 1
		userProp["scale"][-1] = 1

	#-------------------------
	childrenFracEnabled = childrenFrac[c4d.ID_BASEOBJECT_GENERATOR_FLAG] == 1

	if keyframes["user_children"]["in_frame"] <= f <= keyframes["user_children"]["out_frame"]:

		matrices = None

		if childrenFracEnabled:
			md = mo.GeGetMoData(childrenFrac)
			matrices = md.GetData(c4d.MODATA_MATRIX)

		for i, child in enumerate(children):
			childPoly = childrenPoly[i]
			childMorph = childPoly.GetTag(c4d.Tposemorph)
			childMat = childrenMat[i]

			prop = keyframes["user_children"]["property"][i]
			conf = config["user_children"][i]

			enabled = childPoly[c4d.ID_BASEOBJECT_VISIBILITY_EDITOR] == 2

			if conf["stranger_in_frame"] == None and childMat[c4d.MATERIAL_LUMINANCE_BRIGHTNESS] > 0:
				conf["stranger_in_frame"] = f

			if enabled:
				faceVertices, eyemouthVertices = getFaceVertices(childPoly)

				if childrenFracEnabled:
					prop["position"].extend(toPosition(c))
				else:
					prop["position"].extend(toPosition(child.GetAbsPos()))
					prop["quaternion"].extend(toQuaternion(child.GetMg()))
					prop["scale"].extend(toScale(child.GetAbsScale()))


				prop["face_vertices"].append(faceVertices)
				prop["eyemouth_vertices"].append(eyemouthVertices)

				if conf["enabled_in_frame"] == None:
					conf["enabled_in_frame"] = f

			else:
				prop["position"].extend([0, 0, 0])
				prop["quaternion"].extend([0, 0, 0, 1])
				prop["scale"].extend([1, 1, 1])
				prop["face_vertices"].append(None)
				prop["eyemouth_vertices"].append(None)

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

	with open(destKeyframeFile, 'w') as outFile:
		json.dump(keyframes, outFile, separators=(',',':'))

	with open(destConfigFile, 'w') as outFile:
		json.dump(config, outFile, separators=(',',':'))

	print "Done (%04d/%04d)" % (f, duration)
	
if __name__=='__main__':
	main()
