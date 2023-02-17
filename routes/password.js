require("dotenv").config();
const express = require("express");
const Users = require("../models/Users");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const mailgen = require("mailgen");

const JWT_SECRET = process.env.JWT_SECRET_KEY;
const BASE_URL = process.env.BASE_URL;

//  nodemailer config
let config = {
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_USER_EMAIL,
    pass: process.env.NODEMAILER_USER_PASSWORD,
  },
};

const transporter = nodemailer.createTransport(config);

// Mail genrator
const mailGenrator = new mailgen({
  theme: "salted",
  product: {
    name: "iNotebook",
    link: "https://mailgen.js/",
  },
});

//!ROUTES 1: Password forgot link sending on email: POST '/api/auth/forgotpassword'.
router.post("/forgotpassword", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res
      .status(401)
      .json({ status: "401", message: "Please enter your valid email" });
  } else {
    try {
      // Find user exists or not for password reset link send with correct credetials
      const validUser = await Users.findOne({ email });

      if (!validUser) {
        res
          .status(401)
          .json({ status: "401", message: "This user is not valid" });
      } else {
        //  Create token for verifing password reset link
        const token = jwt.sign({ _id: validUser._id }, JWT_SECRET, {
          expiresIn: "120s",
        });

        //  Save token in database
        let saveToken = await Users.findByIdAndUpdate(
          { _id: validUser._id },
          { verifyToken: token },
          { new: true }
        );

        if (saveToken) {
          const response = {
            body: {
              name: validUser.name,
              greeting: "Dear",
              intro:
                "You have received this email because a password reset request from your account was received.",
              action: {
                instructions:
                  "Click the button below to reset your password and <strong>password reset with 2 minutes otherwise link expired</strong>",
                button: {
                  color: "#0275d8",
                  text: "Reset Your Password",
                  link: `${BASE_URL}/resetpassword/${validUser._id}/${saveToken.verifyToken}`,
                },
              },
              outro:
                "If you did not request a password reset, no further action is required on your part.",
            },
          };

          const mail = mailGenrator.generate(response);

          const message = {
            from: `"iNoteBook App" <${process.env.NODEMAILER_USER_EMAIL}>`,
            to: email,
            subject: "Reset your iNotebook application password",
            html: mail,
          };

          transporter
            .sendMail(message)
            .then(() => {
              res.status(201).json({
                status: "201",
                message: "You should received an mail.",
              });
            })
            .catch((error) => {
              res.status(500).json({
                error,
              });
            });
        }
      }
    } catch (error) {
      res.status(401).json({ error });
    }
  }
});

//!ROUTES 2: Verify user for reset password : GET '/resetpassword/:id/:token'.
router.get("/resetpassword/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  let success = false;

  try {
    // User Verify
    const validUser = await Users.findOne({ _id: id }, { verifyToken: token });

    // Verify Token
    const validToken = jwt.verify(token, JWT_SECRET);

    if (validUser && validToken._id) {
      success = true;
      res.status(200).json({ success, validUser });
    } else {
      success = false;
      res.status(500).json({ success, message: "User does not exist" });
    }
  } catch (error) {
    res.status(500).json({ error });
  }
});

//!ROUTES 3: Reset Password : POST '/:id/:token'. Required valid reset password link
router.patch(
  "/:id/:token",
  [
    body("password", "Password must be atleast 5 characters").isLength({
      min: 5,
      max: 20,
    }),
    body("cpassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("You entered password don't match");
      }
      // Indicates the success of this synchronous custom validator
      return true;
    }),
  ],
  async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body;
    let success = false;

    //Check if some error then response bad message
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() });
    }

    try {
      // User Verify
      const validUser = await Users.findOne(
        { _id: id },
        { verifyToken: token }
      );

      // Verify Token
      const validToken = jwt.verify(token, JWT_SECRET);

      if (validUser && validToken._id) {
        // Create a secure password;
        const salt = await bcrypt.genSalt(10);
        const securePassword = await bcrypt.hash(password, salt);

        // Create a user
        // pass = await Users.create({
        //   password: securePassword,
        // });
        // Create a secure password;
        // const newPassword = password.toString();
        // const salt = await bcrypt.genSalt(10);
        // const securePassword = await bcrypt.hash(newPassword, salt);

        // update password
        const updatePassword = await Users.findByIdAndUpdate(
          { _id: id },
          { password: securePassword },
          { new: true }
        );
        updatePassword.save();
        success = true;
        res.status(201).json({ success, updatePassword });
      } else {
        success = false;
        res.status(500).json({ success, error: "Token expired" });
      }
    } catch (error) {
      res.status(500).json({ error });
    }
  }
);

module.exports = router;
