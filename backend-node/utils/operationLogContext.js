// Only explicit operation identifiers may enter new recovery log context.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
module.exports=values=>Object.fromEntries(['order_id','property_id'].filter(key=>
    typeof values[key]==='string'&&uuid.test(values[key])).map(key=>[key,values[key]]));
