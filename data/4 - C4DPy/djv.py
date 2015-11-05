import c4d
from c4d import gui
import json
import time, os, math
from c4d.modules import mograph as mo

from Quaternion import Quat

#========================================
# config

scale = 1.0 / 150.0

eyemouthVertexIndex = 342
eyemouthFaceIndex = 616

audioInPoint = 180
duration = 1844 #3821

inFrame = {
    "I": 0,
    "A1": 418,
    "A2": 837,
    "A3": 1256,
    "B": 1674,
    "C": 2093,
    "D": 2512,
    "E": 2902,
    "O1": 3142,
    "O2": 3356
}

doc = c4d.documents.GetActiveDocument()
fps = doc[c4d.DOCUMENT_FPS]

projDir = os.path.normpath(doc.GetDocumentPath() + "/../")

#========================================
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

threeMat = c4d.Matrix()
threeMat.Scale(c4d.Vector(1, 1, -1))

quat = Quat((0, 0, 0))

show = False

def toQuaternion(mg):

    # mg = threeMat * mg

    v1, v2, v3 = mg.v1, mg.v2, mg.v3

    quat = Quat([
        [v1.x, v1.y, v1.z],
        [v2.x, v2.y, v2.z],
        [v3.x, v3.y, v3.z]
    ])
    q = quat.q

    q[2] *= -1
    # q[3] *= -1

    return q


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
