const {getPropertySize, calculatePriceInsight} = require('../utils/priceInsightEngine');
test('building comparisons require floor area rather than substituting plot area', () => {
 expect(getPropertySize({type:'House',land_size:10})).toBeNull();
});
test('rejects malformed and implausibly tiny building floor areas', () => {
 for (const house_size of [true, [], '1,500', 1]) expect(getPropertySize({type:'House',house_size})).toBeNull();
});
test('extreme price-per-area outlier cannot dominate the comparable average', () => {
 const target={id:'target',type:'House',listing_type:'Sale',house_size:1000,price:10000000};
 const peers=[9000000,10000000,11000000,10000000000].map((price,i)=>({...target,id:String(i),price}));
 expect(calculatePriceInsight(target,peers)).toMatchObject({averagePricePerSqft:10000,sampleSize:3});
});
test('excludes the target from its own comparison cohort', () => {
 const target={id:'target',type:'House',listing_type:'Sale',house_size:1000,price:10000000};
 expect(calculatePriceInsight(target,[target,{...target,id:'a'},{...target,id:'b'}])).toBeNull();
});
