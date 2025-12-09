# CORS Debug Guide - SMAP Web

## Vấn đề

Frontend call API bị CORS error mặc dù:

- ✅ Axios đã set `withCredentials: true`
- ✅ Backend dùng HttpOnly cookies
- ❌ Backend CORS middleware không trả về `Access-Control-Allow-Origin`

## Nguyên nhân

Khi dùng **HttpOnly cookies** và **withCredentials: true**, backend CORS **BẮT BUỘC** phải:

1. Set `Access-Control-Allow-Origin` với **EXACT origin** (không được dùng `*`)
2. Set `Access-Control-Allow-Credentials: true`
3. Nhận và xử lý `Origin` header từ browser

## Frontend Configuration (Đã đúng)

```typescript
// lib/api/config.ts
const apiClient = axios.create({
  baseURL: hostname,
  withCredentials: true, // ✅ Gửi cookies
  headers: {
    "Content-Type": "application/json",
  },
});
```

## Backend CORS Requirements

### 1. Allowed Origins

Backend phải cho phép frontend origin:

```go
// Backend Go code (example)
allowedOrigins := []string{
    "https://smap.tantai.dev",      // Production
    "http://localhost:3000",         // Local dev
}
```

### 2. CORS Headers Required

Backend **BẮT BUỘC** trả về:

```
Access-Control-Allow-Origin: https://smap.tantai.dev
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### 3. Preflight (OPTIONS) Request

Browser sẽ gửi OPTIONS request trước mỗi API call:

```
OPTIONS /api/endpoint HTTP/1.1
Origin: https://smap.tantai.dev
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type
```

Backend phải trả về 200 OK với CORS headers.

## Debug Steps

### 1. Check browser request

Mở DevTools → Network → Chọn API request:

**Request Headers:**

```
Origin: https://smap.tantai.dev
```

**Response Headers (cần có):**

```
Access-Control-Allow-Origin: https://smap.tantai.dev
Access-Control-Allow-Credentials: true
```

### 2. Test với curl

```bash
# Test OPTIONS (preflight)
curl -X OPTIONS https://smap-api.tantai.dev/api/endpoint \
  -H "Origin: https://smap.tantai.dev" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -v

# Test actual request
curl -X POST https://smap-api.tantai.dev/api/endpoint \
  -H "Origin: https://smap.tantai.dev" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' \
  -v
```

**Expected response headers:**

```
< Access-Control-Allow-Origin: https://smap.tantai.dev
< Access-Control-Allow-Credentials: true
```

### 3. Check từ pod

```bash
# Exec vào frontend pod
kubectl exec -it <pod-name> -n smap -- sh

# Test API với Origin header
wget --header="Origin: https://smap.tantai.dev" \
     --header="Content-Type: application/json" \
     -O- https://smap-api.tantai.dev/api/endpoint
```

## Backend Fix (Cần làm ở backend)

### Go Gin Example

```go
import "github.com/gin-contrib/cors"

func main() {
    r := gin.Default()

    // CORS middleware
    r.Use(cors.New(cors.Config{
        AllowOrigins: []string{
            "https://smap.tantai.dev",
            "http://localhost:3000",
        },
        AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
        AllowCredentials: true,  // ⚠️ BẮT BUỘC cho HttpOnly cookies
        MaxAge: 12 * time.Hour,
    }))

    // Routes...
}
```

### Express.js Example

```javascript
const cors = require("cors");

app.use(
  cors({
    origin: ["https://smap.tantai.dev", "http://localhost:3000"],
    credentials: true, // ⚠️ BẮT BUỘC
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

### Django Example

```python
CORS_ALLOWED_ORIGINS = [
    "https://smap.tantai.dev",
    "http://localhost:3000",
]

CORS_ALLOW_CREDENTIALS = True  # ⚠️ BẮT BUỘC
```

## Common Issues

### Issue 1: Origin không được phép

**Error:**

```
Access to fetch at 'https://api.example.com' from origin 'https://smap.tantai.dev'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Fix:** Thêm `https://smap.tantai.dev` vào backend allowed origins

### Issue 2: Credentials không được phép

**Error:**

```
Access to fetch has been blocked by CORS policy: The value of the
'Access-Control-Allow-Credentials' header in the response is '' which must be 'true'
```

**Fix:** Backend set `Access-Control-Allow-Credentials: true`

### Issue 3: Wildcard với credentials

**Error:**

```
Access to fetch has been blocked by CORS policy: The value of the
'Access-Control-Allow-Origin' header must not be the wildcard '*' when credentials flag is true
```

**Fix:** Không dùng `*`, phải dùng exact origin:

```go
// ❌ SAI
AllowOrigins: []string{"*"}

// ✅ ĐÚNG
AllowOrigins: []string{"https://smap.tantai.dev"}
```

### Issue 4: OPTIONS request fail

**Error:** Preflight OPTIONS request trả về 404 hoặc 405

**Fix:** Backend phải handle OPTIONS method:

```go
// Gin tự động handle nếu dùng cors middleware
r.Use(cors.New(config))

// Hoặc manual
r.OPTIONS("/*path", func(c *gin.Context) {
    c.Status(200)
})
```

## Verify CORS Configuration

### 1. Browser Console Test

```javascript
// Mở browser console trên https://smap.tantai.dev
fetch("https://smap-api.tantai.dev/api/endpoint", {
  method: "POST",
  credentials: "include", // Gửi cookies
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ test: "data" }),
})
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

### 2. Check Response Headers

```javascript
// Trong browser console
fetch("https://smap-api.tantai.dev/api/endpoint", {
  credentials: "include",
}).then((response) => {
  console.log("CORS Headers:");
  console.log(
    "Allow-Origin:",
    response.headers.get("Access-Control-Allow-Origin")
  );
  console.log(
    "Allow-Credentials:",
    response.headers.get("Access-Control-Allow-Credentials")
  );
});
```

## NGINX Configuration (External)

External NGINX cũng cần pass CORS headers:

```nginx
# k8s/nginx.conf
location / {
    proxy_pass http://k8s_nodes;

    # Pass CORS headers from backend
    proxy_pass_header Access-Control-Allow-Origin;
    proxy_pass_header Access-Control-Allow-Credentials;

    # Don't override backend CORS headers
    # proxy_hide_header Access-Control-Allow-Origin;  # ❌ Không làm
}
```

## Checklist

Backend team cần verify:

- [ ] CORS middleware đã cài đặt
- [ ] `https://smap.tantai.dev` trong allowed origins
- [ ] `AllowCredentials: true` đã set
- [ ] OPTIONS method được handle
- [ ] Response có `Access-Control-Allow-Origin` header
- [ ] Response có `Access-Control-Allow-Credentials: true` header
- [ ] Test với curl có Origin header
- [ ] Test từ browser console

## Contact Backend Team

Gửi thông tin này cho backend team:

```
Frontend Origin: https://smap.tantai.dev
Required CORS Headers:
  - Access-Control-Allow-Origin: https://smap.tantai.dev
  - Access-Control-Allow-Credentials: true
  - Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  - Access-Control-Allow-Headers: Content-Type, Authorization

Test command:
curl -X OPTIONS https://smap-api.tantai.dev/api/endpoint \
  -H "Origin: https://smap.tantai.dev" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

## Summary

Frontend đã đúng với `withCredentials: true`. Vấn đề nằm ở **backend CORS configuration**:

1. ✅ Frontend: `withCredentials: true`
2. ❌ Backend: Cần thêm `https://smap.tantai.dev` vào allowed origins
3. ❌ Backend: Cần set `AllowCredentials: true`
4. ❌ Backend: Cần trả về `Access-Control-Allow-Origin` header

**Action:** Liên hệ backend team để fix CORS configuration.
