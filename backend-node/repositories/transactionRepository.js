const supabase = require('../config/supabase');

const insertTransaction = async (txData) => {
    const { error } = await supabase
        .from('transactions')
        .insert([txData]);
    if (error) throw error;
};

module.exports = {
    insertTransaction
};
