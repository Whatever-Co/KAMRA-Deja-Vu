#!/usr/bin/env python
# coding: UTF-8

import glob
import os
import pprint
import numpy as np
import cv2
import matplotlib.animation
from matplotlib import pyplot
from mpl_toolkits.mplot3d import Axes3D
import subprocess
from PIL import Image


def pixelate(image, size=20):
    '''Risize to the small image'''
    width = image.shape[0]
    height = image.shape[1]
    return cv2.resize(image, (height / size, width / size))


def average_color(image):
    '''Average Color'''
    width = image.shape[0]
    height = image.shape[1]
    img1px = cv2.resize(image, (1, 1))
    return img1px


def images_to_average_colors(paths):
    '''Convert image path to average colors'''
    colors = []
    rows = []
    cols = []
    for path in paths:
        img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        px1 = average_color(img)
        colors.append(px1[0][0])
    return np.array(colors)


def get_validity_pixels(img):
    '''Filter transparent pixels, Reshape 1d array'''
    nPixels = img.shape[0] * img.shape[1]
    arr = img.reshape(1, nPixels, 4)
    # to 2d matrix
    arr = arr[0]
    # filter transparent pixels
    arr = arr[np.where(arr[:, 3] == 255)]
    # BGRA to BGR
    arr = arr[:, 0:3]
    return arr


def find_nearest_color_index(color, templates):
    distances = ((templates - color)**2).sum(axis=1)
    ndx = distances.argsort()
    # pprint.pprint(zip(templates[ndx[:10]], distances[ndx[:10]]))
    return ndx[0]


def zip_nearest_color(color, templates):
    '''Find nearest color in template colors'''
    index = find_nearest_color_index(colors, templates)
    nearestColor = templates[index]
    return zip(color, nearestColor)


def plot_color_mapping(colors, templates, useHsv=True):
    colorMaps = []
    for color in colors:
        colorMap = zip_nearest_color(color, templates)
        colorMaps.append(colorMap)

    # Draw figures
    fig = pyplot.figure()

    ax = Axes3D(fig)
    if useHsv:
        ax.set_xlabel("Hue")
        ax.set_ylabel("Saturation")
        ax.set_zlabel("Brightness")
        ax.set_xlim(0, 180)
        ax.set_ylim(0, 255)
        ax.set_zlim(0, 255)
    else:
        ax.set_xlabel("Blue")
        ax.set_ylabel("Green")
        ax.set_zlabel("Red")
        ax.set_xlim(0, 255)
        ax.set_ylim(0, 255)
        ax.set_zlim(0, 255)

    def init():
        ax.scatter(  # webcamera face
            colors[:, 0],
            colors[:, 1],
            colors[:, 2],
            marker="o",
            color="#00cccc")
        ax.scatter(  # template face
            templates[:, 0],
            templates[:, 1],
            templates[:, 2],
            marker="^",
            color="#ff6666")

    def update(index):
        print('frame : %d' % index)
        colorMap = colorMaps[index]
        ax.plot(
            colorMap[0],
            colorMap[1],
            colorMap[2],
            color="#0066ff")

    anim = matplotlib.animation.FuncAnimation(
        fig,
        update,
        len(colorMaps),
        init_func=init,
        interval=1,
        blit=True
    )
    writer = matplotlib.animation.FFMpegWriter(fps=60)
    anim.save("color_map.mp4", writer=writer)
    # pyplot.show()
    return colorMaps


def plot_image_distance(_imgA, _imgB, saveFile='', useHsv=False):

    fig = pyplot.figure()
    ax = Axes3D(fig)

    if useHsv:
        imgA = cv2.cvtColor(_imgA, cv2.COLOR_BGR2HSV)
        imgB = cv2.cvtColor(_imgB, cv2.COLOR_BGR2HSV)
        ax.set_xlabel("Hue")
        ax.set_ylabel("Saturation")
        ax.set_zlabel("Brightness")
        ax.set_xlim(0, 180)
        ax.set_ylim(0, 255)
        ax.set_zlim(0, 255)
    else:
        imgA = _imgA
        imgB = _imgB
        ax.set_xlabel("Blue")
        ax.set_ylabel("Green")
        ax.set_zlabel("Red")
        ax.set_xlim(0, 255)
        ax.set_ylim(0, 255)
        ax.set_zlim(0, 255)

    ax.scatter(
        imgA[:, 0],
        imgA[:, 1],
        imgA[:, 2],
        marker="o",
        color="#00cccc")
    ax.scatter(
        imgB[:, 0],
        imgB[:, 1],
        imgB[:, 2],
        marker="^",
        color="#ff6666")

    if saveFile != '':
        fig.savefig(saveFile)
    else:
        pyplot.show()


def plot_average_color(paths):

    for path in paths:
        # pixelate
        img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        img = pixelate(img, 10)

        aveColor = average_color(img)
        aveColor = cv2.resize(aveColor, (img.shape[1], img.shape[0]))
        img = cv2.hconcat([img, aveColor])

        exportPath = os.path.join('average', os.path.basename(path))
        cv2.imwrite(exportPath, img)

    cmd = 'montage average/*.png -tile 8x -geometry 50x25+0+0 average/export.jpg'
    result = subprocess.call(cmd, shell=True)


def plot_dictance_color(paths):
    templates = images_to_average_colors(paths)
    templates = templates[:, 0:3]  # BGRA to BGR
    useHsv = False

    for path in paths:
        img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        imgArr = get_validity_pixels(pixelate(img, 10))
        # Export plot to tmp image
        plot_image_distance(imgArr, templates, 'tmp.png', useHsv)
        figImg = cv2.imread('tmp.png', cv2.IMREAD_UNCHANGED)
        # Resize and export
        img = cv2.resize(img, (600, 600))
        exportPath = os.path.join('plot', os.path.basename(path))
        cv2.imwrite(exportPath,
                    cv2.hconcat([img, figImg]))

    cmd = 'montage plot/*.png -tile 8x -geometry 800x300+0+0 plot/export.jpg'
    result = subprocess.call(cmd, shell=True)


def convert_bgr2hsv_1d(colors):
    bgrImg = colors.reshape(1, colors.shape[0], colors.shape[1])
    hsbImg = cv2.cvtColor(bgrImg, cv2.COLOR_BGR2HSV)
    return hsbImg[0]


def plot_mosaic_color(paths):
    templates = images_to_average_colors(paths)
    templates = templates[:, 0:3]  # BGRA to BGR
    templates = convert_bgr2hsv_1d(templates)
    templates = templates.astype(np.float64)  # to float
    useHsv = False

    for path in paths:
        img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        imgArr = get_validity_pixels(pixelate(img, 20))
        imgArr = convert_bgr2hsv_1d(imgArr)
        imgArr = imgArr.astype(np.float64)  # to float
        # plot_color_mapping(imgArr[:10], templates)
        plot_color_mapping(imgArr, templates)
        # color = (zip_nearest_color(imgArr[:4], templates))
        break


def make_lut():
    colors = []
    for y in range(0, 16):
        rows = []
        for x in range(0, 256):
            rows.append([
                (x / 16) * 16,  # blue
                y * 16,  # green
                (x % 16) * 16  # red
            ])
        colors.append(rows)

    image = np.array(colors)
    cv2.imwrite('lut/lut.png', image)
    return image


def make_spritesheet(paths, cols, size, savePath):
    sprite = Image.new("RGBA", (cols * size, cols * size))
    print(paths)
    for i, path in enumerate(paths):
        img = Image.open(path)
        sprite.paste(img, (i % cols * size, i / cols * size))
    sprite.save(savePath)
    return sprite


def convert_lut(paths):
    '''
    一番近い色空間のやつの、
    肌色 3DLUT
    と
    スプライトシートのIndex指定のLUT
    を生成する
    '''

    # get template
    templates = images_to_average_colors(paths)
    templates = templates[:, 0:3]  # BGRA to BGR
    templates = templates.astype(np.float64)  # to float

    # get lookup table
    img = make_lut()
    imgArr = img.reshape(1, img.shape[0] * img.shape[1], img.shape[2])
    imgArr = imgArr[0]  # strip
    imgArr = imgArr.astype(np.float64)  # to float

    # make maps
    face_lut = img.copy()
    idx_lut = img.copy()
    for y, row in enumerate(face_lut):
        for x, col in enumerate(row):
            print(col)
            index = find_nearest_color_index(col, templates)
            face_lut[y][x] = templates[index]
            # R : index x
            # G : index y
            print("X:{0}, Y:{1}".format(index % 16, index / 16))
            idx_lut[y][x] = (0, index / 16 * 16, index % 16 * 16)

    cv2.imwrite('lut/lut_face.png', face_lut)
    cv2.imwrite('lut/lut_index.png', idx_lut)
    print(idx_lut)

if __name__ == '__main__':
    paths = glob.glob('source/*.png')

    # plot_average_color(paths)
    # plot_dictance_color(paths)
    # plot_mosaic_color(paths)

    # make_spritesheet(paths, 16, 256, 'lut/sprite256.png')
    convert_lut(paths)
