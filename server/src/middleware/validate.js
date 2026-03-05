const Joi = require('joi');

// Validate request body against a Joi schema
const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,   // silently drop unknown fields
        convert: true,
    });
    if (error) {
        const messages = error.details.map((d) => d.message).join(', ');
        return res.status(400).json({ success: false, message: messages });
    }
    req.body = value; // use sanitized value
    next();
};

const schemas = {
    // Only deviceId required — nothing else needed at registration
    register: Joi.object({
        deviceId: Joi.string().min(8).max(128).required(),
    }),

    syncWallets: Joi.object({
        wallets: Joi.array().items(
            Joi.object({
                address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
                encryptedJson: Joi.string().min(10).required(),
                name: Joi.string().max(50).optional().allow(''),
                isImported: Joi.boolean().optional(),
            })
        ).max(20).required(),
        accountNames: Joi.object().pattern(
            Joi.string(),
            Joi.string().max(50)
        ).optional().allow(null),
    }),

    syncSettings: Joi.object({
        selectedNetwork: Joi.string().optional(), // any network key allowed
        selectedAccount: Joi.number().integer().min(0).max(19).optional(),
        currency: Joi.string().valid('USD', 'EUR', 'GBP', 'INR').optional(),
        theme: Joi.string().valid('dark', 'light').optional(),
    }),

    addActivity: Joi.object({
        type: Joi.string().valid('send', 'receive', 'swap', 'buy').required(),
        txHash: Joi.string().optional().allow('', null),
        amount: Joi.string().max(50).optional().allow('', null),
        token: Joi.string().max(20).optional().allow('', null),
        network: Joi.string().max(20).optional().allow('', null),
        from: Joi.string().optional().allow('', null),
        to: Joi.string().optional().allow('', null),
        status: Joi.string().valid('pending', 'confirmed', 'failed').optional(),
    }),
};

module.exports = { validate, schemas };