import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setSubmitting(true);
    try {
      await signup(name, email, password);
      navigate('/movies', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1 className="login-title">🎬 JJCinema</h1>
        <p className="login-subtitle">회원가입하고 영화를 예매하세요</p>

        <label className="field-label" htmlFor="name">이름</label>
        <input
          id="name"
          type="text"
          className="text-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

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

        <label className="field-label" htmlFor="passwordConfirm">비밀번호 확인</label>
        <input
          id="passwordConfirm"
          type="password"
          className="text-input"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="••••••••"
          required
        />

        {error && <p className="form-error">{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? '가입 중...' : '회원가입'}
        </button>

        <div className="demo-box">
          <p className="demo-title">
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
