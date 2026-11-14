const { z } = require('zod');
const { validNewPassword, newPasswordMessage } = require('./newPassword');

const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters long"),
        email: z.string().email("Invalid email format"),
        password: z.string().refine(validNewPassword, newPasswordMessage),
        role: z.enum(['BUYER', 'SELLER', 'AGENT', 'ADMIN']).optional(),
        agency_name: z.string().trim().max(150).optional(),
        license_number: z.string().trim().max(100).optional(),
        agencyName: z.string().trim().max(150).optional(),
        licenseNumber: z.string().trim().max(100).optional(),
    }),
});

const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(1, "Password is required"),
    }),
});

const checkEmailSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
    }),
});

const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
    }),
});

const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Reset token is required"),
        newPassword: z.string().refine(validNewPassword, newPasswordMessage),
    }),
});

module.exports = {
    registerSchema,
    loginSchema,
    checkEmailSchema,
    forgotPasswordSchema,
    resetPasswordSchema
};
