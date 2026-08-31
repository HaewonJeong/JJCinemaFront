export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pagination">
      <button
        type="button"
        className="btn btn-sm btn-outline"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        이전
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={'pagination-page' + (p === page ? ' active' : '')}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        className="btn btn-sm btn-outline"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        다음
      </button>
    </div>
  );
}
