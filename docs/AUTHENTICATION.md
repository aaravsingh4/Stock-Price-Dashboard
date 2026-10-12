# Authentication & Secure Sessions Architecture

TradePulse Pro uses **server-side HTTP-only sessions backed by PostgreSQL** with `bcryptjs` password hashing and CSRF defenses.

---

## 1. Authentication Endpoints

All authentication endpoints are mounted under `/api/auth`:

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Registers a new account, generates bcrypt hash (12 salt rounds), provisions default watchlist atomically, and creates session. | No |
| `POST` | `/api/auth/login` | Validates credentials with rate limiting (5 attempts/min), rotates session ID on authentication. | No |
| `POST` | `/api/auth/logout` | Destroys PostgreSQL session record, clears client cookie. | Yes |
| `GET` | `/api/auth/me` | Returns sanitized current user profile (`{ id, email, createdAt, updatedAt }`). | Optional |

---

## 2. Security Implementations

1. **Password Hashing**: `bcryptjs` with 12 salt rounds. Password hashes are stripped before leaving the service layer and are never transmitted to client or logged.
2. **PostgreSQL Session Store**: Express sessions are backed by `connect-pg-simple` querying the `session` table in `tradepulse-dev`. No sensitive state is kept in server memory.
3. **Session ID Rotation**: Calling `req.session.regenerate()` upon registration and login prevents session fixation attacks.
4. **Cookie Hardening**:
   - `httpOnly: true`: Blocks client-side JavaScript access (`document.cookie`), preventing XSS token theft.
   - `secure`: Automatically enabled in production HTTPS environments.
   - `sameSite`: `strict` in production, `lax` in local development.
   - `rolling: true`: Extends session lifetime on active user interactions.
5. **CSRF Mitigation**: Custom header verification (`X-Requested-With: TradePulse-Client`) and origin validation protect state-mutating requests from malicious cross-origin form submissions.
6. **Rate Limiting**: Sliding window rate limiter throttles repeated login attempts per IP address.
