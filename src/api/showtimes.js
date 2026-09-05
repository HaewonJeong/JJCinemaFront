import { API_BASE } from './client';

const ROWS = ['A', 'B', 'C', 'D', 'E'];
const COLS = [1, 2, 3, 4, 5, 6, 7, 8];

//상영 시간 조회
export async function getShowtimes(movieId) {
  const res = await fetch(`${API_BASE}/showtimes?movieId=${movieId}`);
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || '상영 시간표를 불러오지 못했습니다.');
  }
  return body.data.map((s) => ({
    id: String(s.showtimeId),
    movieId: String(s.movieId),
    movieTitle: s.movieTitle,
    date: s.date,
    time: s.time.slice(0, 5), // "14:30:00" -> "14:30" 문자열 앞 5글자만 자른다.
    theater: s.theater,
    price: s.price,
  }));
}

//좌석 정보 불러오기
export async function getSeatMap(showtimeId) {
  const [seatRes, showtimeRes] = await Promise.all([
    fetch(`${API_BASE}/showtimes/${showtimeId}/seats`),
    fetch(`${API_BASE}/showtimes/${showtimeId}`),
  ]);
  const seatBody = await seatRes.json();
  const showtimeBody = await showtimeRes.json();

  if (!seatRes.ok) {
    throw new Error(seatBody.message || '좌석 정보를 불러오지 못했습니다.');
  }
  if (!showtimeRes.ok) {
    throw new Error(showtimeBody.message || '상영 정보를 불러오지 못했습니다.');
  }

  const st = showtimeBody.data;
  const seats = seatBody.data.map((s) => ({
    code: s.seatCode,
    row: s.seatCode[0],
    status: s.available ? '선택가능' : '예약됨',
  }));

  return {
    showtime: {
      id: String(st.showtimeId),
      movieId: String(st.movieId),
      movieTitle: st.movieTitle,
      date: st.date,
      time: st.time.slice(0, 5),
      theater: st.theater,
      price: st.price,
    },
    rows: ROWS,
    cols: COLS,
    seats,
  };
}

// 백엔드가 500과 함께 원본 DB 에러(제약조건 위반 등)를 그대로 내려주는 경우가 있어서,
// 사용자에게 보여줄 만한 메시지로 바꿔준다. 못 알아보는 에러는 fallback을 쓴다.
function friendlyShowtimeError(rawMessage, fallback) {
  const msg = rawMessage || '';
  if (
    msg.includes('showtimes_theater_date_time_key') ||
    (msg.includes('중복된 키 값') && msg.includes('theater')) ||
    msg.includes('duplicate key')
  ) {
    return '같은 상영관·날짜·시간에 이미 등록된 상영이 있습니다.';
  }
  // SQL 덤프처럼 보이는 긴 에러는 그대로 노출하지 않는다.
  if (msg.includes('could not execute statement') || msg.length > 120) {
    return fallback;
  }
  return msg || fallback;
}

//헬퍼 함수
function toDisplayShowtime(s) {
  return {
    id: String(s.showtimeId),
    movieId: String(s.movieId),
    movieTitle: s.movieTitle,
    date: s.date,
    time: s.time.slice(0, 5),
    theater: s.theater,
    price: s.price,
  };
}

//관리자 상영 스케줄 전체 조회
export async function getAllShowtimesAdmin() {
  const res = await fetch(`${API_BASE}/admin/showtimes`, { credentials: 'include' });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || '상영 스케줄을 불러오지 못했습니다.');
  }
  return body.data.map((s) => ({ ...toDisplayShowtime(s), bookedSeats: s.bookedSeats, totalSeats: s.totalSeats }));
}

//관리자 상영 스케줄 등록
export async function createShowtime(showtime) {
  const res = await fetch(`${API_BASE}/admin/showtimes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      movieId: Number(showtime.movieId),
      date: showtime.date,
      time: showtime.time,
      theater: showtime.theater,
      price: showtime.price,
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(friendlyShowtimeError(body.message, '상영 등록에 실패했습니다.'));
  }
  return toDisplayShowtime(body.data);
}

//관리자 특정 상영 정보 불러오기
export async function getShowtime(showtimeId) {
  const res = await fetch(`${API_BASE}/showtimes/${showtimeId}`);
  if (res.status === 404) return null;
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || '상영 정보를 불러오지 못했습니다.');
  }
  return toDisplayShowtime(body.data);
}

//관리자 특정 상영 정보 업데이트
export async function updateShowtime(showtimeId, patch) {
  const res = await fetch(`${API_BASE}/admin/showtimes/${showtimeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(patch),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(friendlyShowtimeError(body.message, '상영 수정에 실패했습니다.'));
  }
  return toDisplayShowtime(body.data);
}

// 같은 영화의 여러 상영을 한 번에 수정할 때 사용 (예: 상영관·가격 일괄 변경)
export async function updateShowtimesBulk(showtimeIds, patch) {
  const res = await fetch(`${API_BASE}/admin/showtimes/bulk`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      showtimeIds: showtimeIds.map(Number),
      theater: patch.theater ?? null,
      price: patch.price ?? null,
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(friendlyShowtimeError(body.message, '일괄 수정에 실패했습니다.'));
  }
  return body.data.map(toDisplayShowtime);
  }
  //관리자 상영 삭제
  export async function deleteShowtime(showtimeId) {
    const res = await fetch(`${API_BASE}/admin/showtimes/${showtimeId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    const body = await res.json();
    if(!res.ok){
      throw new Error(friendlyShowtimeError(body.message, '상영 삭제에 실패했습니다.'));
    }
    
  }
