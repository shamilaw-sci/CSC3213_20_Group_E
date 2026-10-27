const validate = (schema) => (req, res, next) => {
    try {
        const parsed = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        // Retain existing fields not covered by older route schemas, while
        // forwarding coerced/defaulted values to the controller.
        for (const key of ['body', 'query', 'params']) {
            if (parsed[key] !== undefined) {
                Object.defineProperty(req, key, {
                    value: { ...req[key], ...parsed[key] },
                    configurable: true,
                    writable: true,
                    enumerable: true,
                });
            }
        }
    } catch (err) {
        const issues = err.issues || err.errors;
        if (issues) {
            return res.status(400).json({
                message: "Validation Error",
                errors: issues.map(e => ({ path: e.path?.join('.'), message: e.message }))
            });
        }
        return res.status(400).json({ message: "Invalid request data", error: err.message });
    }
    next();
};

module.exports = validate;
