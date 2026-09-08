## JJCinemaFront
> 영화 예매 서비스 프론트엔드입니다. (백엔드: [JJCinemaBackend](../JJCinemaBackend))

## 기술 스택

<img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white"/>
<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black"/>

## 로컬 환경 실행

```bash
npm install
npm run dev        # http://localhost:5173
```

## 주요 기능

**일반 사용자**
- 회원가입(닉네임/이메일/비밀번호 형식 검증, 이메일 실시간 중복확인), 로그인/로그아웃(서버 세션 기반, 새로고침 시 세션 복원)
- 영화 목록 조회(상영중/상영예정 탭, 제목·장르 검색), 상영시간표 조회
- 좌석 선택 및 임시선점(HOLD, 5분), 모의 결제(성공/실패 시뮬레이션), 예매 확정
- 내 예매 조회, 예매 취소(결제완료 건은 환불 처리)

**관리자**
- 대시보드: 오늘/누적 매출·예매 통계, 상영별 좌석 점유율
- 영화 관리: 등록/수정/삭제(포스터 업로드, 장르·등급 DB 연동 드롭다운)
- 상영 관리: 다중 슬롯 일괄 등록, 개별 수정, 여러 회차 선택 후 일괄 수정(상영관/가격), 상영 내역 삭제
- 회원 관리: 역할(일반/관리자) 변경, 계정 활성/비활성 (본인 계정은 변경 불가)

## 시연
<img width="312" height="240" alt="0905 (1)(4)" src="https://github.com/user-attachments/assets/8ef9d795-0799-4aea-a9b7-b77590045dd5" />
<img width="312" height="240" alt="0905 (1)(1)" src="https://github.com/user-attachments/assets/5311d432-52af-4ccc-a9c5-22cdf281f2b0" />

## 멤버
⚙️**Front/Backend Developer** | 정해원
