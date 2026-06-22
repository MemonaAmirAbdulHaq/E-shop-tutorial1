const express = require("express");
const path = require("path");
const User = require("../model/user");
const router = express.Router();
const { upload } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const sendMail = require("../utils/sendMail");
const catchAsyncError = require("../middleware/catchAsyncError");
const sendToken = require("../utils/jwtToken");

router.post("/create-user", upload.single("file"), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const userEmail = await User.findOne({ email });

    if (userEmail) {
      const filename = req.file.filename;
      const filePath = `uploads/${filename}`;
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log(err);
          res.status(500).json({message: "Error deleting file"})
             }
      });
      return next(new ErrorHandler("User already exists", 400));
    }
    const filename = req.file.filename;
    const fileUrl = `uploads/${filename}`;

    const user = {
      name: name,
      email: email,
      password: password,
      avatar: {
        public_id: filename,
        url: fileUrl,
      },
    };
    const activationToken = createActivationToken(user);
    const activationUrl = `http://localhost:3000/activation/${activationToken}`;
    try {
      await sendMail({
        email: user.email,
        subject: "Activate your account",
        message: `Hello ${user.name}, please click on the link to activate your account: ${activationUrl}`,
      });
      res.status(201).json({
        success: true,
        message: `Please check your email:- ${user.email} to activate your account!`,
      });
    } catch (error) {
      console.log(error.response.data.message)
      return next(new ErrorHandler(error.message, 500));
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});


// Generate activation token - changed to 24h and only signing needed fields
const createActivationToken = (user) => {
  return jwt.sign(
    { 
      name: user.name, 
      email: user.email, 
      password: user.password, // make sure this is hashed before signing
      avatar: user.avatar 
    },
    process.env.ACTIVATION_SECRET,
    { expiresIn: "24h" } // was 5m, too short for email verification
  );
};

// Activate user
router.post(
  "/activation",
  catchAsyncError(async (req, res, next) => {
    try {
      const { activation_token } = req.body;

      if (!activation_token) {
        return next(new ErrorHandler("Activation token missing", 400));
      }

      let decoded;
      try {
        decoded = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          return next(new ErrorHandler("your token is expired", 400));
        }
        if (err.name === "JsonWebTokenError") {
          return next(new ErrorHandler("Invalid token", 400));
        }
        return next(new ErrorHandler("Token verification failed", 400));
      }

      const { name, email, password, avatar } = decoded;

      let user = await User.findOne({ email });

      if (user) {
        return next(new ErrorHandler("User already exists", 400));
      }

      user = await User.create({
        name,
        email,
        avatar,
        password,
      });

      sendToken(user, 201, res);
    } catch (error) {
      console.error(error); // log for debugging
      return next(new ErrorHandler("Server error", 500));
    }
  })
);
module.exports = router;
