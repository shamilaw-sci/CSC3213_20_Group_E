import api from '../context/api';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let fbInitialized = false;
let appleInitialized = false;

// --- Google ---
// Uses Google Identity Services (loaded via <script> in index.html).
// google.accounts.id is callback-based, so we wrap it in a Promise.
export const signInWithGoogle = () => {
    return new Promise((resolve, reject) => {
        if (!window.google) {
            return reject(new Error("Google SDK not loaded yet. Please try again."));
        }

        window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: async(response) => {
                try {
                    const res = await api.post('/auth/google', {
                        credential: response.credential
                    });
                    resolve(res.data.user);
                } catch (err) {
                    reject(err);
                }
            }
        });

        window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                reject(new Error("Google sign-in was cancelled or blocked."));
            }
        });
    });
};

// --- Facebook ---
export const signInWithFacebook = () => {
    return new Promise((resolve, reject) => {
        if (!window.FB) {
            return reject(new Error("Facebook SDK not loaded yet. Please try again."));
        }

        if (!fbInitialized) {
            window.FB.init({
                appId: import.meta.env.VITE_FACEBOOK_APP_ID,
                cookie: true,
                xfbml: false,
                version: 'v19.0'
            });
            fbInitialized = true;
        }

        window.FB.login((response) => {
            if (response.authResponse) {
                api.post('/auth/facebook', {
                    accessToken: response.authResponse.accessToken
                })
                .then(res => resolve(res.data.user))
                .catch(err => reject(err));
            } else {
                reject(new Error("Facebook login was cancelled."));
            }
        }, { scope: 'public_profile,email' });
    });
};

// --- Apple ---
export const signInWithApple = () => {
    return new Promise((resolve, reject) => {
        if (!window.AppleID) {
            return reject(new Error("Apple SDK not loaded yet. Please try again."));
        }

        if (!appleInitialized) {
            window.AppleID.auth.init({
                clientId: import.meta.env.VITE_APPLE_CLIENT_ID,
                scope: 'name email',
                redirectURI: import.meta.env.VITE_APPLE_REDIRECT_URI || window.location.origin + '/login',
                usePopup: true
            });
            appleInitialized = true;
        }

        window.AppleID.auth.signIn()
            .then(async(data) => {
                try {
                    const res = await api.post('/auth/apple', {
                        id_token: data.authorization.id_token,
                        name: data.user ?
                            `${data.user.name?.firstName || ''} ${data.user.name?.lastName || ''}`.trim() : undefined
                    });
                    resolve(res.data.user);
                } catch (err) {
                    reject(err);
                }
            })
            .catch(() => reject(new Error("Apple login was cancelled.")));
    });
};
