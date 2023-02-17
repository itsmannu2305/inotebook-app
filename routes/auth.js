require("dotenv").config();
const express = require("express");
const Users = require("../models/Users");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const fetchuser = require("../middleware/fetchuser");

const JWT_SECRET = process.env.JWT_SECRET_KEY;

//ROUTES 1: Create a user using: POST '/api/auth/createuser'. No login required.
router.post(
  "/createuser",
  [
    body("name", "Name must be atleast 2 characters").isLength({
      min: 2,
      max: 25,
    }),
    body("email", "Enter a valid email").isEmail(),
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
    let success = false;

    //Check if some error then response bad message
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() });
    }

    // Check wether the user with same email id then show bad response
    try {
      let user = await Users.findOne({ email: req.body.email });
      if (user) {
        return res.status(400).json({
          success,
          error: "Sorry a user with this email already exists",
        });
      }

      // Create a secure password;
      const salt = await bcrypt.genSalt(10);
      const securePassword = await bcrypt.hash(req.body.password, salt);

      // Create a user
      user = await Users.create({
        name: req.body.name,
        email: req.body.email,
        password: securePassword,
      });

      // Send authtoken using jwt token and send user id in authtoken
      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET);
      success = true;
      res.status(201).json({ success, authtoken });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

//ROUTES 2: Login a user using: POST '/api/auth/login'. No login required.
router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password cann't be blank").exists(),
  ],
  async (req, res) => {
    let success = false;
    //Check if some error then response bad message
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      // Find user exists or not for login with correct credetials
      let user = await Users.findOne({ email });
      if (!user) {
        success = false;
        return res.status(400).json({
          success,
          error: "Please try to login with correct credetials",
        });
      }

      // Check password is corect or not
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        success = false;
        return res.status(400).json({
          success,
          error: "Please try to login with correct credetials",
        });
      }

      // Send authtoken using jwt token and send user id in authtoken
      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET);
      success = true;
      res.json({ success, authtoken });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

//ROUTES 3: Get loggedin user details using: POST '/api/auth/getuser'. Login required.
router.post("/getuser", fetchuser, async (req, res) => {
  try {
    let userId = req.user.id;
    const user = await Users.findById(userId).select("-password");
    res.send(user);
  } catch (error) {
    console.error(error);
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
