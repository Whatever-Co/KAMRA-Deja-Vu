#!/usr/bin/env python
# coding: UTF-8

import glob
from PIL import Image


def align_resize(paths, width=512, height=512):
    for path in paths:
        img = Image.open(path)
        print(img.size)
        canvasImg = Image.new("RGBA", (width, height))
        canvasImg.paste(img, ((width - img.size[0]) / 2,
                              (height - img.size[1]) / 2))
        canvasImg.save(path)
        print('saved : %s' % path)

if __name__ == '__main__':
    paths = glob.glob('source/*.png')
    align_resize(paths, 512, 512)
