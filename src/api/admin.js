import { API_BASE } from './client';

//회원 조회
export async function getAllUsers() {
  const res = await fetch(`${API_BASE}/admin/users`, {
    credentials: 'include',
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || '회원 목록을 불러오지 못했습니다.');
  }
  return body.data.map((u) => ({
    id: String(u.id),
    name: u.name,
    email: u.email,
    role: u.role.toLowerCase(),
    active: u.active,
  }));
}

//회원 업데이트
export async function updateUser(userId, patch) {
  const requestBody = {};
  if (patch.role !== undefined) requestBody.role = patch.role.toUpperCase();
  if (patch.active !== undefined) requestBody.active = patch.active;

  const res = await fetch(`${API_BASE}/admin/user/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(requestBody),
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || '회원 정보 수정에 실패했습니다.');
  }
  const u = result.data;
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    role: u.role.toLowerCase(),
    active: u.active,
  };
}

//관리자 통계
export async function getBookingStats() {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    credentials: 'include',
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || '통계를 불러오지 못했습니다.');
  }
  return body.data;
}
