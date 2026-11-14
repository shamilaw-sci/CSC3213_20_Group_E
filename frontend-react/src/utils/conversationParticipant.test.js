import { expect, test } from 'vitest';
import { getParticipant } from './conversationParticipant';
test.each(['BUYER', 'SELLER', 'AGENT'])('initiating %s sees the other participant', role => {
    const seller = { id: 'owner', name: 'Property owner', role: 'SELLER' };
    expect(getParticipant({ buyer_id: 'initiator', seller_id: 'owner', seller }, { id: 'initiator', role })).toEqual(seller);
});
test('listing owner sees the person making the inquiry', () => {
    const buyer = { id: 'initiator', name: 'Agent', role: 'AGENT' };
    expect(getParticipant({ buyer_id: 'initiator', seller_id: 'owner', buyer }, { id: 'owner', role: 'SELLER' })).toEqual(buyer);
});
