(() => {
  /** Minimal LAN WebSocket client for host/guest/guest2 rooms (2p 1v1 or 3p FFA). */
  class NetRoom {
    constructor() {
      this.ws = null;
      this.seat = "";
      this.room = "";
      this.wsPort = null;
      this.connected = false;
      this.handlers = {};
      this._generation = 0;
      this._connectPromise = null;
      this._roomPromise = null;
      this._inbox = [];
    }

    on(type, fn) {
      this.handlers[type] = fn;
      if (typeof fn !== "function" || !this._inbox?.length) return;
      const kept = [];
      this._inbox.forEach((msg) => {
        if (msg && msg.type === type) fn(msg);
        else kept.push(msg);
      });
      this._inbox = kept;
    }

    discard(types) {
      const set = new Set(Array.isArray(types) ? types : types ? [types] : []);
      if (!set.size) {
        this._inbox = [];
        return;
      }
      this._inbox = (this._inbox || []).filter((msg) => !set.has(msg?.type));
    }

    swallow(types) {
      const list = Array.isArray(types) ? types : types ? [types] : [];
      list.forEach((type) => {
        this.handlers[type] = () => {};
      });
      this.discard(list);
    }

    emit(type, data) {
      const fn = this.handlers[type];
      if (typeof fn === "function") {
        fn(data);
        return;
      }
      if (!data || type === "any" || type === "pong") return;
      this._inbox = this._inbox || [];
      if (this._inbox.length < 80) this._inbox.push(data);
    }

    url() {
      const proto = location.protocol === "https:" ? "wss:" : "ws:";
      const wsPort = this.wsPort || Number(location.port || 8788) + 1;
      const host = location.hostname || "127.0.0.1";
      return `${proto}//${host}:${wsPort}`;
    }

    async discover(signal) {
      try {
        const info = await fetch("/api/lan", { signal }).then((r) => r.json());
        if (!signal?.aborted && info.wsPort) this.wsPort = info.wsPort;
      } catch {
        // The conventional adjacent port remains usable if discovery fails.
      }
    }

    connect() {
      if (this.connected && this.ws?.readyState === WebSocket.OPEN) return Promise.resolve();
      if (this._connectPromise) return this._connectPromise;
      const generation = ++this._generation;
      const controller = new AbortController();
      const current = () => generation === this._generation;
      const pending = new Promise((resolve, reject) => {
        let settled = false;
        const finish = (error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          clearTimeout(discoveryTimer);
          controller.abort();
          if (current()) this._cancelConnect = null;
          if (error) reject(error);
          else resolve();
        };
        const timer = setTimeout(() => {
          finish(new Error(`连接超时，请确认 game/serve.py 已启动，且端口 ${this.wsPort || "8789"} 可访问`));
          if (current()) this.close();
        }, 8000);
        const discoveryTimer = setTimeout(() => controller.abort(), 2000);
        this._cancelConnect = () => finish(new Error("连接已取消"));
        this.discover(controller.signal).then(() => {
          if (!current() || settled) return;
          let ws;
          try { ws = new WebSocket(this.url()); }
          catch (error) { finish(error); return; }
          this.ws = ws;
          ws.onopen = () => {
            if (!current() || this.ws !== ws) return;
            this.connected = true;
            finish();
          };
          ws.onerror = () => {
            if (!current()) return;
            finish(new Error(`无法连接对战服务 ${this.url()}，请确认 game/serve.py 已启动`));
            this.close();
          };
          ws.onclose = () => {
            if (!current() || this.ws !== ws) return;
            finish(new Error("对战连接已断开，请重试"));
            this.ws = null;
            this.connected = false;
            this.seat = "";
            this.room = "";
            this._inbox = [];
            this.emit("close", {});
          };
          ws.onmessage = (ev) => {
            if (!current() || this.ws !== ws) return;
            let msg;
            try { msg = JSON.parse(ev.data); } catch { return; }
            if (!msg || typeof msg.type !== "string") return;
            const type = msg.type;
            if (type === "created" || type === "joined") {
              this.seat = msg.seat || "";
              this.room = msg.room || "";
              if (msg.wsPort) this.wsPort = msg.wsPort;
            }
            this.emit(type, msg);
            this.emit("any", msg);
          };
        }).catch(finish);
      });
      this._connectPromise = pending;
      const clear = () => { if (this._connectPromise === pending) this._connectPromise = null; };
      pending.then(clear, clear);
      return pending;
    }

    send(obj) {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
      try {
        this.ws.send(JSON.stringify(obj));
        return true;
      } catch { return false; }
    }

    create() {
      return this.requestRoom("create", "created");
    }

    join(room) {
      const code = String(room || "").trim().toUpperCase();
      if (!/^[A-Z0-9]{4}$/.test(code)) return Promise.reject(new Error("房间号应为 4 位字母或数字"));
      return this.requestRoom("join", "joined", code);
    }

    requestRoom(type, reply, room) {
      if (this._roomPromise) return Promise.reject(new Error("正在连接房间，请稍候"));
      const pending = this.connect().then(() => new Promise((resolve, reject) => {
        const cleanup = () => {
          clearTimeout(timer);
          this.on(reply, null);
          this.on("error", null);
          this.on("close", null);
        };
        const fail = (message) => {
          cleanup();
          this.close();
          reject(new Error(message));
        };
        const timer = setTimeout(() => fail("房间响应超时，请检查房间号和网络后重试"), 8000);
        this.on(reply, (msg) => { cleanup(); resolve(msg); });
        this.on("error", (msg) => fail(msg.message || "进入房间失败"));
        this.on("close", () => fail("对战连接已断开，请重试"));
        if (!this.send({ type, ...(room ? { room } : {}) })) fail("连接已断开，请重试");
      }));
      this._roomPromise = pending;
      const clear = () => { if (this._roomPromise === pending) this._roomPromise = null; };
      pending.then(clear, clear);
      return pending;
    }

    close() {
      this._cancelConnect?.();
      this._cancelConnect = null;
      ++this._generation;
      this._connectPromise = null;
      const ws = this.ws;
      this.ws = null;
      this.connected = false;
      this.seat = "";
      this.room = "";
      this._inbox = [];
      if (ws) {
        ws.onopen = ws.onclose = ws.onerror = ws.onmessage = null;
        try { ws.close(); } catch { /* already closed */ }
      }
      const onClose = this.handlers.close;
      this.handlers = {};
      onClose?.({});
    }

  }

  window.HeroNet = { NetRoom };
})();
