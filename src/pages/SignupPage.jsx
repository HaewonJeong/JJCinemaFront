import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkEmailAvailable } from '../api/mockApi';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.com$/i;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`])[a-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]{8,15}$/;
const NICKNAME_REGEX = /^[a-zA-Z0-9가-힣]{1,8}$/;

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [emailChecked, setEmailChecked] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);

  function handleEmailChange(e) {
    setEmail(e.target.value);
    setEmailChecked(false);
    setEmailMessage('');
  }

  async function handleCheckEmail() {
    if (!EMAIL_REGEX.test(email)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }
    setError('');
    setCheckingEmail(true);
    setEmailMessage('');
    try {
      const available = await checkEmailAvailable(email);
      if (available) {
        setEmailMessage('사용 가능한 이메일입니다.');
        setEmailChecked(true);
      } else {
        setEmailMessage('이미 사용 중인 이메일입니다.');
        setEmailChecked(false);
      }
    } catch (err) {
      setError(err.message);
      setEmailChecked(false);
    } finally {
      setCheckingEmail(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!NICKNAME_REGEX.test(name)) {
    setError('올바른 닉네임 형식이 아닙니다.');
    return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }
    if (!emailChecked) {
      setError('이메일 중복확인을 먼저 해주세요.');
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setError('올바른 비밀번호 형식이 아닙니다.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setSubmitting(true);
    try {
      await signup(name, email, password);
      navigate('/login', { replace: true, state: { message: '회원가입이 완료되었습니다. 로그인 해주세요.' } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <h1 className="login-title">🎬 JJCinema</h1>
        <p className="login-subtitle">회원가입하고 영화를 예매하세요</p>

        {error && <p className="form-error">{error}</p>}
        {emailMessage && (
          <p className={emailChecked ? 'form-success' : 'form-error'}>{emailMessage}</p>
        )}

        <label className="field-label" htmlFor="name">닉네임</label>
        <input
          id="name"
          type="text"
          className="text-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="1~8자 이내 한글/영문/숫자만 허용"
          required
        />

        <label className="field-label" htmlFor="email">이메일</label>
        <div className="field-row">
          <input
            id="email"
            type="email"
            className="text-input"
            value={email}
            onChange={handleEmailChange}
            placeholder="example@email.com"
            required
          />
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleCheckEmail}
            disabled={checkingEmail || !email}
          >
            {checkingEmail ? '확인 중...' : '중복확인'}
          </button>
        </div>

        <label className="field-label" htmlFor="password">비밀번호</label>
        <input
          id="password"
          type="password"
          className="text-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8~15자 이내 영문 소문자 포함 특수문자"
          required
        />

        <label className="field-label" htmlFor="passwordConfirm">비밀번호 확인</label>
        <input
          id="passwordConfirm"
          type="password"
          className="text-input"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="비밀번호 재입력"
          required
        />

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
