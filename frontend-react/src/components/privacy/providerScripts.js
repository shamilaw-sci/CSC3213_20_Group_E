const pending = new Map();
export function loadProviderScript(name, src, available) {
  if (available()) return Promise.resolve();
  if (pending.has(name)) return pending.get(name);
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.dataset.provider = name;
    script.src = src;
    script.async = true;
    const timer = setTimeout(() => fail(), 15000);
    const fail = () => { clearTimeout(timer); script.remove(); pending.delete(name); reject(new Error('Unable to load the service. Check your connection and try again.')); };
    script.onerror = fail;
    script.onload = () => {
      if (!available()) {
        fail();
        return;
      }
      clearTimeout(timer);
      pending.delete(name);
      resolve();
    };
    document.head.appendChild(script);
  });
  pending.set(name, promise);
  return promise;
}
