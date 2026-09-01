import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  //토스트 상태 추가
  const location = useLocation();
  const [toast, setToast] = useState(location.state?.message || '');
  
  useEffect(() => {
  if (!toast) return;
  const timer = setTimeout(() => setToast(''), 3000);
  navigate(location.pathname, { replace: true, state: {} }); // 히스토리에서 메시지 제거
  return () => clearTimeout(timer);
}, []); 

  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/movies', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      {toast && <div className="toast toast-success">{toast}</div>}
    <form className="login-card" onSubmit={handleSubmit} noValidate>
        <h1 className="login-title">🎬 JJCinema</h1>
        <p className="login-subtitle">로그인하고 원하는 좌석을 예매하세요</p>

        <label className="field-label" htmlFor="email">이메일</label>
        <input
          id="email"
          type="email"
          className="text-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        <label className="field-label" htmlFor="password">비밀번호</label>
        <input
          id="password"
          type="password"
          className="text-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        {error && <p className="form-error">{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? '로그인 중...' : '로그인'}
        </button>

        <div className="demo-box">
          <p className="demo-title" style={{ marginTop: 16, marginBottom: 0 }}>
            계정이 없으신가요? <Link to="/signup">회원가입</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
