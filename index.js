const express = require('express');
const app = express();
const connectDB = require("./config/connectDB");
const dotenv  = require('dotenv');
dotenv.config();
connectDB();
