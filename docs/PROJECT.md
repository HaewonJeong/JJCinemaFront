# 영화 예매 앱 - 프로젝트 정의

## 1. 해결하고자 하는 문제

**서비스 관점**: 영화 예매 시 여러 사용자가 동시에 같은 좌석을 선택할 때 발생하는 더블부킹(중복 예매) 문제를 안전하게 처리하는 예매 백엔드가 필요하다. 프론트엔드의 `mockApi.js`에도 "제출 시점에 좌석 상태를 재확인"하는 방식으로 이 함정을 보여주도록 이미 설계되어 있으며, 실제 서버에서는 이 확인 시점과 확정 시점 사이의 틈을 막기 위한 락 처리가 필요하다.

**학습 관점**: 프론트엔드는 이미 구현되어 있으므로, 이번 프로젝트의 목적은 Spring Boot 백엔드를 직접 만들며 계층형 아키텍처, 인증/인가, 동시성 제어, 결제 흐름, 예외 처리, 테스트를 4주 동안 개념 중심으로 체화하는 것이다.

## 2. 주요 기능 (MVP)

- **인증/회원**: 로그인(세션 또는 JWT 택1), customer/admin 역할 구분
- **영화·상영 조회**: 영화 목록/상세, 상영 시간표 조회
- **좌석 예매 + 모의 결제**: 좌석 임시선점(HOLD) → 모의 결제 요청 → 성공 시 예매 확정 / 실패·타임아웃 시 좌석 자동 해제
- **내 예매 관리**: 내 예매 내역 조회, 예매 취소(환불 상태 반영)
- **관리자**: 영화/상영 등록, 좌석 점유율·매출 통계(결제 완료 기준)

## 3. 화면/기능 흐름

```
로그인 → 영화 목록 → 상영시간표 → 좌석 선택(임시선점, 5분)
                                       ↓
                                  결제 페이지 이동
                                 ↙           ↘
                          결제 성공        결제 실패/타임아웃
                          예매완료         취소됨(좌석 자동 해제)
                            ↓
                      내 예매 내역 (결제대기 / 예매완료 / 취소됨·환불됨)
```

- Booking 상태: `결제대기 → 예매완료 → 취소됨`
- Payment 상태: `성공 | 실패 | 환불됨` (결제는 요청 시점에 즉시 성공/실패로 결정되며 별도의 대기 상태는 저장하지 않음)
- 좌석 임시선점(HOLD) 유효시간: 5분 — 만료 전에는 다른 사용자에게도 해당 좌석이 "예약됨"으로 보여 더블부킹을 막는다.

관리자 흐름: `로그인(admin) → 관리자 대시보드 → 영화/상영 등록, 좌석 점유율·매출 통계 확인`

화면 구현: `LoginPage`, `MoviesPage`, `ShowtimesPage`, `SeatSelectionPage`, `PaymentPage`, `MyBookingsPage`, `AdminDashboardPage` (`src/pages/`) — `PaymentPage`는 결제 기능과 함께 신규 추가됨

## 4. 기술 스택

- **Backend**: Java, Spring Boot, Spring Data JPA, Spring Security(JWT)
- **DB**: PostgreSQL (docker-compose로 로컬 구동)
- **Frontend**: React + Vite (이미 구현됨, `mockApi.js` → 실제 fetch 호출로 교체 예정)
- **Test/Infra**: JUnit5 + Mockito, Docker
- **배포**: AWS Elastic Beanstalk(Java 플랫폼, jar 업로드, Single instance) + AWS RDS(PostgreSQL), GitHub Actions로 배포 자동화 (Docker/ECR 없이 jar 그대로) — 프론트는 Amplify Hosting이 GitHub 연결만으로 자동배포, 상세는 Notion "배포 아키텍처" 페이지 참고

> Redis 캐싱, Spring Batch, 분산 세션, JMeter 부하테스트는 이번 4주(기초 개념 트랙) 범위에서 제외 — 추후 포트폴리오 심화 트랙으로 확장 가능.

## 5. 시스템 아키텍처

```
┌─────────────┐        ┌────────────────────────────────────────┐
│  React SPA   │  REST  │             Spring Boot App              │
│ (mockApi.js  │ ─────▶ │  Controller → Service → Repository       │
│  → fetch)    │        │  - AuthController                        │
└─────────────┘        │  - MovieController / ShowtimeController   │
                        │  - BookingController (좌석 임시선점/확정)   │
                        │  - PaymentController (모의 결제, 서버 내부) │
                        │  - AdminController                       │
                        └───────────────────┬───────────────────────┘
                                             │
                                    ┌────────▼────────┐
                                    │   PostgreSQL      │
                                    │ User / Movie /   │
                                    │ Showtime /       │
                                    │ Booking / Payment │
                                    └───────────────────┘
```

결제는 외부 PG 연동 없이 서버 내부 로직으로 성공/실패를 시뮬레이션한다.

> **구현 현황**: 위 구조는 백엔드 목표 아키텍처이며, Spring Boot 서버는 아직 착수 전이다. 현재는 프론트엔드 `mockApi.js`가 이 좌석 임시선점·결제·확정 흐름을 로컬(localStorage)에서 그대로 시뮬레이션하고 있다 — 자세한 내용은 8절 참고.

## 6. 4주 로드맵 (기초 개념 트랙 + 결제)

| 주차 | 범위 | 핵심 학습 |
|---|---|---|
| **WK1** (Day1–6) | 스프링 부트 구조, 기본 CRUD | 계층형 아키텍처, Movie 엔티티 CRUD, REST API 설계, JPA/Hibernate 동작 원리 |
| **WK2** (Day7–12) | 인증 + 좌석 임시선점 + 모의 결제 | 세션 vs 토큰 인증, 동시성 문제 재현, 비관/낙관 락, DTO/Entity 분리, 모의 결제 API(대기→성공/실패). *프론트엔드에서 동일한 계약으로 이미 프로토타입 구현됨 — 백엔드는 이 계약대로 재구현* |
| **WK3** (Day13–18) | 연관관계와 예외 처리 | Booking-Showtime-User-Payment(1:1) 연관관계, 예외 처리(@ControllerAdvice), 결제 실패·환불 케이스 처리, 좌석 점유율/매출 통계 |
| **WK4** (Day19–24) | 테스트 + 정리 | JUnit5+Mockito 단위테스트, 동시 예매+결제 시나리오 테스트, Docker 기초, 전체 복습·리팩터링 |

## 7. API 명세

| 기능 | Endpoint |
|---|---|
| 로그인 | `POST /api/auth/login` |
| 영화 목록/상세 | `GET /api/movies`, `GET /api/movies/{id}` |
| 상영 시간표 | `GET /api/movies/{id}/showtimes` |
| 좌석 현황 | `GET /api/showtimes/{id}/seats` |
| 예매 생성(좌석 임시선점) | `POST /api/bookings` |
| 예매 단건 조회 | `GET /api/bookings/{id}` |
| 모의 결제 요청 | `POST /api/payments` (bookingId — 금액은 서버가 예매 정보로 계산) |
| 내 예매 조회 | `GET /api/bookings/me` |
| 예매 취소(환불 트리거) | `PATCH /api/bookings/{id}/cancel` |
| 관리자 - 영화 등록 | `POST /api/admin/movies` |
| 관리자 - 상영 등록 | `POST /api/admin/showtimes` |
| 관리자 - 전체 스케줄 조회 | `GET /api/admin/showtimes` |
| 관리자 - 통계 조회 | `GET /api/admin/stats` |

## 8. 구현 현황 (2026-08-11 기준)

프론트엔드 mock 레이어(`src/api/mockApi.js`)에 좌석 임시선점 → 결제 → 확정/해제 흐름을 실제로 구현하고, Playwright로 브라우저 구동까지 검증 완료했다 (콘솔 에러 0건).

- `createBooking(userId, showtimeId, seatIds)`: 좌석을 즉시 확정하지 않고 `결제대기` 상태로 5분간 임시선점(HOLD)
- `createPayment(bookingId, forceResult?)`: 모의 결제 처리. 성공 시 `예매완료`로 확정, 실패·시간 만료 시 `취소됨`으로 좌석 자동 해제. 데모/테스트 목적으로 결과를 강제할 수 있는 `forceResult` 파라미터 포함(`SUCCESS`/`FAILED`)
- `getBooking(bookingId)`: 결제 페이지용 예매 단건 조회, 임시선점 만료 시각 포함
- `cancelBooking(bookingId)`: 결제 완료 건 취소 시 결제 상태를 `환불됨`으로 함께 반영
- 신규 화면 `PaymentPage.jsx`(`/payment/:bookingId`): 좌석/금액 요약, 5분 카운트다운, "결제하기"/"결제 실패 시뮬레이션" 버튼
- `SeatSelectionPage`는 좌석 선택 후 바로 확정하지 않고 결제 페이지로 이동하도록 변경, `MyBookingsPage`는 결제대기/결제만료/환불됨 상태 뱃지와 관련 액션 버튼을 추가로 표시

**남은 것**: 실제 Spring Boot 백엔드는 아직 착수 전 — 위 mock 함수들의 계약이 7절 API 명세로 그대로 이어지도록 구현하는 것이 WK1~WK2의 목표.
