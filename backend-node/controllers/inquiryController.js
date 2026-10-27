const inquiryRepository = require('../repositories/inquiryRepository');

const unavailable = (res) => res.status(503).json({ message: 'Inquiries are temporarily unavailable. Please try again later.' });

exports.submitInquiry = async (req, res) => {
    try {
        const { firstName, lastName, email, message } = req.body;
        await inquiryRepository.create({ first_name: firstName, last_name: lastName, email, message });
        res.status(201).json({ message: 'Your inquiry has been sent to our team.' });
    } catch (error) {
        console.error('Inquiry submission failed:', error.code || 'database error');
        unavailable(res);
    }
};

exports.listInquiries = async (req, res) => {
    try {
        const page = req.query.page;
        const pageSize = 20;
        const { data, count } = await inquiryRepository.list((page - 1) * pageSize, page * pageSize - 1);
        res.json({ inquiries: data || [], total: count || 0, page, pageSize });
    } catch (error) {
        console.error('Inquiry listing failed:', error.code || 'database error');
        unavailable(res);
    }
};
