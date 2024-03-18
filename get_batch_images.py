# imports
import matplotlib.pyplot as plt
import numpy as np
import os
import random
import utils
from random import sample

# project_dir = utils.get_project_dir()
# site = utils.get_site()

class GetBatchImages:
    def __init__(self, batch, batch_identifiers):
        self.site_dir = utils.get_site_dir()
        self.images_dir = 'static/images'
        self.identifiers = np.load(f'{self.site_dir}/data/identifiers.npy')
        self.batch = batch

        os.makedirs(f'{self.images_dir}/batch-{batch}-images', exist_ok=True)

        for identifier in batch_identifiers:
            for modality in ['thermal', 'rgb']:
                self.plot_image_from_id(identifier, modality)
                self.plot_zoomed_out_image_from_id(identifier, modality)

    def plot_image_from_id(self, identifier, modality):
        index = np.where(self.identifiers == identifier)[0][0]

        plt.figure(dpi=300)
        image = plt.imshow(np.load(f'{self.site_dir}/data/{modality}/{modality}-images.npy')[index]) # plot the array of pixel values as an image

        if modality == 'thermal' or modality == 'lidar':
            image.set_cmap('inferno')
        # plt.colorbar()
        plt.axis('off') # remove axes  
        plt.savefig(f'{self.images_dir}/batch-{self.batch}-images/img-{identifier}-{modality}-in.png', bbox_inches='tight', pad_inches=0)
        plt.close() # close the image to save memory

    def plot_zoomed_out_image_from_id(self, identifier, modality):
        #TODO: everywhere it says THERMAL needs to be flexible to RGB in case it has different resolution
        THERMAL_INTERVAL = utils.get_thermal_interval()
        x_pixels, y_pixels = utils.get_image_center_pixels(identifier)
        x, y = utils.get_image_center_meters(x_pixels, y_pixels)
        orthomosaic = np.load(f'{self.site_dir}/data/{modality}/{modality}-orthomosaic-matrix.npy')
        top_row = int(y_pixels - THERMAL_INTERVAL/2)
        bottom_row = int(y_pixels + THERMAL_INTERVAL/2)
        left_column = int(x_pixels - THERMAL_INTERVAL/2)
        right_column = int(x_pixels + THERMAL_INTERVAL/2)
        
        # put a box around the image in question
        for i in range(top_row, bottom_row+1):
            for j in range(left_column, right_column+1):
                if (i == top_row or i == bottom_row) or (j == left_column or j == right_column):
                    orthomosaic[i][j] = 0

        zoomed_out_array = orthomosaic[max(top_row-THERMAL_INTERVAL, 0) : min(bottom_row+THERMAL_INTERVAL, len(orthomosaic)), max(left_column-THERMAL_INTERVAL, 0) : min(right_column+THERMAL_INTERVAL, orthomosaic.shape[1])]

        plt.figure(dpi=300)
        zoomed_out_image = plt.imshow(zoomed_out_array)

        if modality == 'thermal' or modality == 'lidar':
            zoomed_out_image.set_cmap('inferno')

        # plt.colorbar()
        plt.axis('off') # remove axes
        plt.savefig(f'{self.images_dir}/batch-{self.batch}-images/img-{identifier}-{modality}-out.png', bbox_inches='tight', pad_inches=0)
        plt.close() # close the image to save memory
