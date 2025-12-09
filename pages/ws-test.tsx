import { useEffect, useState, useRef } from 'react';
import { authService } from '@/lib/api/services/auth.service';

interface WSMessage<T = any> {
  type: string;
  payload: T;
  timestamp: string;
}

interface ProgressPayload {
  project_id: string;
  status: 'INITIALIZING' | 'CRAWLING' | 'PROCESSING' | 'DONE' | 'FAILED';
  total: number;
  done: number;
  errors: number;
  progress_percent?: number;
}

interface DryRunPayload {
  job_id: string;
  status: 'success' | 'failed';
  platform: string;
  content?: any[];
  errors?: any[];
}

const WS_URL = 'wss://smap-api.tantai.dev/ws';

export default function WebSocketTest() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [token, setToken] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  
  // Login form states
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const payload = {
        email,
        password,
        device_name: 'WebSocket Test Page',
        ip_address: '0.0.0.0',
        user_agent: navigator.userAgent,
        remember: true,
      };

      console.log('🔐 Đang đăng nhập...');
      const response = await authService.login(payload);
      console.log('📦 Login response:', response);

      // Check if user needs OTP verification (error_code 20009)
      if (response.error_code === 20009) {
        setLoginError('Tài khoản cần xác thực OTP. Vui lòng xác thực tài khoản trước.');
        setIsLoggingIn(false);
        return;
      }

      // Try to get token from multiple sources
      let accessToken = null;
      
      // 1. Try from response.token
      if (response.token) {
        accessToken = response.token;
        console.log('🔑 Token từ response.token');
      }
      // 2. Try from response.data.token
      else if (response.data?.token) {
        accessToken = response.data.token;
        console.log('🔑 Token từ response.data.token');
      }
      // 3. Try from cookie (fallback)
      else {
        setTimeout(() => {
          const cookieToken = getCookie('access_token');
          if (cookieToken) {
            accessToken = cookieToken;
            console.log('🔑 Token từ cookie');
            setToken(cookieToken);
            setIsLoggedIn(true);
            setShowLoginForm(false);
            connectWithToken(cookieToken);
          } else {
            setLoginError('Không tìm thấy token. Server có thể chưa trả về token.');
            console.error('❌ Không tìm thấy token trong response hoặc cookie');
            console.error('Response structure:', JSON.stringify(response, null, 2));
          }
        }, 500);
        setIsLoggingIn(false);
        return;
      }

      if (accessToken) {
        console.log('✅ Đã lấy token thành công');
        setToken(accessToken);
        setIsLoggedIn(true);
        setShowLoginForm(false);
        setLoginError('');
        
        // Tự động kết nối với token
        setTimeout(() => {
          connectWithToken(accessToken);
        }, 300);
      }

    } catch (err: any) {
      console.error('❌ Login error:', err);
      setLoginError(err?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const connectWithToken = (tokenToUse: string) => {
    try {
      setConnectionStatus('Connecting...');
      
      // Kết nối với token qua query parameter
      const wsUrl = `${WS_URL}?token=${tokenToUse}`;
      console.log('🔗 Đang kết nối tới:', wsUrl.replace(tokenToUse, '***TOKEN***'));
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Đã kết nối WebSocket thành công!');
        setConnected(true);
        setConnectionStatus('Connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          console.log('📨 Nhận tin nhắn:', msg);
          
          setMessages(prev => [msg, ...prev].slice(0, 50));
          handleMessage(msg);
        } catch (err) {
          console.error('❌ Lỗi parse tin nhắn:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('Error');
      };

      ws.onclose = (event) => {
        console.log('🔌 Đã ngắt kết nối WebSocket');
        console.log('   - Code:', event.code);
        console.log('   - Reason:', event.reason || 'Không có lý do');
        console.log('   - Clean:', event.wasClean);
        
        setConnected(false);
        setConnectionStatus(`Disconnected (${event.code})`);
        
        if (event.code === 1006) {
          setConnectionStatus('Error: Token không hợp lệ hoặc CORS issue (1006)');
          console.error('⚠️ Lỗi 1006 - Có thể do:');
          console.error('   1. Token không hợp lệ hoặc hết hạn');
          console.error('   2. CORS: Origin không được whitelist');
          console.error('   3. Server từ chối kết nối');
        } else if (event.code === 1008) {
          setConnectionStatus('Error: Policy violation (1008)');
        } else if (event.code === 4001) {
          setConnectionStatus('Error: Unauthorized (4001)');
        }
      };

    } catch (err) {
      console.error('❌ Lỗi kết nối:', err);
      setConnectionStatus('Error');
    }
  };

  const connect = () => {
    if (!token) {
      alert('Vui lòng đăng nhập hoặc nhập token!');
      return;
    }

    connectWithToken(token);
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const handleMessage = (msg: WSMessage) => {
    switch (msg.type) {
      case 'project_progress':
        const progress = msg.payload as ProgressPayload;
        console.log(`📊 Tiến độ dự án ${progress.project_id}: ${progress.progress_percent}%`);
        break;
        
      case 'project_completed':
        const completed = msg.payload as ProgressPayload;
        console.log(`✅ Dự án hoàn thành: ${completed.project_id}`);
        break;
        
      case 'dryrun_result':
        const dryrun = msg.payload as DryRunPayload;
        console.log(`🧪 Kết quả Dry Run (${dryrun.platform}):`, dryrun);
        break;
        
      default:
        console.warn('⚠️ Loại tin nhắn không xác định:', msg.type);
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const getStatusColor = () => {
    if (connected) return 'text-green-500';
    if (connectionStatus.includes('Error')) return 'text-red-500';
    if (connectionStatus.includes('Connecting')) return 'text-yellow-500';
    return 'text-gray-500';
  };

  const formatPayload = (payload: any) => {
    return JSON.stringify(payload, null, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">WebSocket Test Page</h1>
        
        {/* Login Panel */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Xác thực</h2>
          
          {!isLoggedIn ? (
            <>
              {!showLoginForm ? (
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowLoginForm(true)}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Đăng nhập để lấy Token
                  </button>
                  <span className="text-gray-500 self-center">hoặc nhập token thủ công bên dưới</span>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                      disabled={isLoggingIn}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                      disabled={isLoggingIn}
                    />
                  </div>

                  {loginError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {loginError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isLoggingIn ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLoginForm(false);
                        setLoginError('');
                      }}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-sm font-medium text-green-700">Đã đăng nhập</span>
              </div>
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  setEmail('');
                  setPassword('');
                  disconnect();
                }}
                className="px-4 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>

        {/* Connection Panel */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Kết nối WebSocket</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Access Token (JWT) {isLoggedIn && '(Tự động lấy từ cookie)'}
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={isLoggedIn ? "Token đã được lấy từ cookie..." : "Nhập JWT token thủ công..."}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              disabled={connected || isLoggedIn}
            />
            <p className="text-xs text-gray-500 mt-1">
              Endpoint: {WS_URL}
            </p>
            {token && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Token có sẵn ({token.substring(0, 20)}...)
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={connect}
              disabled={connected || !token}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Kết nối
            </button>
            
            <button
              onClick={disconnect}
              disabled={!connected}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Ngắt kết nối
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Trạng thái:</span>
              <span className={`text-sm font-semibold ${getStatusColor()}`}>
                {connectionStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Messages Panel */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Tin nhắn ({messages.length})
            </h2>
            <button
              onClick={() => setMessages([])}
              className="px-4 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              Xóa tất cả
            </button>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Chưa có tin nhắn nào. Kết nối để nhận tin nhắn từ server.
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                        {msg.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <pre className="text-xs overflow-x-auto">
                      {formatPayload(msg.payload)}
                    </pre>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📝 Hướng dẫn:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. <strong>Đăng nhập</strong> để lấy JWT token tự động (khuyến nghị) hoặc nhập token thủ công</li>
            <li>2. Click <strong>"Kết nối"</strong> để thiết lập WebSocket connection</li>
            <li>3. Các tin nhắn từ server sẽ hiển thị tự động bên dưới</li>
            <li>4. Hỗ trợ các loại tin nhắn: <code>project_progress</code>, <code>project_completed</code>, <code>dryrun_result</code></li>
            <li>5. Ping/Pong được xử lý tự động bởi trình duyệt</li>
            <li>6. Cookie <code>access_token</code> được sử dụng để xác thực khi đăng nhập</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
