// 목업 데이터 레이어. 실제 백엔드가 만들어지면 이 파일의 함수 내부만
// fetch('/api/...') 호출로 교체하면 되고, 화면(컴포넌트) 쪽 코드는 그대로 써도 됩니다.
// 좌석 예매의 핵심 함정(더블부킹)을 눈으로 보여주기 위해 createBooking은
// "제출 시점에 좌석 상태를 다시 확인"하는 방식으로 만들었습니다 — 실제 서버라면
// 이 확인+예약 사이의 틈을 막기 위해 락(비관적 락 등)이 필요합니다.

const DB_KEY = 'movie_booking_db_v1';
const LATENCY = 300;
const API_BASE = 'http://localhost:8080/api'; //백엔드 주소 상수 추가
const HOLD_TIMEOUT_MS = 5 * 60 * 1000; // 좌석 임시선점 유효시간(5분)

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const ROWS = ['A', 'B', 'C', 'D', 'E'];
const COLS = [1, 2, 3, 4, 5, 6, 7, 8];

function allSeatCodes() {
  const seats = [];
  ROWS.forEach((r) => COLS.forEach((c) => seats.push(`${r}${c}`)));
  return seats;
}

function seedDB() {
  const users = [
    { id: 'u-admin', name: '박관리', email: 'admin@cinema.com', password: 'admin123', role: 'admin', active: true },
    { id: 'u-1', name: '김민준', email: 'minjun@example.com', password: 'customer123', role: 'customer', active: true },
    { id: 'u-2', name: '이서연', email: 'seoyeon@example.com', password: 'customer123', role: 'customer', active: true },
  ];

  const movies = [
    { id: 'm-1', title: '별의 궤도', genre: 'SF', runtime: 128, rating: '12세', poster: '🌌', director: '최현우', releaseDate: '2026-06-12', synopsis: '우주 정거장에서 벌어지는 생존과 선택의 이야기.', status: '상영중' },
    { id: 'm-2', title: '마지막 골목', genre: '스릴러', runtime: 111, rating: '15세', poster: '🌆', director: '오정민', releaseDate: '2026-07-03', synopsis: '재개발 직전 골목에서 벌어진 실종 사건을 쫓는 형사.', status: '상영중' },
    { id: 'm-3', title: '봄날의 스케치', genre: '드라마', runtime: 104, rating: '전체', poster: '🌸', director: '한지수', releaseDate: '2026-05-22', synopsis: '20년 만에 재회한 두 친구의 잔잔한 성장기.', status: '상영중' },
    { id: 'm-4', title: '레드 라인', genre: '액션', runtime: 132, rating: '15세', poster: '🔥', director: '브라이언 최', releaseDate: '2026-07-24', synopsis: '국경을 넘나드는 추격전, 멈출 수 없는 질주.', status: '상영중' },
    { id: 'm-5', title: '딥 오션', genre: '다큐멘터리', runtime: 96, rating: '전체', poster: '🐋', director: '이수아', releaseDate: '2026-09-05', synopsis: '심해 생태계를 담은 몰입형 다큐멘터리.', status: '상영예정' },
  ];

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStrs = [toDateStr(today), toDateStr(tomorrow)];
  const times = ['10:30', '13:20', '16:10', '19:00', '21:40'];
  const theaters = ['1관', '2관', '3관'];

  const showtimes = [];
  let stIdx = 1;
  movies.filter((m) => m.status === '상영중').forEach((movie, mIdx) => {
    dateStrs.forEach((date) => {
      const dayTimes = times.slice(mIdx % 2, mIdx % 2 + 3);
      dayTimes.forEach((time, tIdx) => {
        showtimes.push({
          id: `st-${stIdx++}`,
          movieId: movie.id,
          date,
          time,
          theater: theaters[(mIdx + tIdx) % theaters.length],
          price: 14000,
        });
      });
    });
  });

  // 몇몇 상영에는 미리 예약된 좌석을 시드로 채워서 화면에 데이터가 보이게 함
  const bookings = [];
  const presetTaken = {
    [showtimes[0]?.id]: ['C4', 'C5', 'D4'],
    [showtimes[1]?.id]: ['A1', 'A2'],
    [showtimes[3]?.id]: ['E7', 'E8'],
  };
  Object.entries(presetTaken).forEach(([showtimeId, seatIds], idx) => {
    if (!showtimeId || showtimeId === 'undefined') return;
    bookings.push({
      id: `bk-seed-${idx}`,
      userId: 'u-2',
      showtimeId,
      seatIds,
      status: '예매완료',
      bookedAt: toDateStr(today),
      totalPrice: seatIds.length * 14000,
    });
  });

  const db = { users, movies, showtimes, bookings, payments: [] };
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return db;
}

function getDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return seedDB();
  try {
    return JSON.parse(raw);
  } catch {
    return seedDB();
  }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function resetDemoData() {
  return delay(seedDB());
}

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

export async function getAllUsers() {
  const db = getDB();
  return delay(db.users.map(({ password, ...safe }) => safe));
}

export async function updateUser(userId, patch) {
  const db = getDB();
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx === -1) return Promise.reject(new Error('회원을 찾을 수 없습니다.'));
  db.users[idx] = { ...db.users[idx], ...patch };
  saveDB(db);
  const { password, ...safe } = db.users[idx];
  return delay(safe);
}

//장르/등급 이름 사전 헬퍼 추가
// 장르/등급은 백엔드가 id로만 주기 때문에, id -> 이름으로 바꿔줄 사전이 필요함.
// 앱에서 한 번만 불러와서 캐시해두고 계속 재사용.
let genreRatingCache = null;
async function getGenreRatingMaps() {
  if (genreRatingCache) return genreRatingCache;
  const [genreRes, ratingRes] = await Promise.all([
    fetch(`${API_BASE}/genres`),
    fetch(`${API_BASE}/ratings`),
  ]);
  const genres = await genreRes.json();
  const ratings = await ratingRes.json();
  genreRatingCache = {
    genreById: Object.fromEntries(genres.map((g) => [g.genreId, g.genreName])),
    ratingById: Object.fromEntries(ratings.map((r) => [r.ratingId, r.name])),
    genreIdByName: Object.fromEntries(genres.map((g) => [g.genreName, g.genreId])),
    ratingIdByName: Object.fromEntries(ratings.map((r) => [r.name, r.ratingId])),
  };
  return genreRatingCache;
}

export async function getGenres() {
  const res = await fetch(`${API_BASE}/genres`);
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || '장르 목록을 불러오지 못했습니다.');
  }
  return body; // [{ genreId, genreName }, ...]
}

export async function getRatings() {
  const res = await fetch(`${API_BASE}/ratings`);
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || '등급 목록을 불러오지 못했습니다.');
  }
  return body; // [{ ratingId, name }, ...]
}

const MOVIE_STATUS_TO_KR = { SHOWING: '상영중', UPCOMING: '상영예정' };

function toDisplayMovie(m, maps) {
  return {
    id: String(m.movieId),
    title: m.title,
    genre: maps.genreById[m.genreId] ?? '알 수 없음',
    runtime: m.runtime,
    rating: maps.ratingById[m.ratingId] ?? '알 수 없음',
    posterUrl: m.posterBase64 || undefined,
    director: m.director,
    releaseDate: m.releaseDate,
    synopsis: m.synopsis,
    status: MOVIE_STATUS_TO_KR[m.status] ?? m.status,
  };
}

//영화 조회
export async function getMovies() {
  const res = await fetch(`${API_BASE}/movies`);
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || '영화 목록을 불러오지 못했습니다.');
  }
  const maps = await getGenreRatingMaps();
  return body.data.map((m) => toDisplayMovie(m, maps));
}

//getMovie(movieId) 교체
export async function getMovie(movieId) {
  const res = await fetch(`${API_BASE}/movies/${movieId}`);
  if (res.status === 404) return null; // 원래 mock도 없으면 null 반환했음
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || '영화 정보를 불러오지 못했습니다.');
  }
  const maps = await getGenreRatingMaps();
  return toDisplayMovie(body.data, maps);
}

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

function isHoldActive(booking) {
  if (booking.status !== '결제대기') return false;
  return Date.now() - new Date(booking.heldAt).getTime() < HOLD_TIMEOUT_MS;
}

function bookedSeatsFor(db, showtimeId) {
  const taken = new Set();
  db.bookings
    .filter((b) => b.showtimeId === showtimeId && (b.status === '예매완료' || isHoldActive(b)))
    .forEach((b) => b.seatIds.forEach((s) => taken.add(s)));
  return taken;
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

//예매하기 (같은 상영 회차에 대한 더블 부킹 방지, )
/*showtimeRepository.findByIdForUpdate(...) — @Lock(PESSIMISTIC_WRITE)가 걸려있어서, 
같은 상영 회차에 대한 예매 요청은 DB 레벨에서 한 줄로 세워져요. 
두 사람이 동시에 눌러도 실제 처리 순서는 하나씩.
좌석 저장 시 booking_seats(showtime_id, seat_code) UNIQUE 제약이 최후 방어선 
— 락을 어찌어찌 우회해도 두 번째 INSERT가 무조건 터짐.
충돌 나면 409 Conflict + "이미 선점된 좌석이 있습니다." 응답. */
export async function createBooking(userId, showtimeId, seatIds) {
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
    holdExpiresAt: b.holdExpiresAt,
  };
}

// 모의 결제. forceResult('SUCCESS' | 'FAILED')를 주면 결과를 강제하고, 없으면 임의 확률로 성공/실패한다.
// 성공하면 예매가 CONFIRMED로 확정되고, 실패하거나 임시선점이 만료되면 좌석이 자동 해제(예매 취소)된다.
export async function createPayment(bookingId, forceResult) {
  const res = await fetch(`${API_BASE}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ bookingId: Number(bookingId), forceResult }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || '결제에 실패했습니다.');
  }
  if (body.data.status === 'FAILED') {
    // 백엔드는 결제 실패도 200으로 응답해서, 화면 쪽 실패 처리(catch)를 태우려면 여기서 던져야 함
    throw new Error('결제에 실패했습니다. 좌석이 해제되었습니다.');
  }
  return body.data;
}

//내 예매 조회
const BOOKING_STATUS_MAP = { HELD: '결제대기', CONFIRMED: '예매완료', CANCELLED: '취소됨' };

function toDisplayBooking(b) {
  const holdExpiresAt = b.holdExpiresAt;
  return {
    id: String(b.bookingId),
    showtimeId: String(b.showtimeId),
    status: BOOKING_STATUS_MAP[b.status] ?? b.status,
    seatIds: b.seatCodes,
    totalPrice: b.totalPrice,
    movieTitle: b.movieTitle,
    moviePoster: '🎬', // ← 이 줄 추가
    moviePosterUrl: b.moviePosterBase64 || undefined,
    showtime: { date: b.date, time: b.time.slice(0, 5), theater: b.theater },
    holdExpiresAt,
    holdExpired: b.status === 'HELD' && (!holdExpiresAt || new Date(holdExpiresAt).getTime() < Date.now()),
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

const KR_TO_MOVIE_STATUS = { '상영중': 'SHOWING', '상영예정': 'UPCOMING' };

function toMovieRequestBody(movie, maps) {
  const genreId = maps.genreIdByName[movie.genre];
  const ratingId = maps.ratingIdByName[movie.rating];
  if (!genreId) throw new Error(`"${movie.genre}" 장르가 DB에 없습니다. 먼저 등록해주세요.`);
  if (!ratingId) throw new Error(`"${movie.rating}" 등급이 DB에 없습니다. 먼저 등록해주세요.`);
  return {
    title: movie.title,
    genreId,
    runtime: movie.runtime,
    ratingId,
    director: movie.director,
    releaseDate: movie.releaseDate,
    posterBase64: movie.posterUrl || '',
    synopsis: movie.synopsis,
    status: KR_TO_MOVIE_STATUS[movie.status] ?? movie.status,
  };
}

//모든 영화 불러오기 
export async function getAllMovies() {
  return getMovies(); // 위에서 만든 getMovies()랑 로직이 똑같아서 그냥 재사용
}

//영화 업데이트
export async function updateMovie(movieId, patch) {
  const maps = await getGenreRatingMaps();
  const body = toMovieRequestBody(patch, maps);
  const res = await fetch(`${API_BASE}/movies/${movieId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const resBody = await res.json();
  if (!res.ok) {
    throw new Error(resBody.message || '영화 수정에 실패했습니다.');
  }
  return toDisplayMovie(resBody.data, maps);
}
//영화 등록
export async function createMovie(movie) {
  const maps = await getGenreRatingMaps();
  const body = toMovieRequestBody(movie, maps);
  const res = await fetch(`${API_BASE}/movies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const resBody = await res.json();
  if (!res.ok) {
    throw new Error(resBody.message || '영화 등록에 실패했습니다.');
  }
  return toDisplayMovie(resBody.data, maps);
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
  const res = await fetch(`${API_BASE}/showtimes`, {
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
    throw new Error(body.message || '상영 등록에 실패했습니다.');
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
  const res = await fetch(`${API_BASE}/showtimes/${showtimeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(patch),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.message || '상영 수정에 실패했습니다.');
  }
  return toDisplayShowtime(body.data);
}

// 같은 영화의 여러 상영을 한 번에 수정할 때 사용 (예: 상영관·가격 일괄 변경)
export async function updateShowtimesBulk(showtimeIds, patch) {
  const res = await fetch(`${API_BASE}/showtimes/bulk`, {
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
    throw new Error(body.message || '일괄 수정에 실패했습니다.');
  }
  return body.data.map(toDisplayShowtime);
}

export async function getBookingStats() {
  const db = getDB();
  const today = toDateStr(new Date());
  const confirmed = db.bookings.filter((b) => b.status === '예매완료');
  const todayBookings = confirmed.filter((b) => b.bookedAt === today);
  const totalSeatsSold = confirmed.reduce((n, b) => n + b.seatIds.length, 0);
  const todayRevenue = todayBookings.reduce((n, b) => n + b.totalPrice, 0);
  const totalRevenue = confirmed.reduce((n, b) => n + b.totalPrice, 0);
  return delay({
    todayBookingCount: todayBookings.length,
    todayRevenue,
    totalBookingCount: confirmed.length,
    totalSeatsSold,
    totalRevenue,
  });
}
