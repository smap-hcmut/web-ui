# Backend CORS Configuration - URGENT FIX NEEDED

## Vấn đề

Frontend `https://smap.tantai.dev` không thể call API vì thiếu CORS headers.

## Yêu cầu

Backend cần thêm CORS configuration với:

### 1. Allowed Origin

```
https://smap.tantai.dev
```

### 2. Required Headers

```
Access-Control-Allow-Origin: https://smap.tantai.dev
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### 3. Credentials Support

**BẮT BUỘC** vì frontend dùng HttpOnly cookies:

```
AllowCredentials: true
```

## Code Examples

### Go (Gin Framework)

```go
import "github.com/gin-contrib/cors"

func main() {
    r := gin.Default()

    // CORS middleware
    r.Use(cors.New(cors.Config{
        AllowOrigins: []string{
            "https://smap.tantai.dev",      // Production
            "http://localhost:3000",         // Local dev
        },
        AllowMethods: []string{
            "GET", "POST", "PUT", "DELETE", "OPTIONS",
        },
        AllowHeaders: []string{
            "Origin", "Content-Type", "Authorization",
        },
        AllowCredentials: true,  // ⚠️ REQUIRED for HttpOnly cookies
        MaxAge: 12 * time.Hour,
    }))

    // Your routes...
}
```

### Go (Standard net/http)

```go
func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        origin := r.Header.Get("Origin")

        // Check if origin is allowed
        allowedOrigins := []string{
            "https://smap.tantai.dev",
            "http://localhost:3000",
        }

        for _, allowed := range allowedOrigins {
            if origin == allowed {
                w.Header().Set("Access-Control-Allow-Origin", origin)
                w.Header().Set("Access-Control-Allow-Credentials", "true")
                w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
                break
            }
        }

        // Handle preflight
        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }

        next.ServeHTTP(w, r)
    })
}
```

### Express.js

```javascript
const cors = require("cors");

app.use(
  cors({
    origin: ["https://smap.tantai.dev", "http://localhost:3000"],
    credentials: true, // ⚠️ REQUIRED
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

### Django

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "https://smap.tantai.dev",
    "http://localhost:3000",
]

CORS_ALLOW_CREDENTIALS = True  # ⚠️ REQUIRED

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'origin',
]
```

## Test Commands

### Test OPTIONS (Preflight)

```bash
curl -X OPTIONS https://smap-api.tantai.dev/identity/api/v1/auth/login \
  -H "Origin: https://smap.tantai.dev" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -v
```

**Expected response:**

```
< HTTP/1.1 200 OK
< Access-Control-Allow-Origin: https://smap.tantai.dev
< Access-Control-Allow-Credentials: true
< Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

### Test POST Request

```bash
curl -X POST https://smap-api.tantai.dev/identity/api/v1/auth/login \
  -H "Origin: https://smap.tantai.dev" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -v
```

**Expected response:**

```
< HTTP/1.1 200 OK (or 401/400)
< Access-Control-Allow-Origin: https://smap.tantai.dev
< Access-Control-Allow-Credentials: true
```

### Automated Test

```bash
# Run test script
./scripts/test-cors.sh https://smap-api.tantai.dev
```

## Common Mistakes

### ❌ Using Wildcard with Credentials

```go
// WRONG - Cannot use * with credentials
AllowOrigins: []string{"*"}
AllowCredentials: true
```

### ❌ Not Handling OPTIONS

```go
// WRONG - OPTIONS returns 404/405
// Need to handle OPTIONS method
```

### ❌ Missing Credentials Flag

```go
// WRONG - Frontend won't send cookies
AllowOrigins: []string{"https://smap.tantai.dev"}
// Missing: AllowCredentials: true
```

### ✅ Correct Configuration

```go
// CORRECT
AllowOrigins: []string{"https://smap.tantai.dev"}
AllowCredentials: true
AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
```

## Verification Checklist

After implementing CORS:

- [ ] Run `./scripts/test-cors.sh`
- [ ] OPTIONS request returns 200 with CORS headers
- [ ] POST request returns CORS headers
- [ ] `Access-Control-Allow-Origin: https://smap.tantai.dev`
- [ ] `Access-Control-Allow-Credentials: true`
- [ ] Test from browser console on https://smap.tantai.dev
- [ ] Login flow works without CORS errors

## Browser Test

Open browser console on `https://smap.tantai.dev`:

```javascript
fetch("https://smap-api.tantai.dev/identity/api/v1/auth/login", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    username: "test",
    password: "test",
  }),
})
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

Should NOT see CORS error.

## Priority

🔴 **HIGH PRIORITY** - Frontend cannot function without this fix.

## Contact

If you need help implementing this, please contact frontend team.

## References

- [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Gin CORS Middleware](https://github.com/gin-contrib/cors)
- See `k8s/CORS_DEBUG.md` for detailed debugging guide
