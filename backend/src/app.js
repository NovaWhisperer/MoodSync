const express = require('express');
const app = express();
const cors = require('cors');
const songRoutes = require('./routes/song.routes');

const corsOrigins = String(process.env.CORS_ORIGIN || '')
	.split(',')
	.map((origin) => origin.trim())
	.filter(Boolean);

const corsOptions = corsOrigins.length
	? {
		  origin: corsOrigins,
	  }
	: {};

// Parse JSON bodies for other routes
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes (multer will handle multipart/form-data at route level)
app.use('/', songRoutes);

module.exports = app;