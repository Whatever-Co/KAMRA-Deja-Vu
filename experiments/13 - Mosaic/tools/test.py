#!/usr/bin/env python
# coding: UTF-8

import glob
import os
import numpy as np
import cv2
from matplotlib import pyplot
from mpl_toolkits.mplot3d import Axes3D


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
    rows = []
    cols = []
    for path in paths:
        img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        px1 = average_color(img)
        # colors.append(px1[0][0])
        cols.append(px1[0][0])
        if(len(cols) > 10):
            rows.append(cols)
            cols = []
    return np.array(rows)


def plot_image_distance(_imgA, _imgB, saveFile='', useHsv=False):

    fig = pyplot.figure()
    ax = Axes3D(fig)

    if useHsv:
        imgA = cv2.cvtColor(_imgA, cv2.COLOR_BGR2HSV)
        imgB = cv2.cvtColor(_imgB, cv2.COLOR_BGR2HSV)
        ax.set_xlabel("Hue")
        ax.set_ylabel("Saturation")
        ax.set_zlabel("Brightness")
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
        imgA[:, :, 0],
        imgA[:, :, 1],
        imgA[:, :, 2],
        marker="o",
        color="#00cccc")
    ax.scatter(
        imgB[:, :, 0],
        imgB[:, :, 1],
        imgB[:, :, 2],
        marker="^",
        color="#ff6666")

    if saveFile != '':
        fig.savefig(saveFile)
    else:
        pyplot.show()


def plot_dictance_color(paths):
    template = images_to_average_colors(paths)

    for path in paths:
        testImg = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        testImgSmall = pixelate(testImg, 20)
        # Export plot to tmp image
        plot_image_distance(testImgSmall, template, 'tmp.png')
        figImg = cv2.imread('tmp.png', cv2.IMREAD_UNCHANGED)
        # Resize and export
        testImg = cv2.resize(testImg, (512, 600))
        exportPath = os.path.join('plot', os.path.basename(path))
        cv2.imwrite(exportPath,
                    cv2.hconcat([testImg, figImg]))


def plot_average_color(paths):

    for path in paths:
        # pixelate
        img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        img = pixelate(img, 20)

        aveColor = average_color(img)
        aveColor = cv2.resize(aveColor, (img.shape[1], img.shape[0]))
        img = cv2.hconcat([img, aveColor])

        exportPath = os.path.join('average', os.path.basename(path))
        cv2.imwrite(exportPath, img)

if __name__ == '__main__':
    paths = glob.glob('source/*.png')

    # plot_average_color(paths)
    plot_dictance_color(paths)
