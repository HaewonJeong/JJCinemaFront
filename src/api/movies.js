import { API_BASE } from './client';

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
  const res = await fetch(`${API_BASE}/admin/movies/${movieId}`, {
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
  const res = await fetch(`${API_BASE}/admin/movies`, {
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
