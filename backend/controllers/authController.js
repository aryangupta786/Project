const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate unique profile ID
const generateProfileId = () => `profile_${Math.random().toString(36).substr(2, 9)}`;

// Signup Controller
exports.signup = async (req, res) => {
  const { name, email, phone, password, confirmPassword, role } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match!" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const profileId = generateProfileId();

    const newUser = new User({ name, email, phone, password: hashedPassword, role, profileId });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully!", profileId });
  } catch (err) {
    res.status(500).json({ message: "Error creating user", error: err.message });
  }
};

// Login Controller
exports.login = async (req, res) => {
  const { emailOrPhone, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "Login successful!", token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
};
