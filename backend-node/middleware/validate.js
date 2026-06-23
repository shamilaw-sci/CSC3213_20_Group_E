const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
<<<<<<< Updated upstream
        next();
    } catch (err) {
        return res.status(400).json({
            message: "Validation Error",
            errors: err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
    }
=======
    } catch (err) {
        if (err.errors) {
            return res.status(400).json({
                message: "Validation Error",
                errors: err.errors.map(e => ({ path: e.path?.join('.'), message: e.message }))
            });
        }
        return res.status(400).json({ message: "Invalid request data", error: err.message });
    }
    next();
>>>>>>> Stashed changes
};

module.exports = validate;
