require('dotenv').config();
const supabase = require('./config/supabase');
async function run() {
    const { data, error } = await supabase.from('properties').select('*').limit(1);
    console.log(data[0]);
}
run();
