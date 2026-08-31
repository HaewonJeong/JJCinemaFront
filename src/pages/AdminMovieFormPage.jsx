import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createMovie, getMovie, updateMovie } from '../api/mockApi';

const GENRE_OPTIONS = ['액션', '드라마', '코미디', '로맨스', '스릴러', '공포', 'SF', '판타지', '애니메이션', '다큐멘터리', '뮤지컬', '범죄'];
const RATING_OPTIONS = ['전체', '12세', '15세', '19세'];

const emptyForm = {
  title: '',
  genre: GENRE_OPTIONS[0],
  runtime: '',
  rating: RATING_OPTIONS[0],
  director: '',
  releaseDate: '',
  synopsis: '',
  status: '상영중',
  posterUrl: '',
};

export default function AdminMovieFormPage() {
  const { movieId } = useParams();
  const isEdit = Boolean(movieId);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getMovie(movieId).then((m) => {
      if (m) {
        setForm({
          title: m.title ?? '',
          genre: GENRE_OPTIONS.includes(m.genre) ? m.genre : GENRE_OPTIONS[0],
          runtime: String(m.runtime ?? ''),
          rating: RATING_OPTIONS.includes(m.rating) ? m.rating : RATING_OPTIONS[0],
          director: m.director ?? '',
          releaseDate: m.releaseDate ?? '',
          synopsis: m.synopsis ?? '',
          status: m.status ?? '상영중',
          posterUrl: m.posterUrl ?? '',
        });
      }
      setLoading(false);
    });
  }, [isEdit, movieId]);

  function handlePosterChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, posterUrl: reader.result }));
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        genre: form.genre,
        runtime: Number(form.runtime) || 0,
        rating: form.rating,
        director: form.director,
        releaseDate: form.releaseDate,
        synopsis: form.synopsis,
        status: form.status,
        posterUrl: form.posterUrl || undefined,
      };
      if (isEdit) {
        await updateMovie(movieId, payload);
      } else {
        await createMovie(payload);
      }
      navigate('/admin/movies');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <div className="panel">
      <h2 className="panel-title">{isEdit ? '영화 수정' : '영화 등록'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="admin-form">
          <div className="field-full">
            <label className="field-label">포스터 이미지</label>
            <div className="poster-upload">
              <div className="poster-preview">
                {form.posterUrl ? <img src={form.posterUrl} alt="포스터 미리보기" /> : '🎬'}
              </div>
              <input type="file" accept="image/*" onChange={handlePosterChange} />
            </div>
          </div>

          <div className="field-full">
            <label className="field-label">제목</label>
            <input
              className="text-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="field-label">장르</label>
            <select
              className="text-input"
              value={form.genre}
              onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
            >
              {GENRE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="field-label">러닝타임(분)</label>
            <input
              className="text-input"
              type="number"
              min="1"
              value={form.runtime}
              onChange={(e) => setForm((f) => ({ ...f, runtime: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="field-label">관람등급</label>
            <select
              className="text-input"
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
            >
              {RATING_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="field-label">상영 상태</label>
            <select
              className="text-input"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="상영중">상영중</option>
              <option value="상영예정">상영예정</option>
            </select>
          </div>

          <div>
            <label className="field-label">감독</label>
            <input
              className="text-input"
              value={form.director}
              onChange={(e) => setForm((f) => ({ ...f, director: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="field-label">개봉일</label>
            <input
              className="text-input"
              type="date"
              value={form.releaseDate}
              onChange={(e) => setForm((f) => ({ ...f, releaseDate: e.target.value }))}
              required
            />
          </div>

          <div className="field-full">
            <label className="field-label">정보</label>
            <input
              className="text-input"
              value={form.synopsis}
              onChange={(e) => setForm((f) => ({ ...f, synopsis: e.target.value }))}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? '저장 중…' : isEdit ? '수정 저장' : '영화 등록'}
        </button>
      </form>
    </div>
  );
}
