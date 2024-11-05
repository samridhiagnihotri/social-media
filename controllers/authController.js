const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const { readData, writeData } = require('../utils');
const JWT_SECRET = process.env.JWT_SECRET;

// Validation function for registration
const registerValid = (name, email, password, cf_password) => {
    if (!name || !email || !password || !cf_password) {
        return "All fields are required.";
    }
    if (password !== cf_password) {
        return "Passwords do not match.";
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        return "Invalid email format.";
    }
    if (password.length < 6) {
        return "Password must be at least 6 characters long.";
    }
    return null; // No errors
};

// Validation function for login
const loginValid = (email, password) => {
    if (!email || !password) {
        return "Email and password are required.";
    }
    return null; // No errors
};

const authController = {
    register: async (req, res) => {
        try {
            const { name, email, password, cf_password } = req.body;
            console.log(req.body);

            // Validate registration data
            const errorMessage = registerValid(name, email, password, cf_password);
            if (errorMessage) return res.status(400).json({ message: errorMessage });

            // Check if user already exists
            const users = readData('users.json');
            const userExists = users.find(user => user.email === email);
            if (userExists) {
                return res.status(400).json({ message: "This email is already in use" });
            }

            // Hash the password and save the user
            const hashedPassword = await bcrypt.hash(password, 12);
            const newUser = {
                id: Date.now(), // Use timestamp as a unique ID
                name,
                email,
                password: hashedPassword,
                role: 'user' // Default role
            };
            users.push(newUser);
            writeData('users.json', users);

            // Respond with success message
            res.status(201).json({
                message: "You have successfully registered. Please login now",
            });
        } catch (error) {
            console.error("Registration error:", error.message);
            res.status(500).json({ message: "Server error: " + error.message });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Validate login data
            const errorMessage = loginValid(email, password);
            if (errorMessage) return res.status(400).json({ message: errorMessage });

            // Find the user
            const users = readData('users.json');
            const user = users.find(user => user.email === email);
            if (!user) {
                return res.status(400).json({ message: "Invalid email or password" });
            }

            // Compare password
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return res.status(400).json({ message: "Invalid email or password" });
            }

            // Create and return JWT token
            const token = jwt.sign(
                { _id: user.id, role: user.role },
                JWT_SECRET,
                { expiresIn: "7d" }
            );

            // Exclude password from user object
            user.password = undefined;

            res.status(200).json({
                message: "You have successfully logged in",
                user,
                token,
            });
        } catch (error) {
            console.error("Login error:", error.message);
            res.status(500).json({ message: "Server error: " + error.message });
        }
    },
};

module.exports = authController;
