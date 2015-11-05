from djv import *

#========================================
# config

destFile = projDir + "/0b/experiments/14 - Keyframes test/public/keyframes.json"

# user face
cam = doc.SearchObject("Camera")

box = doc.SearchObject("Cube")

#========================================
# keyframe format

keyframes = {
	"camera": {
		"in_frame": 0,
		"out_frame": 119,
		"property": {
			"position": [],
			"quaternion": [],
			"fov": []
		}
	},
	"box": {
		"in_frame": 0,
		"out_frame": 119,
		"property": {
			"position": [],
			"quaternion": [],
			"scale": []
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

	boxProp = keyframes["box"]["property"]
	boxProp["position"].extend(toPosition(box.GetAbsPos()))
	boxProp["quaternion"].extend(toQuaternion(box.GetMg()))
	boxProp["scale"].extend(toScale(box.GetAbsScale()))

#========================================
def main():

	setFrame(0)

	f = 0
	for f in range(0, 120):
		setFrame(f-180)
		addFrame(f)

		if escPressed():
			break

	with open(destFile, 'w') as outFile:
		json.dump(keyframes, outFile, separators=(',',':'))

	print "Done (%04d/%04d)" % (f, duration)
	
if __name__=='__main__':
	main()
