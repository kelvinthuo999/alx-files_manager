// controllers/FilesController.js

import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import mimeTypes from 'mime-types';
import imageThumbnail from 'image-thumbnail'; // Importing image-thumbnail package

class FilesController {
  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const file = await dbClient.client.db().collection('files').findOne({ _id: ObjectId(req.params.id) });

      if (!file || file.userId.toString() !== userId) {
        return res.status(404).json({ error: 'Not found' });
      }

      res.json({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parentId = req.query.parentId || 0;
    const page = parseInt(req.query.page, 10) || 0;
    const pageSize = 20;
    const skip = page * pageSize;

    try {
      const files = await dbClient.client.db().collection('files')
        .find({ userId, parentId })
        .skip(skip)
        .limit(pageSize)
        .toArray();

      const formattedFiles = files.map(file => ({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      }));

      res.json(formattedFiles);
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { originalname, mimetype, size } = req.file;

      const newFile = {
        userId: ObjectId(userId),
        name: originalname,
        type: mimetype.split('/')[0], // 'image', 'video', 'text', etc.
        isPublic: false,
        parentId: req.body.parentId ? ObjectId(req.body.parentId) : 0,
        createdAt: new Date(),
      };

      const result = await dbClient.client.db().collection('files').insertOne(newFile);
      const { _id } = result.ops[0];

      // Start background processing to generate thumbnails for images
      if (newFile.type === 'image') {
        await FilesController.generateThumbnail(_id.toString());
      }

      res.status(201).json({
        id: _id,
        userId: newFile.userId,
        name: newFile.name,
        type: newFile.type,
        isPublic: newFile.isPublic,
        parentId: newFile.parentId,
      });
    } catch (err) {
      console.error('Error in postUpload:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const file = await dbClient.client.db().collection('files').findOne({ _id: ObjectId(req.params.id) });

      if (!file || file.userId.toString() !== userId) {
        return res.status(404).json({ error: 'Not found' });
      }

      await dbClient.client.db().collection('files').updateOne({ _id: ObjectId(req.params.id) }, { $set: { isPublic: true } });

      res.json({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: true,
        parentId: file.parentId,
      });
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const file = await dbClient.client.db().collection('files').findOne({ _id: ObjectId(req.params.id) });

      if (!file || file.userId.toString() !== userId) {
        return res.status(404).json({ error: 'Not found' });
      }

      await dbClient.client.db().collection('files').updateOne({ _id: ObjectId(req.params.id) }, { $set: { isPublic: false } });

      res.json({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: false,
        parentId: file.parentId,
      });
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async generateThumbnail(fileId) {
    const thumbnailSizes = [500, 250, 100];
    const filePath = path.join(__dirname, '../uploads', fileId);

    try {
      for (let size of thumbnailSizes) {
        const thumbnailPath = `${filePath}_${size}`;
        await FilesController.createThumbnail(filePath, thumbnailPath, size);
      }
    } catch (error) {
      console.error('Error generating thumbnails:', error);
      throw new Error('Failed to generate thumbnails');
    }
  }

  static async createThumbnail(inputPath, outputPath, size) {
    try {
      const thumbnail = await imageThumbnail(inputPath, { width: size });
      fs.writeFileSync(outputPath, thumbnail);
    } catch (error) {
      console.error(`Error generating ${size} thumbnail:`, error);
      throw new Error(`Failed to generate ${size} thumbnail`);
    }
  }

  static async getFileWithThumbnail(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    try {
      const file = await dbClient.client.db().collection('files').findOne({ _id: ObjectId(req.params.id) });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Check if file is public or user is authorized to access it
      if (!file.isPublic && (!userId || file.userId.toString() !== userId)) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Check if file type is 'file', as folders don't have content
      if (file.type !== 'file') {
        return res.status(400).json({ error: 'A folder doesn\'t have content' });
      }

      // Check if file is locally present
      let filePath = path.join(__dirname, '../uploads', file._id.toString());
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Get requested thumbnail size
      let size = req.query.size || 'original';
      if (size !== 'original' && size !== '500' && size !== '250' && size !== '100') {
        return res.status(400).json({ error: 'Invalid size parameter' });
      }

      // Adjust file path based on size
      if (size !== 'original') {
        filePath = `${filePath}_${size}`;
      }

      // Check if adjusted file path exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Get MIME type based on file name
      const mimeType = mimeTypes.contentType(file.name);

      // Return file content with correct MIME type
      res.set('Content-Type', mimeType);
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      console.error('Error in getFileWithThumbnail:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default FilesController;
