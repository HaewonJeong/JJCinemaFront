import { API_BASE } from './client';
// 서버는 LocalDateTime을 오프셋 없이("2026-09-04T17:22:04.453269") 내려준다.
// 서버 JVM과 브라우저가 같은 타임존(KST)이면 로컬로 파싱하는 게 맞다.
// (서버를 UTC로 배포하면 이 가정이 깨지므로, 그땐 백엔드가 holdRemainingSeconds 같은
//  '남은 초'를 내려주도록 바꿔야 한다. — 아래 getBooking 주석 참고)
export function parseServerDateTime(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(String(value).trim().replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
}

//예매하기 (같은 상영 회차에 대한 더블 부킹 방지, )
/*showtimeRepository.findByIdForUpdate(...) — @Lock(PESSIMISTIC_WRITE)가 걸려있어서,
같은 상영 회차에 대한 예매 요청은 DB 레벨에서 한 줄로 세워져요.
두 사람이 동시에 눌러도 실제 처리 순서는 하나씩.
좌석 저장 시 booking_seats(showtime_id, seat_code) UNIQUE 제약이 최후 방어선
— 락을 어찌어찌 우회해도 두 번째 INSERT가 무조건 터짐.
충돌 나면 409 Conflict + "이미 선점된 좌석이 있습니다." 응답. */
export async function createBooking(userId, showtimeId, seatIds) {
  var aa=JSON.stringify({ showtimeId: Number(showtimeId), seatCodes: seatIds });
  const res = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ showtimeId: Number(showtimeId), seatCodes: seatIds }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || '좌석 선점에 실패했습니다.');
  }
  const b = body.data;
  return {
    id: String(b.bookingId),
    showtimeId: String(b.showtimeId),
    seatIds: b.seatCodes,
    status: '결제대기',
    heldAt: b.heldAt,
    totalPrice: b.totalPrice,
  };
}

export async function getBooking(bookingId) {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
    credentials: 'include',
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || '예매 정보를 불러오지 못했습니다.');
  }
  const b = body.data;
  const STATUS_MAP = { HELD: '결제대기', CONFIRMED: '예매완료', CANCELLED: '취소됨' };
  return {
    id: String(b.bookingId),
    showtimeId: String(b.showtimeId),
    status: STATUS_MAP[b.status] ?? b.status,
    seatIds: b.seatCodes,
    totalPrice: b.totalPrice,
    movieTitle: b.movieTitle,
    moviePoster: '🎬',
    moviePosterUrl: b.moviePosterBase64 || undefined,
    showtime: { date: b.date, time: b.time.slice(0, 5), theater: b.theater },
    // 카운트다운은 holdRemainingSeconds(남은 초)를 우선 사용. holdExpiresAt는 폴백/디버그용.
    holdRemainingSeconds: b.holdRemainingSeconds ?? null,
    holdExpiresAt: parseServerDateTime(b.holdExpiresAt)?.toISOString() ?? null,
  };
}

// 모의 결제. forceResult('SUCCESS' | 'FAILED')를 주면 결과를 강제하고, 없으면 임의 확률로 성공/실패한다.
// 성공하면 예매가 CONFIRMED로 확정된다. 실패하면 400 + 메시지만 오고 좌석/예매는 HELD 그대로 —
// 임시선점 남은 시간(5분) 안에 재결제할 수 있다. (좌석은 임시선점이 만료돼야 풀린다.)
export async function createPayment(bookingId, forceResult) {
  const res = await fetch(`${API_BASE}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ bookingId: Number(bookingId), forceResult }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || '결제에 실패했습니다. 다시 시도해주세요.');
  }
  return body.data;
}

//내 예매 조회
const BOOKING_STATUS_MAP = { HELD: '결제대기', CONFIRMED: '예매완료', CANCELLED: '취소됨' };

function toDisplayBooking(b) {
  const expiresDate = parseServerDateTime(b.holdExpiresAt);
  // 남은 초가 오면 그걸로 만료 판정 (타임존 무관), 없으면 절대시각 폴백.
  const holdExpired =
    b.status === 'HELD' &&
    (b.holdRemainingSeconds != null
      ? b.holdRemainingSeconds <= 0
      : !expiresDate || expiresDate.getTime() < Date.now());
  return {
    id: String(b.bookingId),
    showtimeId: String(b.showtimeId),
    status: BOOKING_STATUS_MAP[b.status] ?? b.status,
    seatIds: b.seatCodes,
    totalPrice: b.totalPrice,
    movieTitle: b.movieTitle,
    moviePoster: '🎬',
    moviePosterUrl: b.moviePosterBase64 || undefined,
    showtime: { date: b.date, time: b.time.slice(0, 5), theater: b.theater },
    holdRemainingSeconds: b.holdRemainingSeconds ?? null,
    holdExpiresAt: expiresDate?.toISOString() ?? null,
    holdExpired,
    paymentStatus: b.paymentStatus === 'REFUNDED' ? '환불됨' : null,
  };
}

export async function getMyBookings(userId) {
  const res = await fetch(`${API_BASE}/bookings/me`, { credentials: 'include' });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || '예매 내역을 불러오지 못했습니다.');
  }
  return body.data.map(toDisplayBooking);
}

//내 예매 취소
export async function cancelBooking(bookingId) {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || '예매 취소에 실패했습니다.');
  }
  return body.data;
}
