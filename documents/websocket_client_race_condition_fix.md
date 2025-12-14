# WebSocket Client Race Condition Fix

## Vấn Đề

Khi client switch giữa các job connections, có race condition xảy ra:

```
[WebSocket] Disconnecting from job: null
[WebSocket] URL changed to job: 9f4379e4-4dbc-45b0-9db8-4628d127d523
Connecting to job WebSocket: 9f4379e4-4dbc-45b0-9db8-4628d127d523
❌ WebSocket connection failed: WebSocket is closed before the connection is established.
```

**Nguyên nhân**: Client đang disconnect connection cũ TRƯỚC KHI connection mới được establish, khiến connection mới bị đóng ngay lập tức.

## Giải Pháp

### Pattern 1: Đợi Connection Mới OPEN Trước Khi Disconnect Cũ

```javascript
class JobWebSocketManager {
  constructor() {
    this.currentWs = null;
    this.currentJobId = null;
    this.pendingWs = null;
  }

  async switchToJob(jobId) {
    // Nếu đang có connection cho job này, không cần switch
    if (this.currentJobId === jobId && this.currentWs?.readyState === WebSocket.OPEN) {
      return;
    }

    // Tạo connection mới TRƯỚC
    const newWs = new WebSocket(`wss://smap-api.tantai.dev/ws?jobId=${jobId}`);
    
    // Đợi connection mới OPEN
    await new Promise((resolve, reject) => {
      newWs.onopen = () => {
        console.log(`[WebSocket] Connected to job: ${jobId}`);
        resolve();
      };
      
      newWs.onerror = (error) => {
        console.error(`[WebSocket] Error connecting to job ${jobId}:`, error);
        reject(error);
      };
      
      // Timeout sau 10 giây
      setTimeout(() => {
        if (newWs.readyState !== WebSocket.OPEN) {
          newWs.close();
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });

    // CHỈ KHI connection mới đã OPEN, mới disconnect connection cũ
    if (this.currentWs) {
      console.log(`[WebSocket] Disconnecting from job: ${this.currentJobId}`);
      this.currentWs.close(1000, 'Switching to new job');
    }

    // Update references
    this.currentWs = newWs;
    this.currentJobId = jobId;
    
    // Setup event handlers
    this.setupEventHandlers(newWs, jobId);
  }

  setupEventHandlers(ws, jobId) {
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message, jobId);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error(`[WebSocket] Error for job: ${jobId}`, error);
    };

    ws.onclose = (event) => {
      console.log(`[WebSocket] Disconnected from job: ${jobId}`, {
        code: event.code,
        reason: event.reason
      });
      
      // Chỉ reconnect nếu đây là connection hiện tại
      if (this.currentJobId === jobId) {
        this.handleReconnect(jobId);
      }
    };
  }

  handleMessage(message, jobId) {
    // Handle message logic here
    console.log(`[WebSocket] Message for job ${jobId}:`, message);
  }

  handleReconnect(jobId) {
    // Reconnect logic here
    setTimeout(() => {
      if (this.currentJobId === jobId) {
        this.switchToJob(jobId);
      }
    }, 1000);
  }
}
```

### Pattern 2: Sử Dụng Promise Với Cleanup

```javascript
class SafeWebSocketSwitcher {
  constructor() {
    this.activeConnection = null;
    this.activeJobId = null;
  }

  async switchToJob(jobId) {
    // Nếu đang có connection cho job này, không cần switch
    if (this.activeJobId === jobId && this.activeConnection?.readyState === WebSocket.OPEN) {
      return;
    }

    // Lưu reference connection cũ
    const oldConnection = this.activeConnection;
    const oldJobId = this.activeJobId;

    try {
      // Tạo và đợi connection mới
      const newConnection = await this.createConnection(jobId);
      
      // CHỈ KHI connection mới thành công, mới close connection cũ
      if (oldConnection && oldConnection.readyState !== WebSocket.CLOSED) {
        console.log(`[WebSocket] Disconnecting from job: ${oldJobId}`);
        oldConnection.close(1000, 'Switching to new job');
      }

      // Update active connection
      this.activeConnection = newConnection;
      this.activeJobId = jobId;
      
    } catch (error) {
      console.error(`[WebSocket] Failed to switch to job ${jobId}:`, error);
      // Nếu connection mới fail, giữ nguyên connection cũ
      throw error;
    }
  }

  createConnection(jobId) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`wss://smap-api.tantai.dev/ws?jobId=${jobId}`);
      
      const timeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          reject(new Error('Connection timeout'));
        }
      }, 10000);

      ws.onopen = () => {
        clearTimeout(timeout);
        console.log(`[WebSocket] Connected to job: ${jobId}`);
        resolve(ws);
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error(`[WebSocket] Error connecting to job ${jobId}:`, error);
        reject(error);
      };
    });
  }
}
```

### Pattern 3: Sử Dụng State Machine (Recommended)

```javascript
class WebSocketStateMachine {
  constructor() {
    this.state = 'idle'; // idle, connecting, connected, disconnecting
    this.currentWs = null;
    this.currentJobId = null;
    this.pendingJobId = null;
  }

  async switchToJob(jobId) {
    // Nếu đang có connection cho job này, không cần switch
    if (this.currentJobId === jobId && this.state === 'connected') {
      return;
    }

    // Nếu đang connecting, đợi xong
    if (this.state === 'connecting') {
      await this.waitForStateChange();
    }

    // Nếu đang connected, disconnect trước
    if (this.state === 'connected') {
      await this.disconnect();
    }

    // Bây giờ mới connect
    await this.connect(jobId);
  }

  async connect(jobId) {
    if (this.state !== 'idle') {
      throw new Error('Cannot connect: not in idle state');
    }

    this.state = 'connecting';
    this.pendingJobId = jobId;

    try {
      const ws = new WebSocket(`wss://smap-api.tantai.dev/ws?jobId=${jobId}`);
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Connection timeout'));
        }, 10000);

        ws.onopen = () => {
          clearTimeout(timeout);
          this.state = 'connected';
          this.currentWs = ws;
          this.currentJobId = jobId;
          this.pendingJobId = null;
          this.setupHandlers(ws, jobId);
          console.log(`[WebSocket] Connected to job: ${jobId}`);
          resolve();
        };

        ws.onerror = (error) => {
          clearTimeout(timeout);
          this.state = 'idle';
          this.pendingJobId = null;
          reject(error);
        };
      });
    } catch (error) {
      this.state = 'idle';
      this.pendingJobId = null;
      throw error;
    }
  }

  async disconnect() {
    if (this.state !== 'connected') {
      return;
    }

    this.state = 'disconnecting';
    const oldJobId = this.currentJobId;

    if (this.currentWs) {
      this.currentWs.close(1000, 'Switching job');
      await this.waitForClose(this.currentWs);
    }

    this.currentWs = null;
    this.currentJobId = null;
    this.state = 'idle';
    console.log(`[WebSocket] Disconnected from job: ${oldJobId}`);
  }

  waitForClose(ws) {
    return new Promise((resolve) => {
      if (ws.readyState === WebSocket.CLOSED) {
        resolve();
        return;
      }
      ws.onclose = () => resolve();
    });
  }

  waitForStateChange() {
    return new Promise((resolve) => {
      const checkState = () => {
        if (this.state !== 'connecting') {
          resolve();
        } else {
          setTimeout(checkState, 100);
        }
      };
      checkState();
    });
  }

  setupHandlers(ws, jobId) {
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message, jobId);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error(`[WebSocket] Error for job: ${jobId}`, error);
    };

    ws.onclose = (event) => {
      console.log(`[WebSocket] Disconnected from job: ${jobId}`, {
        code: event.code,
        reason: event.reason
      });
      
      if (this.currentJobId === jobId) {
        this.state = 'idle';
        this.currentWs = null;
        this.currentJobId = null;
      }
    };
  }

  handleMessage(message, jobId) {
    // Handle message logic
    console.log(`[WebSocket] Message for job ${jobId}:`, message);
  }
}
```

## Best Practices

1. **Luôn đợi connection mới OPEN trước khi disconnect connection cũ**
2. **Sử dụng state machine để quản lý connection state**
3. **Handle timeout cho connection (10 giây)**
4. **Log rõ ràng các state transitions**
5. **Handle errors gracefully và retry nếu cần**

## Testing

Test các scenarios sau:

1. ✅ Switch từ job A sang job B (normal case)
2. ✅ Switch khi connection đang connecting
3. ✅ Switch khi connection đang disconnecting
4. ✅ Switch khi connection mới fail
5. ✅ Switch về cùng job (should not reconnect)
6. ✅ Multiple rapid switches

## Kết Luận

Vấn đề là **race condition ở client side**, không phải server. Client cần implement logic để đảm bảo connection mới được establish TRƯỚC KHI disconnect connection cũ.

---

## ✅ Implementation Status

**Date**: December 14, 2025  
**Status**: **COMPLETED** ✅

Các giải pháp đã được implement đầy đủ theo Pattern 1 + các optimization bổ sung:

1. ✅ **Connection timeout** (10 giây)
2. ✅ **Wait for new connection before disconnect old**
3. ✅ **Rapid switching protection**
4. ✅ **Event listener cleanup**
5. ✅ **Enhanced error logging**

**Chi tiết implementation**: Xem `documents/WEBSOCKET_OPTIMIZATION_IMPLEMENTATION.md`

**Files modified**:
- `services/websocketService.ts` - Added timeout logic
- `hooks/useJobWebSocket.ts` - Added rapid switching protection & cleanup

**Testing**: All scenarios tested and passing ✅

