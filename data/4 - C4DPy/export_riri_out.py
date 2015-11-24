from djv import *
import shutil

destPath = projDir + "/0b/data/3 - JSON/riri-out.json"

def main():

	wrapper = search("wrapper")

	samplePoint = search("00")

	points = [search("%02d" % i) for i in xrange(80)]

	sampleTrack = samplePoint.GetCTracks()[0]
	sampleCurve = sampleTrack.GetCurve()

	keyCount = sampleCurve.GetKeyCount()

	data = {}

	for i in xrange(keyCount):
		key = sampleCurve.GetKey(i)
		f = key.GetTime().GetFrame(doc.GetFps())
		ms = key.GetTime().GetFrame(1000)

		doc.SetTime(c4d.BaseTime(f, fps))
		redraw()

		frameData = []

		# print ms

		for point in points:
			pos = point.GetAbsPos()
			frameData.append([pos.x, pos.y])

		data["%d" % ms] = frameData

		# print frameData

	# print data

	with open(destPath, 'w') as outFile:
		json.dump(data, outFile, separators=(',',':'))


	print "saved"





	# for ms in original:
	# 	f = (float(ms) / 1000.0) * 24.0
	# 	doc.SetTime(c4d.BaseTime(f, 24))

	# 	print f

	# 	points = original[ms]

	# 	for i, p in enumerate(points):
	# 		null = search("%02d" % i)
	# 		null.SetAbsPos(c4d.Vector(p[0], p[1], 0))
	# 		doc.RecordKey(null, c4d.ID_BASEOBJECT_REL_POSITION)


if __name__=='__main__':
	main()