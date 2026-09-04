'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, updateUser } from '../api/admin';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [page, setPage] = useState(1);

  async function refresh() {
    setLoading(true);
    const list = await getAllUsers();
    setUsers(list);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleRoleChange(userId, role) {
    setBusyId(userId);
    try {
      await updateUser(userId, { role });
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleActive(userId, active) {
    setBusyId(userId);
    try {
      await updateUser(userId, { active: !active });
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = users.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="panel">
      <h2 className="panel-title">회원 관리</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>이름</th>
            <th>이메일</th>
            <th>역할</th>
            <th>상태</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {!loading && users.length === 0 && (
            <tr><td colSpan={5} className="empty-cell">등록된 회원이 없습니다.</td></tr>
          )}
          {pageItems.map((u) => {
            const isSelf = u.id === currentUser?.id;
            const isActive = u.active !== false;
            return (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    className="text-input table-select"
                    value={u.role}
                    disabled={isSelf || busyId === u.id}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  >
                    <option value="customer">일반 회원</option>
                    <option value="admin">관리자</option>
                  </select>
                </td>
                <td>
                  <span className={'pill ' + (isActive ? 'pill-success' : 'pill-neutral')}>
                    {isActive ? '활성' : '비활성'}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    disabled={isSelf || busyId === u.id}
                    onClick={() => handleToggleActive(u.id, isActive)}
                  >
                    {isActive ? '비활성화' : '활성화'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
      <p className="admin-users-note">본인 계정의 역할·활성 상태는 여기서 바꿀 수 없습니다.</p>
    </div>
  );
}
