from djv import *

#========================================
# config

destKeyframeFile = projDir + "/0b/data/3 - JSON/keyframes.json"
destKeyframeGz = projDir + "/0b/data/3 - JSON/keyframes.json.gz"
destConfigFile = projDir + "/0b/data/3 - JSON/config.json"

keyframeDupPath = [
	"/b/experiments/22 - JSON Checker/public/data"
]

# user face
cam = doc.SearchObject("Camera")

user = doc.SearchObject("user")
userWrapper = doc.SearchObject("user_wrapper")
userMorph = user.GetTag(c4d.Tposemorph)

children = [doc.SearchObject("child.%d" % i) for i in xrange(8)]
childrenPoly = [child.GetChildren()[0] for child in children]
childrenMat = [doc.SearchMaterial("stranger.%d" % i) for i in xrange(8)]

childrenFrac = search("children_frac")

webcamMat = doc.SearchMaterial("webcam.begin")
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

particlesCloner = search("user_particles")
particlesVanish = search("user_particles_vanish")
particlesCount = mo.GeGetMoData(particlesCloner).GetCount()
particlesIns = search("user_particles_ins")

slices = [search("user_slice.%d" % i) for i in xrange(5)]
sliceStrangerOrder = [5, 6, 3, 0, -1, 2, 7, 1, 4]


fallingCloner = search("falling_cloner")
fallingCloneCount = mo.GeGetMoData(fallingCloner).GetCount()

mosaicTime = search("mosaic_time")

webcamLast = search("webcam_last")

#========================================
# keyframe format

keyframes = {
	"camera": {
		"in_frame": 0,
		"out_frame": duration-1,
		"property": {
			"position": [],
			"quaternion": [],
			"fov": [],
			"focus_distance": []
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
	# Particles

	"user_particles": {
		"in_frame": inFrame["A3"],
		"out_frame": 1700,
		"property": [
			{
				"enabled": [],
				"position": [],
				"scale": [],
				"quaternion": [],
				"mesh_index": []
			} for i in xrange(particlesCount)
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
	},

	#----------
	# Falling
	
	"falling_children_mesh": {
		"in_frame": inFrame["D"],
		"out_frame": inFrame["O1"]-1,
		"property": [
			{
				"face_vertices": [],
				"eyemouth_vertices": []
			} for i in xrange(1)
		]
	},

	"falling_children": {
		"in_frame": inFrame["D"],
		"out_frame": inFrame["O1"]-1,
		"property": [
			{
				"position": [],
				"quaternion": []
			} for i in xrange(fallingCloneCount)
		]
	},

	#----------
	# B

	"mosaic": {
		"in_frame": 2700,
		"out_frame": inFrame["O2"]-1,
		"property": {
			"time": []
		}
	},

	"o2_extra": {
		"in_frame": inFrame["O2"],
		"out_frame": duration-1,
		"property": {
			"webcam_fade": [],
			"interpolation": []
		}
	}
}

#========================================
# config format

config = None

def initConfig():
	global config

	mosaicFace = search("mosaic_face")

	mosaicRandUniform = search("mosaic_rand_uniform")
	mosaicRandZ = search("mosaic_rand_z")

	mosaicRandX = mosaicRandUniform[c4d.ID_MG_BASEEFFECTOR_POSITION,c4d.VECTOR_X]
	mosaicRandY = mosaicRandUniform[c4d.ID_MG_BASEEFFECTOR_POSITION,c4d.VECTOR_Y]

	mosaicRandZamp = float(-mosaicRandZ[c4d.ID_MG_BASEEFFECTOR_POSITION,c4d.VECTOR_Z])
	mosaicRandZmin = mosaicRandZamp * mosaicRandZ[c4d.ID_MG_BASEEFFECTOR_MINSTRENGTH]
	mosaicRandZmax = mosaicRandZamp * mosaicRandZ[c4d.ID_MG_BASEEFFECTOR_MAXSTRENGTH]

	config = {
		"tracer": {
			"indices": [77, 82, 92, 95, 177, 245, 250, 260, 263],
			"duration": 10
		},
		"user_children": [
			{
				"enabled_in_frame": None,
				"stranger_in_frame": None
			} for i in xrange(8)
		],
		"user_particles_mesh": [],
		"mosaic_face": {
			"position": toPosition(mosaicFace.GetAbsPos()),
			"scale": toScale(mosaicFace.GetAbsScale()),
			"random_x_min": -mosaicRandX,
			"random_x_max": mosaicRandX,
			"random_y_min": -mosaicRandY,
			"random_y_max": mosaicRandY,
			"random_z_min": -mosaicRandZmin,
			"random_z_max": -mosaicRandZmax
		}
	}

	# user_particles_mesh
	particleMeshes = search("user_particles_mesh_container").GetChildren()
	conf = config["user_particles_mesh"]

	for mesh in particleMeshes:

		faceVertices, eyemouthVertices = getFaceVertices(user)

		conf.append({
			"face_vertices": faceVertices,
			"eyemouth_vertices": eyemouthVertices
		})


def appendVertices(prop, name, vertices):

	prop[name].append(vertices)

	# length = len(prop[name])

	# pf = -1
	# while True:
	# 	if length + pf < 0:
	# 		prop[name].append(vertices)
	# 		return

	# 	elif prop[name][pf] != None:
	# 		break
	# 	pf -= 1

	# prevVertices = prop[name][pf]
	# # changed = False
	
	# # for i in xrange(len(vertices)):
	# # 	if vertices[i] != prevVertices[i]:
	# # 		changed = True
	# # 		break

	# if prevVertices != vertices:
	# 	prop[name].append(vertices)
	# else:
	# 	# print "NO CHANGE"
	# 	prop[name].append(None)


#========================================
def addFrame(f):
	global keyframes

	# print "processing.. %04d/%04d" % (f, duration)

	# c4d.StatusSetText("processing.. %04d/%04d" % (f, duration))

	cameraProp = keyframes["camera"]["property"]
	cameraProp["position"].extend(toPosition(cam.GetAbsPos()))
	cameraProp["quaternion"].extend(toQuaternion(cam.GetMg()))
	cameraProp["fov"].append(math.degrees(cam[c4d.CAMERAOBJECT_FOV_VERTICAL]))
	cameraProp["focus_distance"].append(cam[c4d.CAMERAOBJECT_TARGETDISTANCE])

	if f <= keyframes["user"]["out_frame"]:
		userProp = keyframes["user"]["property"]
		faceVertices, eyemouthVertices = getFaceVertices(user)

		userProp["position"].extend(toPosition(userWrapper.GetAbsPos()))
		userProp["quaternion"].extend(toQuaternion(userWrapper.GetMg()))
		userProp["scale"].extend(toScale(userWrapper.GetAbsScale()))

		appendVertices(userProp, "face_vertices", faceVertices)
		appendVertices(userProp, "eyemouth_vertices", eyemouthVertices)

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

				prop["position"].extend(toPosition(child.GetAbsPos()))
				prop["quaternion"].extend(toQuaternion(child.GetMg()))
				prop["scale"].extend(toScale(child.GetAbsScale()))

				# print prop["face_vertices"]
				appendVertices(prop, "face_vertices", faceVertices)
				appendVertices(prop, "eyemouth_vertices", eyemouthVertices)

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
				appendVertices(prop, "face_vertices", faceVertices)
				appendVertices(prop, "eyemouth_vertices", eyemouthVertices)

			else:
				prop["position"].extend([0, 0, 0])
				prop["quaternion"].extend([0, 0, 0, 1])
				prop["scale"].extend([1, 1, 1])
				prop["face_vertices"].append(None)
				prop["eyemouth_vertices"].append(None)

	if keyframes["user_particles"]["in_frame"] <= f <= keyframes["user_particles"]["out_frame"]:

		md = mo.GeGetMoData(particlesCloner)
		matrices = md.GetArray(c4d.MODATA_MATRIX)

		enabled = particlesVanish[c4d.ID_MG_BASEEFFECTOR_STRENGTH] < 1.0
		scale = [particlesCloner[c4d.ID_MG_TRANSFORM_SCALE,c4d.VECTOR_X] for i in xrange(3)]
		meshIndex = int(particlesIns[c4d.INSTANCEOBJECT_LINK].GetName())

		for i in xrange(particlesCount):
			prop = keyframes["user_particles"]["property"][i]
			m = matrices[i]

			prop["enabled"].append(enabled)
			prop["mesh_index"].append(meshIndex)

			if enabled:
				prop["position"].extend(toPosition(m.off))
				prop["scale"].extend(scale)
				prop["quaternion"].extend(toQuaternion(m))
			else:
				prop["position"].extend([0, 0, 0])
				prop["quaternion"].extend([0, 0, 0, 1])
				prop["scale"].extend([0, 0, 0])

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


	#-------------------------
	# Falling

	if keyframes["falling_children_mesh"]["in_frame"] <= f <= keyframes["falling_children_mesh"]["out_frame"]:
		prop = keyframes["falling_children_mesh"]["property"]

		faceVertices, eyemouthVertices = getFaceVertices(user)

		for p in prop:
				appendVertices(p, "face_vertices", faceVertices)
				appendVertices(p, "eyemouth_vertices", eyemouthVertices)

		# children
		prop = keyframes["falling_children"]["property"]
		matrices = mo.GeGetMoData(fallingCloner).GetArray(c4d.MODATA_MATRIX)

		for i in xrange(fallingCloneCount):
			p = prop[i]
			m = matrices[i]

			p["position"].extend(toPosition(m.off))
			p["quaternion"].extend(toQuaternion(m))

	#-------------------------
	# Mosaic

	if keyframes["mosaic"]["in_frame"] <= f <= keyframes["mosaic"]["out_frame"]:
		prop = keyframes["mosaic"]["property"]
		prop["time"].append(1 - mosaicTime[c4d.MGGROUPEFFECTOR_STRENGTH])

	#-------------------------
	# Part O2

	if keyframes["o2_extra"]["in_frame"] <= f <= keyframes["o2_extra"]["out_frame"]:
		prop = keyframes["o2_extra"]["property"]
		prop["webcam_fade"].append(webcamLast[c4d.ID_USERDATA,1])
		prop["interpolation"].append(webcamLast[c4d.ID_USERDATA,2])


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
	initConfig()

	f = 0
	for f in range(0, duration):
		setFrame(f)
		addFrame(f)

		if escPressed():
			break

	with open(destKeyframeFile, 'w') as outFile:
		json.dump(keyframes, outFile, separators=(',',':'))

	with open(destKeyframeFile, 'rb') as inFile:
		with gzip.open(destKeyframeGz, 'wb') as outFile:
			outFile.writelines(inFile)

	with open(destConfigFile, 'w') as outFile:
		json.dump(config, outFile, separators=(',',':'))

	print "Done (%04d/%04d)" % (f, duration)
	
if __name__=='__main__':
	main()
