const { addPropertySchema, updatePropertySchema } = require('../validators/propertyValidator');
const body = {type:'House', title:'Valid house', description:'Valid description', price:100, latitude:6, longitude:80, contactNumber:'0771234567'};
test.each([{houseSize:0}, {houseSize:-1}, {houseSize:Infinity}, {landSize:Infinity}, {bedrooms:1.5}, {bathrooms:-1}])('rejects invalid specification %o on create and update', fields => {
 expect(addPropertySchema.safeParse({body:{...body,...fields}}).success).toBe(false);
 expect(updatePropertySchema.safeParse({body:fields}).success).toBe(false);
});
test.each(['', '123', '+940771234567'])('create requires valid contact %s', contactNumber => expect(addPropertySchema.safeParse({body:{...body,contactNumber}}).success).toBe(false));
test('accepts optional empty specifications and valid zero counts and land', () => expect(addPropertySchema.safeParse({body:{...body,bedrooms:0,bathrooms:'0',landSize:0,houseSize:''}}).success).toBe(true));
