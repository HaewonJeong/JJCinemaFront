import { useMemo, useState } from 'react';

const STORAGE_KEY = 'jjcinema_todo_checklist_v1';

const CATEGORIES = [
  {
    title: '반응형 대응',
    items: [
      'index.css에 @media 브레이크포인트가 없음 — 모바일/태블릿 레이아웃 미대응',
      '영화 목록·내 예매·관리자 화면의 260px 고정 사이드바가 좁은 화면에서 겹치거나 잘림',
      '좌석 선택 그리드가 좁은 화면에서 가로 스크롤로만 대응됨 — 터치 UX 점검 필요',
      '상단바 nav가 좁은 화면에서 줄바꿈 없이 잘림 — 햄버거 메뉴 등 검토',
    ],
  },
  {
    title: '인증 플로우',
    items: [
      '로그인/회원가입 폼에 이메일 형식·비밀번호 규칙 등 클라이언트 유효성 검사 없음',
      '비밀번호 찾기/재설정 플로우 없음',
      'mockApi의 로그인이 비밀번호를 실제로 검증하지 않음 — 데모용임을 화면에 명시하거나 검증 추가',
    ],
  },
  {
    title: '예매·결제 플로우',
    items: [
      '좌석 임시선점 만료 임박(예: 1분 이하) 시 경고 색상/애니메이션 없음',
      '결제 페이지의 "결제 실패 시뮬레이션" 버튼은 데모 전용 — 실제 PG 연동 시 제거 대상',
      '예매 취소 시 확인(confirm) 절차 없음 — 실수 취소 방지 필요',
    ],
  },
  {
    title: '관리자 화면',
    items: [
      '영화/상영 등록 폼의 값 검증이 required뿐이라 얕음 — 날짜·가격 범위 등 보강 필요',
      '일괄 수정(bulk-edit-bar)이 일부 화면에만 있음 — 상영 관리 등으로 확장 여지',
      '스케줄·매출 통계 페이지에 기간 필터(주간/월간)가 없음',
    ],
  },
  {
    title: '접근성 · 다크모드',
    items: [
      'index.css가 color-scheme: light로 고정 — 다크모드 대응 여부 결정 필요',
      '검색 돋보기 등 아이콘 전용 요소에 aria-label 보강 필요',
    ],
  },
  {
    title: '백엔드 연동',
    items: [
      'mockApi.js를 실제 API 호출로 교체 (ROADMAP.html 참고)',
      '포스터 이미지가 브라우저에만 저장되는 방식 — 서버 업로드 붙이기',
    ],
  },
];

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export default function TodoChecklistPage() {
  const [state, setState] = useState(loadState);

  const { total, done } = useMemo(() => {
    let total = 0;
    let done = 0;
    CATEGORIES.forEach((cat, ci) => {
      cat.items.forEach((_, ii) => {
        total += 1;
        if (state[`${ci}-${ii}`]) done += 1;
      });
    });
    return { total, done };
  }, [state]);

  const pct = total ? Math.round((done / total) * 100) : 0;

  function toggle(id) {
    setState((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <div className="panel">
      <div className="panel-header-row">
        <h2 className="panel-title">잔여 할 일 체크리스트</h2>
        <span className="panel-count">이 브라우저에 저장됩니다</span>
      </div>

      <div className="todo-progress">
        <div className="todo-progress-track">
          <div className="todo-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="todo-progress-num">{done} / {total}</span>
      </div>

      {CATEGORIES.map((cat, ci) => {
        const catDone = cat.items.filter((_, ii) => state[`${ci}-${ii}`]).length;
        return (
          <div key={cat.title} className="todo-category">
            <div className="todo-category-head">
              <span className="todo-category-title">{cat.title}</span>
              <span className="todo-category-count">{catDone} / {cat.items.length}</span>
            </div>
            <div className="todo-list">
              {cat.items.map((text, ii) => {
                const id = `${ci}-${ii}`;
                return (
                  <label key={id} className="todo-item">
                    <input type="checkbox" checked={!!state[id]} onChange={() => toggle(id)} />
                    <span>{text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
