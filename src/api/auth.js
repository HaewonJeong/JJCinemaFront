import { API_BASE } from './client';

//login
export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json'},
    credentials: 'include', //세션 쿠키 주고받기
    body: JSON.stringify({email, password}),
  });

  const body = await res.json();

  if(!res.ok){
    //실패 응답은 ApiResonse 형태
    throw new Error(body.message || '로그인에 실패했습니다.');
  }

  return{
    id: String(body.id),
    name: body.name,
    email: body.email,
    role: body.role.toLowerCase(),
    active: true,
  };
}

//이메일 중복확인 호출 함수 추가
export async function checkEmailAvailable(email) {
  const res = await fetch(`${API_BASE}/auth/check-email?email=${encodeURIComponent(email)}`);
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || '이메일 확인에 실패했습니다.');
  }
  return body.available; // true = 사용 가능, false = 이미 사용 중
}

export async function signup({name, email, password}) {
  const res = await fetch(`${API_BASE}/auth/signup`,{
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({name, email, password}),
  } );

  const body = await res.json();

  if(!res.ok){
    throw new Error(body.message || '회원가입에 실패했습니다.');
  }

  // 자동 로그인 안 함 — 가입만 하고 끝

}

//새로고침 시 로그인 상태 복원용
export async function getCurrentUser() {
  const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
  if (!res.ok) return null; // 로그인 안 된 상태
  const body = await res.json();
  return {
    id: String(body.id),
    name: body.name,
    email: body.email,
    role: body.role.toLowerCase(),
    active: true,
  };
}

//로그아웃
export async function logout() {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
