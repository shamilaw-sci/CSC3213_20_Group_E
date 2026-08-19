const { z } = require('zod');

const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters long"),
        email: z.string().email("Invalid email format"),
        password: z.string().min(6, "Password must be at least 6 characters long"),
        role: z.enum(['BUYER', 'SELLER', 'AGENT']).optional(),
        agency_name: z.string().optional(),
        license_number: z.string().optional(),
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
        newPassword: z.string().min(6, "Password must be at least 6 characters long"),
    }),
});

module.exports = {
    registerSchema,
    loginSchema,
    checkEmailSchema,
    forgotPasswordSchema,
    resetPasswordSchema
};
