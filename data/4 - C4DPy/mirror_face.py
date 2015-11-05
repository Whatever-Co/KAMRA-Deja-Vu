import c4d
import json
from json import encoder
from c4d import gui
import time
import os
import eulerangles
import math

from c4d.modules import mograph as mo


#========================================
# config

#========================================

doc = c4d.documents.GetActiveDocument()
face = doc.SearchObject("user_face")

origin = doc.SearchObject("face_original")
source = doc.SearchObject("source")

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
        i0 = pair[0]
        i1 = pair[1]
        v0 = vertices[i0]
        v1 = vertices[i1]

        vertices[i0] = c4d.Vector(-v1.x, v1.y, v1.z)
        vertices[i1] = c4d.Vector(-v0.x, v0.y, v0.z)

    # flip center
    for i, vertex in enumerate(faceVertices):
        if abs(vertex.x) < 0.0001:
            vertices[i].x *= -1


    face.SetAllPoints(vertices)
    face.Message(c4d.MSG_UPDATE)

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

    
    
if __name__=='__main__':
    main()
