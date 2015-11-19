import c4d
from c4d import gui, utils
import json
import time, os, math
from c4d.modules import mograph as mo
import gzip

# from Quaternion import Quat

import numpy as np
import quaternions

#========================================
# config

scale = 1.0 / 150.0

eyemouthVertexIndex = 342
eyemouthFaceIndex = 616

audioInPoint = 180
duration = 3821

inFrame = {
    "I": 0,
    "A1": 418,
    "A2": 837,
    "A3": 1256,
    "particles-in": 1347,
    "slice-in": 1662,
    "B": 1674,
    "slice-all": 1767,
    "particles-out": 2040,
    "C": 2094,
    "slice-out": 2120,
    "D": 2512,
    "E": 2722,
    "falling-out": 2753,
    "O1": 3142,
    "O2": 3356
}

ePosition = [0, 0, 0]
eQuaternion = [0, 0, 0, 1]
eScale = [1, 1, 1]

doc = c4d.documents.GetActiveDocument()
fps = doc[c4d.DOCUMENT_FPS]

projDir = os.path.normpath(doc.GetDocumentPath() + "/../")

mouthVertexIndices = [56, 57, 58, 59, 62, 65, 176, 182, 183, 230, 231, 232, 234, 236, 338, 341]
mouthPolygons = [
    [5,8,7], [4,5,7], [4,7,6], [2,4,6], [2,6,1], [3,2,1], [3,0,1],
    [5,15,8], [13,15,5], [13,14,15], [11,14,13], [11,10,14], [12,10,11], [12,9,10]
]

#========================================
def search(name):
    return doc.SearchObject(name)


# zInvMat = c4d.Matrix()
# zInvMat.Scale(c4d.Vector(1.0, 1.0, -1.0))


def toRGBA(r, g, b, a):
    return {
        "r": r / 255.0,
        "g": g / 255.0,
        "b": b / 255.0,
        "a": a
    }

def toRGB(r, g, b):
    return {
        "r": r / 255.0,
        "g": g / 255.0,
        "b": b / 255.0
    }


def toScaleFromMatrix(m):

    scale = [
        m.v1.GetLength(),
        m.v2.GetLength(),
        m.v3.GetLength()
    ]

    return scale

def toMatrix(mg):
    v1, v2, v3, off = mg.v1, mg.v2, mg.v3, mg.off

    return [
        v1.x, v1.y, -v1.z,
        v2.x, v2.y, -v2.z,
        v3.x, v3.y, -v3.z,
        off.x, off.y, -off.z,
    ]

def toPosition(point):
	return [
		point.x,
		point.y,
		point.z * -1
	]

def toFaceVertex(point):
    return [
        point.x * scale,
        point.y * scale,
        point.z * scale * -1
    ]

def toQuaternion(mg):

    mg.Normalize()

    v1, v2, v3 = mg.v1, mg.v2, mg.v3

    mat = np.array([
        [v1.x, v1.y, v1.z],
        [v2.x, v2.y, v2.z],
        [v3.x, v3.y, v3.z]
    ])

    q = quaternions.mat2quat(mat)

    return [q[1], q[2], -q[3], q[0]]


def toScale(scale):
    return [scale.x, scale.y, scale.z]

json.encoder.FLOAT_REPR = lambda o: format(o, '.6f').rstrip('0').rstrip('.')

#========================================
def escPressed():
    bc = c4d.BaseContainer()
    rs = gui.GetInputState( c4d.BFM_INPUT_KEYBOARD, c4d.KEY_ESC, bc )
    if rs and bc[ c4d.BFM_INPUT_VALUE ]:
        return True
    return False

def setFrame(f):
    doc.SetTime(c4d.BaseTime(f + audioInPoint, fps))
    redraw()

def setAbsFrame(f):
    doc.SetTime(c4d.BaseTime(f, fps))
    redraw()

def redraw():
    c4d.DrawViews(c4d.DA_ONLY_ACTIVE_VIEW|c4d.DA_NO_THREAD|c4d.DA_NO_REDUCTION|c4d.DA_STATICBREAK)
    c4d.GeSyncMessage(c4d.EVMSG_TIMECHANGED)
    c4d.EventAdd(c4d.EVENT_ANIMATE|c4d.EVENT_FORCEREDRAW)
