from djv import *
import shutil

#========================================
# config

destKeyframeFile = projDir + "/0b/data/3 - JSON/keyframes.json"
destKeyframeTest = projDir + "/0b/data/3 - JSON/keyframes_test.json"
destKeyframeGz = projDir + "/0b/data/3 - JSON/keyframes.json.gz"
destConfigFile = projDir + "/0b/data/3 - JSON/config.json"

keyframeDupPath = [
	projDir + "/0b/main/public/data/keyframes.json.gz"
]

# user face
cam = doc.SearchObject("Camera")

user = doc.SearchObject("user")
userWrapper = doc.SearchObject("user_wrapper")
userOff = search("user_main_off")
userMorph = user.GetTag(c4d.Tposemorph)

children = [doc.SearchObject("child.%d" % i) for i in xrange(8)]
childrenPoly = [child.GetChildren()[0] for child in children]

webcam = search("&&&&webcam&&&&")

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

# particles
particlesMeshContainer = search("user_particles_mesh_container")
particlesMeshRefs = particlesMeshContainer.GetChildren()
particlesList = search("particles_list").GetChildren()
particlesCount = len(particlesList)

# slices
sliceRow = [search("user_slice.%d" % i) for i in xrange(5)]
sliceCloner = search("slices-cloner")
sliceMainIndex = 4
sliceAlt = search("slice_alt.poly")

# falling
fallingCloner = search("falling_cloner")
fallingClonerCount = mo.GeGetMoData(fallingCloner).GetCount()

fallingMeshContainer = search("falling_meshes_container")
fallingMeshCount = len(fallingMeshContainer.GetChildren())
fallingMeshes = [obj.GetDown() for obj in fallingMeshContainer.GetChildren()]

# mosaic
mosaicTime = search("mosaic_time")

# o2
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
		"out_frame": inFrame["O1"]-1,
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
			"webcam_fade": [],
			"turbulance": []
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
		"out_frame": 1620,
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
		"in_frame": inFrame["particles-in"],
		"out_frame": inFrame["particles-out"]-1,
		"property": [
			{
				"enabled": [],
				"position": [],
				"quaternion": [],
				"mesh_index": []
			} for i in xrange(particlesCount)
		]
	},

	#----------
	# B

	"slice_row": {
		"in_frame": inFrame["slice-in"],
		"out_frame": inFrame["slice-out"]-1,
		"property": [
			{"offset_x": [], "rotation": []},
			{"offset_x": [], "rotation": []},
			{"offset_x": [], "rotation": []},
			{"offset_x": [], "rotation": []},
			{"offset_x": [], "rotation": []}
		]
	},

	"slice_col": {
		"in_frame": inFrame["slice-in"],
		"out_frame": inFrame["slice-out"]-1,
		"property": [
			{
				"position": [],
				"quaternion": []
			}
			for i in xrange(9)
		]
	},

	"slice_alt": {
		"in_frame": inFrame["slice-all"],
		"out_frame": inFrame["slice-out"]-1,
		"property": {
			"face_vertices": [],
			"eyemouth_vertices": []
		}
	},

	#----------
	# D
	
	"falling_children_mesh": {
		"in_frame": inFrame["D"],
		"out_frame": inFrame["falling-out"]-1,
		"property": [
			{
				"face_vertices": [],
				"eyemouth_vertices": []
			} for i in xrange(fallingMeshCount)
		]
	},

	"falling_children": {
		"in_frame": inFrame["D"],
		"out_frame": inFrame["O1"]-1,
		"property": [
			{
				"position": [],
				"quaternion": [],
				"scale": []
			} for i in xrange(fallingClonerCount)
		]
	},

	#----------
	# E - O

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
			"turbulance": [],
			"interpolation": []
		}
	}
}

#========================================
# config format

config = None

def initConfig():
	global config

	slitscanPlane = search("slitscan_plane")
	slitscanCam = search("slit_camera.uv")

	mosaicFace = search("mosaic_face")

	mosaicRandUniform = search("mosaic_rand_uniform")
	mosaicRandZ = search("mosaic_rand_z")

	mosaicRandX = mosaicRandUniform[c4d.ID_MG_BASEEFFECTOR_POSITION,c4d.VECTOR_X]
	mosaicRandY = mosaicRandUniform[c4d.ID_MG_BASEEFFECTOR_POSITION,c4d.VECTOR_Y]

	mosaicRandZamp = float(-mosaicRandZ[c4d.ID_MG_BASEEFFECTOR_POSITION,c4d.VECTOR_Z])
	mosaicRandZmin = mosaicRandZamp * mosaicRandZ[c4d.ID_MG_BASEEFFECTOR_MINSTRENGTH]
	mosaicRandZmax = mosaicRandZamp * mosaicRandZ[c4d.ID_MG_BASEEFFECTOR_MAXSTRENGTH]

	sliceColRangeMain = (inFrame["slice-in"], inFrame["C"]-1)
	sliceColRangeSide = (inFrame["slice-all"], inFrame["slice-out"]-1)

	config = {
		"effects": {
			"intro_overlay": toRGBA(16, 23, 31, 0.4),
			"bgcolor": toRGB(16, 23, 28)
		},
		"i_extra": {
			"zoom_force": 0.88
		},
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
		"user_particles": {
			"scale": toScale(particlesList[0].GetRelScale())
		},
		"slice_row": [
			{"cut_y": search("cut.y.%d" % i).GetRelPos().y * scale}  for i in xrange(5)
		],
		"slice_col": [
			{
				"enabled_in_frame": sliceColRangeMain[0] if i == sliceMainIndex else sliceColRangeSide[0],
				"enabled_out_frame": sliceColRangeMain[1] if i == sliceMainIndex else sliceColRangeSide[1]
			}
			for i in xrange(9)
		],
		"slitscan": {
			"plane_position": toPosition(slitscanPlane.GetMg().off),
			"plane_dimension": [slitscanPlane[c4d.PRIM_PLANE_WIDTH], slitscanPlane[c4d.PRIM_PLANE_HEIGHT]],
			"camera_position": toPosition(slitscanCam.GetRelPos()),
			"camera_fov": 12,
			"uv_in_frame": 2094,
			"uv_out_frame": 2511,
			"cross_section_color": toRGB(11, 49, 73)
		},
		"falling_children": [],
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
	conf = config["user_particles_mesh"]
	particleMeshes = search("user_particles_mesh_container").GetChildren()

	for mesh in particleMeshes:
		faceVertices, eyemouthVertices = getFaceVertices(user)
		conf.append({
			"face_vertices": faceVertices,
			"eyemouth_vertices": eyemouthVertices
		})

	# falling children
	conf = config["falling_children"]
	fallingChildren = fallingCloner.GetChildren()

	for i in xrange(fallingClonerCount):
		name = fallingChildren[i][c4d.INSTANCEOBJECT_LINK][c4d.ID_BASELIST_NAME]
		index = int(name[-1])
		conf.append({"mesh_index": index})
		


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
	cameraProp["position"].extend(toPosition(cam.GetMg().off))
	cameraProp["quaternion"].extend(toQuaternion(cam.GetMg()))
	cameraProp["fov"].append(math.degrees(cam[c4d.CAMERAOBJECT_FOV_VERTICAL]))
	cameraProp["focus_distance"].append(cam[c4d.CAMERAOBJECT_TARGETDISTANCE])

	#-------------------------
	# user kf

	if f <= keyframes["user"]["out_frame"]:
		userProp = keyframes["user"]["property"]
		faceVertices, eyemouthVertices = getFaceVertices(user)

		userProp["position"].extend(toPosition(userOff.GetMg().off))
		userProp["quaternion"].extend(toQuaternion(userOff.GetMg()))
		userProp["scale"].extend(toScaleFromMatrix(userOff.GetMg()))

		appendVertices(userProp, "face_vertices", faceVertices)
		appendVertices(userProp, "eyemouth_vertices", eyemouthVertices)

	#-------------------------
	# i kf

	if f <= keyframes["i_extra"]["out_frame"]:
		curl = doc.SearchObject("user_curl")
		curlRot = doc.SearchObject("user_curl_rot")

		prop = keyframes["i_extra"]["property"]
		prop["curl_strength"].append(curl[c4d.DEFORMOBJECT_STRENGTH])
		prop["curl_rotation"].append(curlRot.GetRelRot().x)
		prop["curl_offset"].append(curl.GetRelPos().y)
		prop["scale_z"].append(userWrapper[c4d.ID_USERDATA,2])

		prop["webcam_fade"].append(webcam[c4d.ID_USERDATA,1])
		prop["turbulance"].append(webcam[c4d.ID_USERDATA,2])

		prop["interpolation"].append(userWrapper[c4d.ID_USERDATA,3])

		# ignore user matrix
		userProp = keyframes["user"]["property"]
		userProp["position"][-3] = 0
		userProp["position"][-2] = 0
		userProp["position"][-1] = 0
		userProp["scale"][-3] = 1
		userProp["scale"][-2] = 1
		userProp["scale"][-1] = 1

	#-------------------------
	# a kf

	if keyframes["user_children"]["in_frame"] <= f <= keyframes["user_children"]["out_frame"]:

		for i, child in enumerate(children):
			childPoly = childrenPoly[i]
			texName = childPoly.GetTag(c4d.Ttexture)[c4d.TEXTURETAG_MATERIAL].GetName()

			prop = keyframes["user_children"]["property"][i]
			conf = config["user_children"][i]

			enabled = childPoly[c4d.ID_BASEOBJECT_VISIBILITY_EDITOR] == 2

			if conf["stranger_in_frame"] == None and texName != "user_face_front":
				conf["stranger_in_frame"] = f

			if enabled:
				faceVertices, eyemouthVertices = getFaceVertices(childPoly)

				prop["position"].extend(toPosition(child.GetAbsPos()))
				prop["quaternion"].extend(toQuaternion(child.GetMg()))
				prop["scale"].extend(toScaleFromMatrix(child.GetMg()))

				# print prop["face_vertices"]
				appendVertices(prop, "face_vertices", faceVertices)
				appendVertices(prop, "eyemouth_vertices", eyemouthVertices)

				if conf["enabled_in_frame"] == None:
					conf["enabled_in_frame"] = f

			else:
				prop["position"].extend(ePosition)
				prop["quaternion"].extend(eQuaternion)
				prop["scale"].extend(eScale)
				prop["face_vertices"].append(None)
				prop["eyemouth_vertices"].append(None)


	#-------------------------
	# part A3

	if keyframes["user_alt"]["in_frame"] <= f <= keyframes["user_alt"]["out_frame"]:

		# print "%d" % f

		for i in xrange(2):
			userAlt = userAlts[i]
			userAltOff = userAltsOff[i]
			userAltRoot = userAltsRoot[i]
			prop = keyframes["user_alt"]["property"][i]
			enabled = userAltRoot[c4d.ID_BASEOBJECT_VISIBILITY_EDITOR] == 2

			prop["enabled"].append(enabled)

			if enabled:
				faceVertices, eyemouthVertices = getFaceVertices(userAlt)

				# if i == 0:
				# 	print "[%d]" % i
				# 	print toPosition(userAlt.GetMg().off)

				prop["position"].extend(toPosition(userAltOff.GetMg().off))
				prop["quaternion"].extend(toQuaternion(userAltOff.GetMg()))
				prop["scale"].extend(toScaleFromMatrix(userAltOff.GetMg()))
				appendVertices(prop, "face_vertices", faceVertices)
				appendVertices(prop, "eyemouth_vertices", eyemouthVertices)

			else:
				prop["position"].extend(ePosition)
				prop["quaternion"].extend(eQuaternion)
				prop["scale"].extend(eScale)
				prop["face_vertices"].append(None)
				prop["eyemouth_vertices"].append(None)

			

	if keyframes["user_particles"]["in_frame"] <= f <= keyframes["user_particles"]["out_frame"]:

		for i, prop in enumerate(keyframes["user_particles"]["property"]):
			particle = particlesList[i]
			m = particle.GetMg()
			enabled = particle[c4d.ID_BASEOBJECT_GENERATOR_FLAG] == 1
			meshName = particle[c4d.INSTANCEOBJECT_LINK][c4d.ID_BASELIST_NAME]
			meshIndex = int(meshName[-1])

			prop["enabled"].append(enabled)
			prop["mesh_index"].append(meshIndex)

			if enabled:
				prop["position"].extend(toPosition(m.off))
				prop["quaternion"].extend(toQuaternion(m))
			else:
				prop["position"].extend(ePosition)
				prop["quaternion"].extend(eQuaternion)

	#-------------------------
	# Slices

	if keyframes["slice_row"]["in_frame"] <= f <= keyframes["slice_row"]["out_frame"]:

		for i in xrange(5):
			sr = sliceRow[i]
			prop = keyframes["slice_row"]["property"][i]

			prop["offset_x"].append(sr.GetRelPos().x)
			prop["rotation"].append(sr.GetRelRot().x)

	if keyframes["slice_col"]["in_frame"] <= f <= keyframes["slice_col"]["out_frame"]:

		sliceMainIndex = 4
		md = mo.GeGetMoData(sliceCloner)
		matrices = md.GetArray(c4d.MODATA_MATRIX)


		for i in xrange(9):
			prop = keyframes["slice_col"]["property"][i]
			m = matrices[i]

			if f < inFrame["slice-all"]: # only main
				if i == sliceMainIndex:
					prop["position"].extend(toPosition(m.off))
					prop["quaternion"].extend(toQuaternion(m))
				else:
					prop["position"].extend(ePosition)
					prop["quaternion"].extend(eQuaternion)

			elif f < inFrame["C"]: # all
				prop["position"].extend(toPosition(m.off))
				prop["quaternion"].extend(toQuaternion(m))

			else: # wipe out
				if i == sliceMainIndex:
					prop["position"].extend(ePosition)
					prop["quaternion"].extend(eQuaternion)
				else:
					prop["position"].extend(toPosition(m.off))
					prop["quaternion"].extend(toQuaternion(m))

	if keyframes["slice_alt"]["in_frame"] <= f <= keyframes["slice_alt"]["out_frame"]:

		prop = keyframes["slice_alt"]["property"]
		faceVertices, eyemouthVertices = getFaceVertices(sliceAlt)

		prop["face_vertices"].append(faceVertices)
		prop["eyemouth_vertices"].append(eyemouthVertices)


	#-------------------------
	# Falling

	if keyframes["falling_children_mesh"]["in_frame"] <= f <= keyframes["falling_children_mesh"]["out_frame"]:
		
		# mesh
		for i, prop in enumerate(keyframes["falling_children_mesh"]["property"]):
			faceVertices, eyemouthVertices = getFaceVertices(fallingMeshes[i])
			prop["face_vertices"].append(faceVertices)
			prop["eyemouth_vertices"].append(eyemouthVertices)

	if keyframes["falling_children"]["in_frame"] <= f <= keyframes["falling_children"]["out_frame"]:
		# children
		matrices = mo.GeGetMoData(fallingCloner).GetArray(c4d.MODATA_MATRIX)
		mg = fallingCloner.GetMg()

		for i, prop in enumerate(keyframes["falling_children"]["property"]):
			m = mg * matrices[i]
			scale = toScaleFromMatrix(m)

			prop["position"].extend(toPosition(m.off))
			prop["quaternion"].extend(toQuaternion(m))
			prop["scale"].extend(scale)


	#-------------------------
	# Mosaic

	if keyframes["mosaic"]["in_frame"] <= f <= keyframes["mosaic"]["out_frame"]:
		prop = keyframes["mosaic"]["property"]
		prop["time"].append(1 - mosaicTime[c4d.MGGROUPEFFECTOR_STRENGTH])

	#-------------------------
	# Part O2

	# print "O2"
	# print keyframes["o2_extra"]["in_frame"] <= f <= keyframes["o2_extra"]["out_frame"]

	if keyframes["o2_extra"]["in_frame"] <= f <= keyframes["o2_extra"]["out_frame"]:
		# print "Ow!!!!"

		prop = keyframes["o2_extra"]["property"]

		prop["webcam_fade"].append(webcam[c4d.ID_USERDATA,1])
		prop["turbulance"].append(webcam[c4d.ID_USERDATA,2])
		prop["interpolation"].append(webcamLast[c4d.ID_USERDATA,2])


def getFaceVertices(face):
	# global morphData

	faceCache = face.GetDeformCache()

	if faceCache == None:
		faceCache = face

	points = faceCache.GetAllPoints()

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

	c4d.CallCommand(13957)

	testFrame = None#1767

	setFrame(0)
	initConfig()

	# duration = 1640

	if testFrame == None:

		f = 0
		for f in xrange(0, duration):
			setFrame(f)
			addFrame(f)

			if escPressed():
				break

		with open(destKeyframeFile, 'w') as outFile:
			json.dump(keyframes, outFile, separators=(',',':'))

		with open(destKeyframeFile, 'rb') as inFile:
			with gzip.open(destKeyframeGz, 'wb') as outFile:
				outFile.writelines(inFile)

		with open(destKeyframeGz, 'r') as srcFile:
			for path in keyframeDupPath:
				with open(path, 'w') as destFile:
					shutil.copyfileobj(srcFile, destFile)

		with open(destConfigFile, 'w') as outFile:
			json.dump(config, outFile, separators=(',',':'))

		print "Done (%04d/%04d)" % (f, duration)


	else:
		setFrame(testFrame)
		addFrame(testFrame)

		with open(destKeyframeTest, 'w') as outFile:
			json.dump(keyframes, outFile, indent=4)
	
		print "finished  - %d" % testFrame

if __name__=='__main__':
	main()
