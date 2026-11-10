const {parseProfileInput,MAX_AVATAR_BYTES}=require('../validators/profileInput');
test('rejects WebP high-bit signature lookalikes',()=>{
 const bytes=Buffer.from('d2c9c6c63030303057454250','hex');
 expect(()=>parseProfileInput({avatar_url:'data:image/webp;base64,'+bytes.toString('base64')})).toThrow();
});
test.each([null,[],true,'text',{name:'x'.repeat(256)},{phone:'x'.repeat(21)},{password:'x'.repeat(1025)},{theme_preference:null},{avatar_url:'https://user:pass@example.test/a'},{avatar_url:'data:image/png;base64,iVBORw0KGgo'},{avatar_url:'data:image/png;base64,iVBORw0KGgp='}])('rejects invalid boundary %p',v=>expect(()=>parseProfileInput(v)).toThrow());
test('accepts optional clears and false notification',()=>expect(parseProfileInput({phone:null,avatar_url:'',email_notifications:false}).fields).toEqual({phone:null,avatar_url:'',email_notifications:false}));
test.each([['jpeg',Buffer.from('ffd8ff','hex')],['png',Buffer.from('89504e470d0a1a0a','hex')],['webp',Buffer.from('RIFF0000WEBP')]])('accepts basic %s signature without claiming decoder safety',(type,bytes)=>expect(parseProfileInput({avatar_url:`data:image/${type};base64,${bytes.toString('base64')}`}).avatar.bytes).toEqual(bytes));
test('exact decoded size limit accepted; next byte refused',()=>{const b=Buffer.alloc(MAX_AVATAR_BYTES);Buffer.from('89504e470d0a1a0a','hex').copy(b);expect(parseProfileInput({avatar_url:'data:image/png;base64,'+b.toString('base64')}).avatar.bytes.length).toBe(MAX_AVATAR_BYTES);expect(()=>parseProfileInput({avatar_url:'data:image/png;base64,'+Buffer.concat([b,Buffer.alloc(1)]).toString('base64')})).toThrow();});
