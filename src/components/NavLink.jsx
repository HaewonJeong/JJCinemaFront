'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// react-router-dom의 <NavLink>를 대체하는 컴포넌트.
// className은 문자열이거나 ({ isActive }) => string 형태의 함수를 받는다.
// end=true 면 정확히 일치할 때만 active, 아니면 하위 경로도 active 처리한다.
export default function NavLink({ href, end = false, className, children, ...rest }) {
  const pathname = usePathname();
  const isActive = end
    ? pathname === href
    : pathname === href || pathname.startsWith(href + '/');
  const resolvedClassName =
    typeof className === 'function' ? className({ isActive }) : className;

  return (
    <Link href={href} className={resolvedClassName} {...rest}>
      {children}
    </Link>
  );
}
