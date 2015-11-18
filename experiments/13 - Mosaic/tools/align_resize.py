#!/usr/bin/env python
# coding: UTF-8

import glob
from PIL import Image, ImageChops


def crop_alpha(img):
    bg = Image.new(img.mode, img.size, (0, 0, 0, 0))
    diff = ImageChops.difference(img, bg)
    bbox = diff.getbbox()
    if bbox:
        return img.crop(bbox)
    return img


def align_resize(img, size=512):
    if img.size == (size, size):
        print('the same size')
        return img

    rate = 1.0
    if img.size[0] > img.size[1]:
        rate = float(size) / img.size[0]
    else:
        rate = float(size) / img.size[1]
    print(rate)

    img = img.resize((int(img.size[0] * rate), int(img.size[1] * rate)),
                     Image.ANTIALIAS)

    canvasImg = Image.new("RGBA", (size, size))
    canvasImg.paste(img, ((size - img.size[0]) / 2,
                          (size - img.size[1]) / 2))
    return canvasImg
    print('saved : %s' % path)

if __name__ == '__main__':
    paths = glob.glob('source/*.png')

    for path in paths:
        img = Image.open(path)
        img = crop_alpha(img)
        img = align_resize(img, 256)
        img.save(path)
