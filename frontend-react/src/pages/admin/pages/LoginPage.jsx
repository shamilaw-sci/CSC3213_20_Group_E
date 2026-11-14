import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { adminLogin } from "../api/adminApi";
import { Player } from "@lottiefiles/react-lottie-player";
import "./LoginPage.css";
import { ArrowRight, Loader2, Eye, EyeOff, Copy, Check } from "lucide-react";
import QRCode from 'qrcode';

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfa, setMfa] = useState(null);
  const [qrImage, setQrImage] = useState('');
  const [setupFeedback, setSetupFeedback] = useState('');
  const [copied, setCopied] = useState('');
  async function copyCodes(value, label) {
    try { await navigator.clipboard.writeText(value); setCopied(label); }
    catch { setCopied('Copy failed. Select the codes and copy manually.'); }
  }
  const [setupCode, setSetupCode] = useState('');
  const [code, setCode] = useState('');
  const [regenerateRecovery, setRegenerateRecovery] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [completedLogin, setCompletedLogin] = useState(null);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await adminLogin(email, password, {
        setupCode,
        setupToken: mfa?.setupToken,
        regenerateRecovery,
        ...(code.trim().length === 24 ? { recoveryCode: code.trim() } : { code: code.trim() }),
      });
      if (data.mfaRequired) {
        if (!data.retryCode) {
          setQrImage('');
          setSetupFeedback('');
          if (data.otpauthUri && data.secret) {
            try {
              setQrImage(await QRCode.toDataURL(data.otpauthUri, { width: 240, margin: 4 }));
            } catch {
              setSetupFeedback('QR code unavailable. Enter the setup key manually.');
            }
          }
        }
        setMfa(data.retryCode ? { ...mfa, ...data } : data);
        setCode('');
        return;
      }
      if (data.recoveryCodes) {
        setRecoveryCodes(data.recoveryCodes);
        setCompletedLogin(data);
        return;
      }
      login(data.token, data.admin);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign in. Try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="admin-signin">
      <aside className="admin-signin-visual">
        <a className="admin-signin-brand" href="/" aria-label="Thirasara Property home"><img src="/logo.jpeg" alt="" width="72" height="72" /><span className="admin-signin-wordmark">Thirasara<span>Property</span></span></a>
        <div className="admin-signin-animation"><Player autoplay loop src="/images/admin-panel.json" /></div>
        <div className="admin-signin-caption"><span>ADMIN WORKSPACE</span><h2>A clear view.<br />A confident next move.</h2><p>Your people, properties and operations in one place.</p></div>
      </aside>
      <section className="admin-signin-main">
        <div className="admin-signin-form">
          <a className="admin-signin-back" href="/"><ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back to Thirasara</a>
          <header><p className="admin-signin-eyebrow">THIRASARA ADMIN</p><h1>{recoveryCodes ? 'Keep your access secure.' : mfa ? 'Verify it?s you.' : 'Welcome back.'}</h1><p>{recoveryCodes ? 'Save these recovery codes somewhere safe. Each code works once.' : mfa ? 'Use your authenticator to finish signing in.' : 'Sign in to your administration workspace.'}</p></header>
          {recoveryCodes ? <div className="admin-recovery">
            <div className="admin-recovery-heading"><span>Recovery codes</span><button type="button" onClick={() => copyCodes(recoveryCodes.join('\n'), 'All codes copied')}>{copied === 'All codes copied' ? <Check size={16} /> : <Copy size={16} />} Copy all</button></div>
            <ul tabIndex={0} aria-label="Recovery codes. Scroll to view all ten codes.">{recoveryCodes.map((value, index) => <li key={value}><code>{value}</code><button type="button" aria-label={'Copy recovery code ' + (index + 1)} onClick={() => copyCodes(value, 'Code ' + (index + 1) + ' copied')}><Copy size={15} /></button></li>)}</ul>
            {copied && <p role="status">{copied}</p>}
            <button className="admin-signin-submit" onClick={() => { login(completedLogin.token, completedLogin.admin); setRecoveryCodes(null); setCompletedLogin(null); navigate('/admin/dashboard'); }}>I saved my codes. Continue <ArrowRight size={18} /></button>
          </div> : <form onSubmit={handleSubmit}>
            <label htmlFor="admin-email">Email address</label><input id="admin-email" type="email" autoComplete="username" placeholder="you@company.com" value={email} onChange={event => setEmail(event.target.value)} required />
            <label htmlFor="admin-password">Password</label><div className="admin-password-field"><input id="admin-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={event => setPassword(event.target.value)} required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>
            {mfa && <div className="admin-mfa">
              {mfa.setupRequired && <><label htmlFor="admin-setup">Owner setup code</label><input id="admin-setup" type="password" value={setupCode} onChange={event => setSetupCode(event.target.value)} /></>}
              {mfa.secret && <><p>Scan with Microsoft Authenticator or Google Authenticator.</p>{qrImage && <img className="admin-qr" src={qrImage} width="240" height="240" alt="Authenticator setup QR code" />}<div className="admin-setup-key"><code>{mfa.secret}</code><button type="button" aria-label="Copy setup key" onClick={() => copyCodes(mfa.secret, 'Setup key copied')}><Copy size={17} /></button></div>{setupFeedback && <p role="status">{setupFeedback}</p>}{copied && <p role="status">{copied}</p>}</>}
              <label htmlFor="admin-mfa-code">Authenticator or recovery code</label><input id="admin-mfa-code" autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value.trim())} required maxLength={24} />
              {!mfa.secret && <label className="admin-recovery-option"><input type="checkbox" checked={regenerateRecovery} onChange={event => setRegenerateRecovery(event.target.checked)} /><span>Create new recovery codes<small>Requires an authenticator code. Previous recovery codes will expire.</small></span></label>}
            </div>}
            {error && <p className="admin-signin-error" role="alert">{error}</p>}
            <button className="admin-signin-submit" disabled={loading}>{loading ? <><Loader2 size={18} className="animate-spin" /> Signing in?</> : <>{mfa ? 'Verify and continue' : 'Sign in'}<ArrowRight size={18} /></>}</button>
          </form>}
          <footer>Access is restricted to authorized team members.</footer>
        </div>
      </section>
    </main>
  );
};
export default LoginPage;
