const User = require("../models/usersModel");
const { EMAIL_REQUIRED, USER_EXISTS, NOT_LOGGEDIN, USER_NOT_FOUND } = require('../messages/message');
const path = require("path");
const fs = require("fs");
const { getUser } = require("../services/userAuthService");

/** JWT bearer auth — loads user from DB (same pattern as AssistantAppBacken user-service authenticate). */
async function authenticate(req, res, next) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
        const decoded = getUser(token);
        const user = await User.findById(decoded._id);
        if (!user) return res.status(401).json({ error: "User not found" });
        req.authUser = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
}

async function checkUserExistsByEmail(req, res, next) {
    const { email } = req.body;

    if (!email?.trim()) {
        return res.status(400).json({ error: EMAIL_REQUIRED });
    }

    const user = await User.findOne({ email: email.trim() });
    if (user) {
        if (req.file) {
            const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted orphan file: ${req.file.filename}`);
                }
            } catch (err) {
                console.error("Failed to delete file:", err);
            }
        }
        return res.status(409).json({ error: USER_EXISTS });
    }

    next();
}

async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
        decoded = getUser(token);
    } catch (err) {
        console.error("JWT error:", err);
        return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = decoded;
    next();
}

function optionalVerifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        req.user = null;
        return next();
    }

    const token = authHeader.split(" ")[1];

    try {
        req.user = getUser(token);
    } catch {
        req.user = null;
    }

    next();
}


module.exports = {
    checkUserExistsByEmail,
    verifyToken,
    optionalVerifyToken,
    authenticate,
};
