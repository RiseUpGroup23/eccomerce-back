const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
    phone: { type: String },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' }, // Role management
}, { timestamps: true });


userSchema.pre("save", async function (next) {
    const user = this;
    if (user.isModified("password")) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    }
    next();
});

module.exports = mongoose.model('User', userSchema);
