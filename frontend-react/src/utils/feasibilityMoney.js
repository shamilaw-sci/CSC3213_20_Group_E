export function formatMoneyInput(value) {
    const [whole, fraction] = String(value).split('.');
    return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (fraction === undefined ? '' : `.${fraction}`);
}

export function amountInWords(value) {
    const small = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const words = (n) => {
        if (n < 20) return small[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? `-${small[n % 10]}` : '');
        if (n < 1000) return `${small[Math.floor(n / 100)]} hundred${n % 100 ? ` ${words(n % 100)}` : ''}`;
        for (const [scale, label] of [[1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']]) {
            if (n >= scale) return `${words(Math.floor(n / scale))} ${label}${n % scale ? ` ${words(n % scale)}` : ''}`;
        }
    };
    const amount = Math.round(Number(value));
    if (!Number.isFinite(amount) || amount < 0) return '';
    const text = `${words(amount)} rupees`;
    return text[0].toUpperCase() + text.slice(1);
}
