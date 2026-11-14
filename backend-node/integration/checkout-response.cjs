// Track responses before Express enters mounted routers.
function trackCheckoutResponse(req, res, scope, onProperty) {
    const route = req.originalUrl;
    const method = req.method;
    const json = res.json.bind(res);
    res.json = value => {
        if (route === '/api/properties' && method === 'POST' && res.statusCode === 201) onProperty?.(value);
        if (route === '/api/payment/generate-hash' && method === 'POST' && res.statusCode === 200
            && value?.sandbox === true && scope.properties.has(value.property_id) && typeof value.order_id === 'string') {
            scope.orders.add(value.order_id);
        }
        return json(value);
    };
}
module.exports = { trackCheckoutResponse };
