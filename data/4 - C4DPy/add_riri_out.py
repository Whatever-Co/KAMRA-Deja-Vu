from djv import *
import shutil

originalPath = projDir + "/0b/data/3 - JSON/riri-out_original.json"

def main():
	with open(originalPath, 'r') as srcFile:
		original = json.load(srcFile)

	print original



if __name__=='__main__':
	main()
