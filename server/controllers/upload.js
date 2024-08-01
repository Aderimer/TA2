const express = require('express');
const router = express.Router();
const { Image, gridfsBucket } = require('../models/Post');

router.post('/upload')