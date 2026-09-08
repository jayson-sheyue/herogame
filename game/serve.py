#!/usr/bin/env python3
"""Local playtest server. Serves game/ + assets/game, and LAN WebSocket rooms for PVP."""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import secrets
import socket
import struct
import threading
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

GAME_ROOT = Path(__file__).resolve().parent
ASSETS_GAME = GAME_ROOT.parent / "assets" / "game"
PORT = 8788
WS_PORT_OFFSET = 1  # WebSocket on http_port + 1 → 8789
WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

_rooms_lock = threading.Lock()
_rooms: dict[str, dict] = {}
_ws_port = PORT + WS_PORT_OFFSET


_lan_ips_cache: list[str] | None = None
_lan_ips_lock = threading.Lock()

# Proxy/VPN fake ranges colleagues cannot reach (e.g. Clash 198.18.x)
_SKIP_PREFIXES = ("127.", "169.254.", "198.18.", "198.19.")


def _is_usable_lan(ip: str) -> bool:
    if not ip or any(ip.startswith(p) for p in _SKIP_PREFIXES):
        return False
    parts = ip.split(".")
    if len(parts) != 4:
        return False
    try:
        a, b = int(parts[0]), int(parts[1])
    except ValueError:
        return False
    # Prefer RFC1918 private LAN
    if a == 10:
        return True
    if a == 172 and 16 <= b <= 31:
        return True
    if a == 192 and b == 168:
        return True
    # Other non-loopback unicast (office may use public-ish space)
    return a < 224


def _collect_iface_ips() -> list[str]:
    found: list[str] = []

    def add(ip: str) -> None:
        ip = (ip or "").strip()
        if _is_usable_lan(ip) and ip not in found:
            found.append(ip)

    # macOS: Wi-Fi / Ethernet first
    import subprocess

    for iface in ("en0", "en1", "en2", "eth0", "eth1"):
        try:
            out = subprocess.check_output(
                ["ipconfig", "getifaddr", iface],
                text=True,
                timeout=0.4,
                stderr=subprocess.DEVNULL,
            ).strip()
            add(out)
        except (OSError, subprocess.SubprocessError):
            pass

    try:
        out = subprocess.check_output(["ifconfig"], text=True, timeout=0.8, stderr=subprocess.DEVNULL)
        for line in out.splitlines():
            line = line.strip()
            if line.startswith("inet ") and "inet6" not in line:
                parts = line.split()
                if len(parts) >= 2:
                    add(parts[1])
    except (OSError, subprocess.SubprocessError):
        pass

    # Fallback: UDP connect (may return VPN IP — filtered above)
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.settimeout(0.2)
        sock.connect(("1.1.1.1", 80))
        add(sock.getsockname()[0])
        sock.close()
    except OSError:
        pass

    return found


def lan_ips() -> list[str]:
    global _lan_ips_cache
    with _lan_ips_lock:
        if _lan_ips_cache is not None:
            return list(_lan_ips_cache)

    found: list[str] = []

    def _probe() -> None:
        nonlocal found
        found = _collect_iface_ips()

    worker = threading.Thread(target=_probe, daemon=True)
    worker.start()
    worker.join(1.0)
    with _lan_ips_lock:
        _lan_ips_cache = list(found)
        return list(_lan_ips_cache)


def _existing_playtest(port: int) -> str | None:
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/lan", timeout=0.6) as resp:
            return "ours" if resp.status == 200 else "other"
    except urllib.error.HTTPError:
        return "other"
    except Exception:
        pass
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=0.6) as resp:
            if resp.status == 200:
                return "other"
    except Exception:
        return None
    return "other"


def _new_room_code() -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    while True:
        code = "".join(secrets.choice(alphabet) for _ in range(4))
        with _rooms_lock:
            if code not in _rooms:
                return code


class WsClient:
    def __init__(self, sock: socket.socket, seat: str, room: str, pending: bytearray | None = None):
        self.sock = sock
        self.seat = seat
        self.room = room
        self.pending = pending if pending is not None else bytearray()
        self.lock = threading.Lock()
        self.alive = True

    def send(self, obj: dict) -> None:
        raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        header = bytearray([0x81])
        n = len(raw)
        if n < 126:
            header.append(n)
        elif n < 65536:
            header.append(126)
            header.extend(struct.pack("!H", n))
        else:
            header.append(127)
            header.extend(struct.pack("!Q", n))
        try:
            with self.lock:
                self.sock.sendall(header + raw)
        except OSError as err:
            print(f"[ws] send fail {self.seat}/{self.room}: {err}", flush=True)
            self.alive = False

    def close(self) -> None:
        self.alive = False
        try:
            self.sock.close()
        except OSError:
            pass


def _take(sock: socket.socket, pending: bytearray, n: int) -> bytes:
    while len(pending) < n:
        chunk = sock.recv(max(4096, n - len(pending)))
        if not chunk:
            raise ConnectionError("closed")
        pending.extend(chunk)
    out = bytes(pending[:n])
    del pending[:n]
    return out


def _recv_text(sock: socket.socket, pending: bytearray) -> str | None:
    hdr = _take(sock, pending, 2)
    opcode = hdr[0] & 0x0F
    masked = (hdr[1] & 0x80) != 0
    length = hdr[1] & 0x7F
    if length == 126:
        length = struct.unpack("!H", _take(sock, pending, 2))[0]
    elif length == 127:
        length = struct.unpack("!Q", _take(sock, pending, 8))[0]
    mask = _take(sock, pending, 4) if masked else b""
    payload = bytearray(_take(sock, pending, length))
    if masked:
        for i in range(len(payload)):
            payload[i] ^= mask[i % 4]
    if opcode == 0x8:
        return None
    if opcode == 0x9:
        try:
            sock.sendall(bytes([0x8A, len(payload)]) + payload)
        except OSError:
            return None
        return ""
    if opcode != 0x1:
        return ""
    return payload.decode("utf-8", errors="replace")


SEATS = ("host", "guest", "guest2")
GUEST_SEATS = ("guest", "guest2")


def _room_snapshot(info: dict) -> dict:
    seats = {s: bool(info.get(s) and info[s].alive) for s in SEATS}
    return {"seats": seats, "count": sum(1 for ok in seats.values() if ok)}


def _clients_of(info: dict) -> list[WsClient]:
    out = []
    for seat in SEATS:
        client = info.get(seat)
        if client and client.alive:
            out.append(client)
    return out


def _broadcast(room: str, obj: dict, skip: WsClient | None = None) -> None:
    with _rooms_lock:
        info = _rooms.get(room) or {}
        clients = _clients_of(info)
    for peer in clients:
        if peer is skip or not peer.alive:
            continue
        peer.send(obj)


def _empty_guest_seat(info: dict) -> str | None:
    for seat in GUEST_SEATS:
        slot = info.get(seat)
        if not slot or not slot.alive:
            return seat
    return None


def _detach(client: WsClient) -> None:
    with _rooms_lock:
        info = _rooms.get(client.room)
        if not info:
            return
        if info.get(client.seat) is client:
            info[client.seat] = None
        leftover = _clients_of(info)
        snap = _room_snapshot(info)
        if not leftover:
            _rooms.pop(client.room, None)
    left = {"type": "peer", "event": "left", "seat": client.seat, **snap}
    roster = {"type": "roster", **snap}
    for peer in leftover:
        if peer.alive:
            peer.send(left)
            peer.send(roster)


def _ws_loop(client: WsClient) -> None:
    try:
        while client.alive:
            text = _recv_text(client.sock, client.pending)
            if text is None:
                break
            if text == "":
                continue
            try:
                msg = json.loads(text)
            except json.JSONDecodeError:
                continue
            if not isinstance(msg, dict):
                continue
            if msg.get("type") == "ping":
                client.send({"type": "pong"})
                continue
            out = dict(msg)
            out["_from"] = client.seat
            _broadcast(client.room, out, skip=client)
    except (ConnectionError, OSError, struct.error):
        pass
    finally:
        _detach(client)
        client.close()


def _handshake(sock: socket.socket) -> bytearray:
    data = b""
    while b"\r\n\r\n" not in data:
        chunk = sock.recv(4096)
        if not chunk:
            raise ConnectionError("closed during headers")
        data += chunk
        if len(data) > 65536:
            raise ConnectionError("headers too large")
    head, _, rest = data.partition(b"\r\n\r\n")
    key = ""
    for line in head.decode("iso-8859-1", errors="replace").split("\r\n")[1:]:
        if line.lower().startswith("sec-websocket-key:"):
            key = line.split(":", 1)[1].strip()
            break
    if not key:
        sock.sendall(b"HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n")
        raise ConnectionError("missing Sec-WebSocket-Key")
    accept = base64.b64encode(hashlib.sha1((key + WS_GUID).encode()).digest()).decode()
    sock.sendall(
        (
            "HTTP/1.1 101 Switching Protocols\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Accept: {accept}\r\n"
            "\r\n"
        ).encode()
    )
    return bytearray(rest)


def _handle_ws_client(sock: socket.socket, addr) -> None:
    sock.settimeout(120)
    try:
        sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
    except OSError:
        pass
    try:
        pending = _handshake(sock)
        print(f"[ws] handshake ok {addr[0]} leftover={len(pending)}", flush=True)
        text = _recv_text(sock, pending)
        print(f"[ws] first msg {text!r}", flush=True)
        if not text:
            sock.close()
            return
        msg = json.loads(text)
    except (ConnectionError, OSError, json.JSONDecodeError, struct.error) as err:
        print(f"[ws] fail {addr[0]}: {err}", flush=True)
        try:
            sock.close()
        except OSError:
            pass
        return

    kind = msg.get("type") if isinstance(msg, dict) else None
    if kind == "create":
        code = _new_room_code()
        client = WsClient(sock, "host", code, pending)
        with _rooms_lock:
            _rooms[code] = {"host": client, "guest": None, "guest2": None}
            snap = _room_snapshot(_rooms[code])
        payload = {
            "type": "created",
            "room": code,
            "seat": "host",
            "ips": lan_ips(),
            "port": _ws_port - WS_PORT_OFFSET,
            "wsPort": _ws_port,
            **snap,
        }
        client.send(payload)
        print(f"[ws] sent created room={code} alive={client.alive}", flush=True)
    elif kind == "join":
        code = str(msg.get("room") or "").strip().upper()
        with _rooms_lock:
            info = _rooms.get(code)
            if not info or not info.get("host"):
                err = WsClient(sock, "guest", code or "?", pending)
                err.send({"type": "error", "message": "房间不存在或已关闭"})
                err.close()
                return
            seat = _empty_guest_seat(info)
            if not seat:
                err = WsClient(sock, "guest", code, pending)
                err.send({"type": "error", "message": "房间已满（最多 3 人）"})
                err.close()
                return
            client = WsClient(sock, seat, code, pending)
            info[seat] = client
            snap = _room_snapshot(info)
            others = [c for c in _clients_of(info) if c is not client]
        client.send({"type": "joined", "room": code, "seat": seat, "wsPort": _ws_port, **snap})
        joined = {"type": "peer", "event": "joined", "seat": seat, **snap}
        roster = {"type": "roster", **snap}
        for peer in others:
            if peer.alive:
                peer.send(joined)
                peer.send(roster)
        print(f"[ws] {seat} joined room={code} count={snap['count']}", flush=True)
    else:
        print(f"[ws] bad first msg {msg!r}", flush=True)
        sock.close()
        return

    print(f"[ws] {client.seat} room={client.room} from {addr[0]}", flush=True)
    _ws_loop(client)


def _ws_server(host: str, port: int) -> None:
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind((host, port))
    srv.listen(16)
    print(f"PVP WebSocket ws://127.0.0.1:{port}", flush=True)
    while True:
        try:
            conn, addr = srv.accept()
        except OSError:
            break
        threading.Thread(target=_handle_ws_client, args=(conn, addr), daemon=True).start()


class Handler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def translate_path(self, path: str) -> str:
        parsed = unquote(urlparse(path).path)
        if parsed.startswith("/assets/game/"):
            rel = Path(parsed[len("/assets/game/") :])
            target = (ASSETS_GAME / rel).resolve()
            try:
                target.relative_to(ASSETS_GAME.resolve())
            except ValueError:
                return str(ASSETS_GAME / "_forbidden")
            return str(target)
        rel = Path(parsed.lstrip("/"))
        if not parsed or parsed == "/":
            return str(GAME_ROOT / "index.html")
        target = (GAME_ROOT / rel).resolve()
        try:
            target.relative_to(GAME_ROOT)
        except ValueError:
            return str(GAME_ROOT / "index.html")
        return str(target)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/lan":
            body = json.dumps(
                {"ips": lan_ips(), "port": self.server.server_address[1], "wsPort": _ws_port},
                ensure_ascii=False,
            ).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def log_message(self, fmt: str, *args) -> None:
        print("[%s] %s" % (self.log_date_time_string(), fmt % args), flush=True)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()


def main() -> None:
    global _ws_port, ASSETS_GAME
    parser = argparse.ArgumentParser(description="HeroGame playtest server")
    parser.add_argument("--port", type=int, default=PORT)
    parser.add_argument("--host", default="0.0.0.0", help="Bind address (0.0.0.0 for LAN)")
    parser.add_argument(
        "--assets",
        type=Path,
        default=ASSETS_GAME,
        help="Runtime assets folder (default: ../assets/game)",
    )
    parser.add_argument(
        "--import",
        dest="import_zips",
        action="append",
        default=[],
        metavar="ZIP",
        help="Import a herogame-pack zip (repeatable), then start",
    )
    parser.add_argument(
        "--import-only",
        action="store_true",
        help="Import packs and exit (do not start the server)",
    )
    parser.add_argument(
        "--no-incoming",
        action="store_true",
        help="Do not auto-import game/incoming/*.zip on startup",
    )
    args = parser.parse_args()
    ASSETS_GAME = args.assets.expanduser().resolve()
    ASSETS_GAME.mkdir(parents=True, exist_ok=True)

    from import_pack import import_incoming, import_pack

    for zip_path in args.import_zips:
        info = import_pack(Path(zip_path), ASSETS_GAME)
        print(
            f"已导入 {Path(zip_path).name} · {info['files']} 文件 · "
            f"英雄 {len(info['heroes'])} · 地图 {len(info['stages'])}",
            flush=True,
        )
    if not args.no_incoming:
        incoming = GAME_ROOT / "incoming"
        for info in import_incoming(incoming, ASSETS_GAME):
            if info.get("ok"):
                print(
                    f"incoming 已导入 {Path(info['file']).name} · "
                    f"英雄 {len(info.get('heroes') or [])} · 地图 {len(info.get('stages') or [])}",
                    flush=True,
                )
            else:
                print(f"incoming 跳过 {info.get('file')}: {info.get('error')}", flush=True)

    if args.import_only:
        return

    _ws_port = args.port + WS_PORT_OFFSET
    if not ASSETS_GAME.is_dir():
        raise SystemExit(f"找不到运行时资源：{ASSETS_GAME}")
    existing = _existing_playtest(args.port)
    if existing == "ours":
        raise SystemExit(
            f"本试玩服已在跑：http://127.0.0.1:{args.port}\n"
            f"若要重启：先结束旧进程  lsof -iTCP:{args.port} -sTCP:LISTEN"
        )
    if existing == "other":
        raise SystemExit(
            f"端口 {args.port} 已被其它程序占用。\n"
            f"请先关掉：  lsof -iTCP:{args.port} -sTCP:LISTEN"
        )
    try:
        httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    except OSError as err:
        raise SystemExit(f"无法监听 {args.host}:{args.port} — {err}") from err

    threading.Thread(target=_ws_server, args=(args.host, _ws_port), daemon=True).start()
    # Warm LAN IP cache off the request path
    threading.Thread(target=lan_ips, daemon=True).start()

    ips = lan_ips()
    print(f"试玩本机 http://127.0.0.1:{args.port}", flush=True)
    if ips:
        for ip in ips:
            print(f"同事访问 http://{ip}:{args.port}  （木桩 / PVE / PVP 均可）", flush=True)
    else:
        print("未检测到局域网 IP，请用 ifconfig / 系统设置查看 Wi-Fi 地址。", flush=True)
    print(f"只读资源 {ASSETS_GAME}", flush=True)
    print("PVP：同一地址打开 → 切「局域网 PVP」→ 创建房间，把 4 位房号发给同事加入。", flush=True)
    print(f"防火墙需放行 TCP {args.port}（网页）和 {_ws_port}（对战）。", flush=True)
    print("新英雄/地图：把工坊导出的 .hgpk.zip 放到 game/incoming/ 或 --import 导入，不必开工坊。", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n已停。", flush=True)


if __name__ == "__main__":
    main()
