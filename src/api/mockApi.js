// 목업 데이터 레이어. 실제 백엔드가 만들어지면 이 파일의 함수 내부만
// fetch('/api/...') 호출로 교체하면 되고, 화면(컴포넌트) 쪽 코드는 그대로 써도 됩니다.
// 좌석 예매의 핵심 함정(더블부킹)을 눈으로 보여주기 위해 createBooking은
// "제출 시점에 좌석 상태를 다시 확인"하는 방식으로 만들었습니다 — 실제 서버라면
// 이 확인+예약 사이의 틈을 막기 위해 락(비관적 락 등)이 필요합니다.

const DB_KEY = 'movie_booking_db_v1';
const LATENCY = 300;
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

export async function login(email, password) {
  const db = getDB();
  const user = db.users.find((u) => u.email === email && u.password === password);
  if (!user) return Promise.reject(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'));
  if (user.active === false) return Promise.reject(new Error('비활성화된 계정입니다. 관리자에게 문의하세요.'));
  const { password: _pw, ...safeUser } = user;
  return delay(safeUser);
}

export async function signup({ name, email, password }) {
  const db = getDB();
  if (db.users.some((u) => u.email === email)) {
    return Promise.reject(new Error('이미 사용 중인 이메일입니다.'));
  }
  const newUser = {
    id: `u-${Date.now()}`,
    name,
    email,
    password,
    role: 'customer',
    active: true,
  };
  db.users.push(newUser);
  saveDB(db);
  const { password: _pw, ...safeUser } = newUser;
  return delay(safeUser);
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

export async function getMovies() {
  const db = getDB();
  return delay(db.movies);
}

export async function getMovie(movieId) {
  const db = getDB();
  const movie = db.movies.find((m) => m.id === movieId) || null;
  return delay(movie);
}

export async function getShowtimes(movieId) {
  const db = getDB();
  const list = db.showtimes
    .filter((s) => s.movieId === movieId)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return delay(list);
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

export async function getSeatMap(showtimeId) {
  const db = getDB();
  const showtime = db.showtimes.find((s) => s.id === showtimeId);
  const taken = bookedSeatsFor(db, showtimeId);
  const seats = allSeatCodes().map((code) => ({
    code,
    row: code[0],
    status: taken.has(code) ? '예약됨' : '선택가능',
  }));
  return delay({ showtime, rows: ROWS, cols: COLS, seats });
}

export async function createBooking(userId, showtimeId, seatIds) {
  const db = getDB();
  // 더블부킹 방지 지점: 좌석을 고른 시점과 "선점" 시점 사이에
  // 다른 사용자가 같은 좌석을 먼저 가져갔을 수 있으므로 여기서 다시 확인한다.
  // 예매는 곧바로 확정되지 않고, 결제가 완료될 때까지 좌석을 임시선점(HOLD)한다.
  const taken = bookedSeatsFor(db, showtimeId);
  const conflicts = seatIds.filter((code) => taken.has(code));
  if (conflicts.length > 0) {
    return Promise.reject(new Error(`이미 선점되었거나 예약된 좌석입니다: ${conflicts.join(', ')}`));
  }
  const showtime = db.showtimes.find((s) => s.id === showtimeId);
  const booking = {
    id: `bk-${Date.now()}`,
    userId,
    showtimeId,
    seatIds,
    status: '결제대기',
    heldAt: new Date().toISOString(),
    bookedAt: toDateStr(new Date()),
    totalPrice: seatIds.length * (showtime?.price ?? 14000),
    paymentId: null,
  };
  db.bookings.push(booking);
  saveDB(db);
  return delay(booking);
}

export async function getBooking(bookingId) {
  const db = getDB();
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) return delay(null);
  const showtime = db.showtimes.find((s) => s.id === booking.showtimeId);
  const movie = db.movies.find((m) => m.id === showtime?.movieId);
  return delay({
    ...booking,
    showtime,
    movieTitle: movie?.title ?? '알 수 없음',
    moviePoster: movie?.poster ?? '🎬',
    moviePosterUrl: movie?.posterUrl,
    holdExpiresAt:
      booking.status === '결제대기' ? new Date(new Date(booking.heldAt).getTime() + HOLD_TIMEOUT_MS).toISOString() : null,
  });
}

// 모의 결제. forceResult('SUCCESS' | 'FAILED')를 주면 결과를 강제하고, 없으면 임의 확률로 성공/실패한다.
// 성공하면 예매가 CONFIRMED로 확정되고, 실패하거나 임시선점이 만료되면 좌석이 자동 해제(예매 취소)된다.
export async function createPayment(bookingId, forceResult) {
  const db = getDB();
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) return Promise.reject(new Error('예매 내역을 찾을 수 없습니다.'));
  if (booking.status !== '결제대기') {
    return Promise.reject(new Error('이미 처리된 예매입니다.'));
  }
  if (!isHoldActive(booking)) {
    booking.status = '취소됨';
    saveDB(db);
    return Promise.reject(new Error('좌석 임시선점 시간이 만료되었습니다. 좌석을 다시 선택해주세요.'));
  }

  const succeeded = forceResult ? forceResult === 'SUCCESS' : Math.random() > 0.15;
  const payment = {
    id: `pay-${Date.now()}`,
    bookingId,
    amount: booking.totalPrice,
    status: succeeded ? '성공' : '실패',
    method: '모의결제',
    paidAt: new Date().toISOString(),
  };
  db.payments = db.payments || [];
  db.payments.push(payment);

  if (succeeded) {
    booking.status = '예매완료';
    booking.paymentId = payment.id;
  } else {
    booking.status = '취소됨';
  }
  saveDB(db);

  if (!succeeded) {
    return Promise.reject(new Error('결제에 실패했습니다. 좌석이 해제되었습니다.'));
  }
  return delay({ payment, booking });
}

export async function getMyBookings(userId) {
  const db = getDB();
  const list = db.bookings
    .filter((b) => b.userId === userId)
    .map((b) => {
      const showtime = db.showtimes.find((s) => s.id === b.showtimeId);
      const movie = db.movies.find((m) => m.id === showtime?.movieId);
      const payment = (db.payments || []).find((p) => p.id === b.paymentId);
      return {
        ...b,
        showtime,
        movieTitle: movie?.title ?? '알 수 없음',
        moviePoster: movie?.poster ?? '🎬',
        moviePosterUrl: movie?.posterUrl,
        paymentStatus: payment?.status ?? null,
        holdExpired: b.status === '결제대기' && !isHoldActive(b),
      };
    })
    .sort((a, b) => (a.bookedAt < b.bookedAt ? 1 : -1));
  return delay(list);
}

export async function cancelBooking(bookingId) {
  const db = getDB();
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) return Promise.reject(new Error('예매 내역을 찾을 수 없습니다.'));
  if (booking.status === '취소됨') return delay(booking);
  const wasConfirmed = booking.status === '예매완료';
  booking.status = '취소됨';
  if (wasConfirmed && booking.paymentId) {
    const payment = (db.payments || []).find((p) => p.id === booking.paymentId);
    if (payment && payment.status === '성공') payment.status = '환불됨';
  }
  saveDB(db);
  return delay(booking);
}

export async function getAllMovies() {
  const db = getDB();
  return delay(db.movies);
}

export async function updateMovie(movieId, patch) {
  const db = getDB();
  const idx = db.movies.findIndex((m) => m.id === movieId);
  if (idx === -1) return Promise.reject(new Error('영화를 찾을 수 없습니다.'));
  db.movies[idx] = { ...db.movies[idx], ...patch };
  saveDB(db);
  return delay(db.movies[idx]);
}

export async function createMovie(movie) {
  const db = getDB();
  const newMovie = { id: `m-${Date.now()}`, status: '상영예정', ...movie };
  db.movies.push(newMovie);
  saveDB(db);
  return delay(newMovie);
}

export async function getAllShowtimesAdmin() {
  const db = getDB();
  const list = db.showtimes.map((s) => {
    const movie = db.movies.find((m) => m.id === s.movieId);
    const taken = bookedSeatsFor(db, s.id).size;
    return { ...s, movieTitle: movie?.title ?? '알 수 없음', bookedSeats: taken, totalSeats: ROWS.length * COLS.length };
  });
  return delay(list);
}

export async function createShowtime(showtime) {
  const db = getDB();
  const newShowtime = { id: `st-${Date.now()}`, price: 14000, ...showtime };
  db.showtimes.push(newShowtime);
  saveDB(db);
  return delay(newShowtime);
}

export async function getShowtime(showtimeId) {
  const db = getDB();
  const showtime = db.showtimes.find((s) => s.id === showtimeId);
  if (!showtime) return delay(null);
  const movie = db.movies.find((m) => m.id === showtime.movieId);
  return delay({ ...showtime, movieTitle: movie?.title ?? '알 수 없음' });
}

export async function updateShowtime(showtimeId, patch) {
  const db = getDB();
  const idx = db.showtimes.findIndex((s) => s.id === showtimeId);
  if (idx === -1) return Promise.reject(new Error('상영 정보를 찾을 수 없습니다.'));
  db.showtimes[idx] = { ...db.showtimes[idx], ...patch };
  saveDB(db);
  return delay(db.showtimes[idx]);
}

// 같은 영화의 여러 상영을 한 번에 수정할 때 사용 (예: 상영관·가격 일괄 변경)
export async function updateShowtimesBulk(showtimeIds, patch) {
  const db = getDB();
  const idSet = new Set(showtimeIds);
  db.showtimes = db.showtimes.map((s) => (idSet.has(s.id) ? { ...s, ...patch } : s));
  saveDB(db);
  return delay(db.showtimes.filter((s) => idSet.has(s.id)));
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
