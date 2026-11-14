export const getParticipant = (conversation, user) => {
    if (conversation.type === 'support') return { role: 'ADMIN', name: 'Admin Support', avatar_url: null };
    if (user?.id === conversation.buyer_id) return conversation.seller || { role: 'SELLER', name: 'Seller' };
    return conversation.buyer || { role: 'BUYER', name: 'Buyer' };
};
