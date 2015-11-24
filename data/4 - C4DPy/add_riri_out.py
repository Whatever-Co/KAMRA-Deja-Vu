from djv import *
import shutil

originalPath = projDir + "/0b/data/3 - JSON/riri-out_original.json"

def main():
	with open(originalPath, 'r') as srcFile:
		original = json.load(srcFile)

	wrapper = search("wrapper")

	# create
	testFrame = original['1028']
	for i, p in enumerate(testFrame):
		null = c4d.BaseObject(c4d.Onull)
		null.SetName("%02d" % i)
		null.InsertUnderLast(wrapper)

	# record
	# doc.AutoKey(wrapper, wrapper, True, True, False, False, False, False)

	for ms in original:
		f = (float(ms) / 1000.0) * 24.0
		doc.SetTime(c4d.BaseTime(f, 24))

		print f

		points = original[ms]

		for i, p in enumerate(points):
			null = search("%02d" % i)
			null.SetAbsPos(c4d.Vector(p[0], p[1], 0))
			doc.RecordKey(null, c4d.ID_BASEOBJECT_REL_POSITION)


if __name__=='__main__':
	main()