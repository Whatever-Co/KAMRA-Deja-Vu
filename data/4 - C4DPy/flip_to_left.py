import c4d
from c4d.modules import mograph as mo


#========================================
# config


#========================================

doc = c4d.documents.GetActiveDocument()
face = doc.GetActiveObject()#doc.SearchObject("child2")

origin = doc.SearchObject("face_original")

#========================================
def main():
    global face

    # search pair face
    eyeOff = 342

    vertices = origin.GetAllPoints()
    faceVertices = vertices[:eyeOff]
    eyeVertices = vertices[eyeOff:]

    pairs = searchPairs(faceVertices, 0)
    pairs.extend(searchPairs(eyeVertices, eyeOff))

    # exchange
    vertices = face.GetAllPoints()

    for pair in pairs:
        il = pair[0]
        ir = pair[1]
        vl = vertices[il]
        vr = vertices[ir]

        if vl.x > 0:
            vl, vr = vr, vl
            il, ir = ir, il

        vertices[il] = c4d.Vector(vr)
        vertices[il].x *= -1

    face.SetAllPoints(vertices)
    face.Message(c4d.MSG_UPDATE)

    redraw()

    print "END"

def searchPairs(vertices, offset):

    pairs = []
    checked = [False for vertex in vertices]

    for index, vertex in enumerate(vertices):
        
        if checked[index]:
            continue

        distance = 100000
        pairIndex = None
        vertexInv = c4d.Vector(-vertex.x, vertex.y, vertex.z)

        for i, v in enumerate(vertices):
            d = (vertexInv - v).GetLengthSquared()
            if index != i and d < 0.001:
                pairIndex = i

        if pairIndex == None:
            checked[index] = True
        else:
            checked[index] = True
            checked[pairIndex] = True
            pairs.append([index + offset, pairIndex + offset])

    return pairs

def redraw():
    c4d.DrawViews(c4d.DA_ONLY_ACTIVE_VIEW|c4d.DA_NO_THREAD|c4d.DA_NO_REDUCTION|c4d.DA_STATICBREAK)
    c4d.GeSyncMessage(c4d.EVMSG_TIMECHANGED)
    c4d.EventAdd(c4d.EVENT_ANIMATE|c4d.EVENT_FORCEREDRAW)   
    
if __name__=='__main__':
    main()
