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
      this._queue = [];
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

    async discover() {
      try {
        const info = await fetch("/api/lan").then((r) => r.json());
        if (info.wsPort) this.wsPort = info.wsPort;
      } catch {
        this.wsPort = Number(location.port || 8788) + 1;
      }
    }

    connect() {
      return new Promise(async (resolve, reject) => {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
          resolve();
          return;
        }
        await this.discover();
        let settled = false;
        let ws;
        try {
          ws = new WebSocket(this.url());
        } catch (err) {
          reject(err);
          return;
        }
        this.ws = ws;
        ws.onopen = () => {
          this.connected = true;
          settled = true;
          resolve();
        };
        ws.onerror = () => {
          if (!settled) {
            settled = true;
            reject(
              new Error(
                `无法连接对战服务 ${this.url()}，请确认已启动 game/serve.py，并放行端口 ${this.wsPort || "8789"}`
              )
            );
          }
        };
        ws.onclose = () => {
          this.connected = false;
          this.emit("close", {});
        };
        ws.onmessage = (ev) => {
          let msg;
          try {
            msg = JSON.parse(ev.data);
          } catch {
            return;
          }
          const type = msg.type;
          if (type === "created" || type === "joined") {
            this.seat = msg.seat || "";
            this.room = msg.room || "";
            if (msg.wsPort) this.wsPort = msg.wsPort;
          }
          this.emit(type, msg);
          this.emit("any", msg);
        };
      });
    }

    send(obj) {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
      this.ws.send(JSON.stringify(obj));
      return true;
    }

    async create() {
      await this.connect();
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          cleanup();
          reject(new Error("开房超时，请确认 8789 端口可访问，并重启 game/serve.py"));
        }, 8000);
        const onCreated = (msg) => {
          cleanup();
          resolve(msg);
        };
        const onError = (msg) => {
          cleanup();
          reject(new Error(msg.message || "开房失败"));
        };
        const cleanup = () => {
          clearTimeout(timer);
          this.on("created", null);
          this.on("error", null);
        };
        this.on("created", onCreated);
        this.on("error", onError);
        this.send({ type: "create" });
      });
    }

    async join(room) {
      await this.connect();
      const code = String(room || "").trim().toUpperCase();
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          cleanup();
          reject(new Error("加入超时，请确认房间号与 8789 端口"));
        }, 8000);
        const onJoined = (msg) => {
          cleanup();
          resolve(msg);
        };
        const onError = (msg) => {
          cleanup();
          reject(new Error(msg.message || "加入失败"));
        };
        const cleanup = () => {
          clearTimeout(timer);
          this.on("joined", null);
          this.on("error", null);
        };
        this.on("joined", onJoined);
        this.on("error", onError);
        this.send({ type: "join", room: code });
      });
    }

    close() {
      try {
        this.ws?.close();
      } catch {
        /* ignore */
      }
      this.ws = null;
      this.connected = false;
    }
  }

  window.HeroNet = { NetRoom };
})();
