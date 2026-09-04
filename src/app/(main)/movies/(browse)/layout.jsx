import MoviesLayout from '@/components/MoviesLayout';

// /movies/now-showing, /movies/upcoming 에만 적용되는 사이드바+탭 레이아웃.
// /movies/[movieId] 는 이 그룹 밖이라 이 레이아웃을 받지 않는다.
export default function BrowseLayout({ children }) {
  return <MoviesLayout>{children}</MoviesLayout>;
}
