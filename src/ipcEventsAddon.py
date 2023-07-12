"""
This is an addon for mitmproxy that sends events as nodejs-compatible IPC messages to a pipe.

The file descriptor of the pipe to send the messages to needs to be configured as a mitmproxy option: ipcPipeFd
If the option is not set, the addon will do nothing.

To use the addon, start mitmproxy like this:

mitmproxy -s ipcEventsAddon.py --set ipcPipeFd=42
"""

import os
import json
from mitmproxy import ctx
from mitmproxy.utils import human
from mitmproxy.tls import TlsData
from mitmproxy.connection import Connection, Client, Server
from mitmproxy.certs import Cert
from mitmproxy.addons.proxyserver import Proxyserver
from mitmproxy.proxy.mode_servers import WireGuardServerInstance

class IpcEventRelay:
    def load(self, loader):
        loader.add_option(
            name="ipcPipeFd",
            typespec=int,
            default=False,
            help="The file descriptor to write the IPC messages to",
        )

        # This uses an internal API found in mitmproxy/tools/web/master.py
        # See https://github.com/mitmproxy/mitmproxy/blob/8f1329377147538afdf06344179c2fd90795e93a/mitmproxy/tools/web/master.py#L55
        self.proxyserver = ctx.master.addons.get("proxyserver")
        self.proxyserver.servers.changed.connect(self.server_changed)

    def _sendIpcMessage(self, message):
        """Takes a dict and sends it through a pipe as JSON."""
        if(ctx.options.ipcPipeFd is not None):
            os.write(ctx.options.ipcPipeFd, bytes("cyanoacrylate:" + json.dumps(message) + '\n', 'utf8'))

    def running(self):
        self._sendIpcMessage({"status": "running"})

    def done(self):
        self._sendIpcMessage({"status": "done"})

    def client_connected(self, client):
        self._sendIpcMessage({"status": "clientConnected", "context": {"address": human.format_address(client.peername), "client": clientToDict(client)}})

    def client_disconnected(self, client):
        self._sendIpcMessage({"status": "clientDisconnected", "context": {"address": human.format_address(client.peername), "client": clientToDict(client)}})

    def tls_failed_client(self, data):
        self._sendIpcMessage({"status": "tlsFailed", "context": {"error": data.conn.error, **tlsDataToDict(data)}})

    def tls_established_client(self, data):
        self._sendIpcMessage({"status": "tlsEstablished", "context": tlsDataToDict(data)})

    def server_changed(self):
        self._sendIpcMessage({"status": "proxyChanged", "context": proxyserverToDict(self.proxyserver)})

# See: https://docs.mitmproxy.org/stable/api/mitmproxy/certs.html#Cert
def certToDict(cert: Cert | None):
    if cert is None:
        return None
    return {
        "cn": cert.cn,
        "altnames": cert.altnames,
        "serial": cert.serial,
        "notbefore": cert.notbefore.timestamp(),
        "notafter": cert.notafter.timestamp(),
        "keyinfo": cert.keyinfo,
        "organization": cert.organization,
        "issuer": cert.issuer,
        "subject": cert.subject,
    }

# See: https://docs.mitmproxy.org/stable/api/mitmproxy/connection.html#Connection
def connectionToDict(conn: Connection | None):
    if conn is None:
        return None
    return {
        "id": conn.id,
        "state": conn.state.name,
        "transportProtocol": conn.transport_protocol,
        "peername": conn.peername,
        "sockname": conn.sockname,
        "error": conn.error,
        "tls": conn.tls,
        "certificateList": [certToDict(c) for c in list(conn.certificate_list)],
        "cipher": conn.cipher,
        "ciperList": list(conn.cipher_list),
        "tlsVersion": conn.tls_version,
        "sni": conn.sni,
        "timestampStart": conn.timestamp_start,
        "timestampEnd": conn.timestamp_end,
        "timestampTlsSetup": conn.timestamp_tls_setup,
        "connected": conn.connected,
        "tlsEstablished": conn.tls_established,
    }

# See: https://docs.mitmproxy.org/stable/api/mitmproxy/connection.html#Client
def clientToDict(client: Client | None):
    if client is None:
        return None
    return {
        **connectionToDict(client),
        "mitmCertificate": certToDict(client.mitmcert),
        "proxyMode": client.proxy_mode.full_spec,
    }

# See: https://docs.mitmproxy.org/stable/api/mitmproxy/connection.html#Server
def serverToDict(server: Server | None):
    if server is None:
        return None
    return {
        **connectionToDict(server),
        "address": server.address,
        "timestampTcpSetup": server.timestamp_tcp_setup,
        "via": server.via,
    }

# See: https://docs.mitmproxy.org/stable/api/mitmproxy/tls.html#TlsData
def tlsDataToDict(data: TlsData | None):
    if data is None:
        return None
    return {
        # These are our convenience aliases, while the properties below are as output by mitmproxy directly.
        "clientAddress": human.format_address(data.context.client.peername),
        # That's the format that mitmproxy uses in its errors messages, see:
        # https://github.com/mitmproxy/mitmproxy/blob/1cb0cb1afdaaf006529beea5301362696530cd5f/mitmproxy/proxy/layers/tls.py#L613-L616
        "serverAddress": data.conn.sni or human.format_address(data.context.server.address),

        "client": clientToDict(data.context.client),
        "server": serverToDict(data.context.server),
        "isDtls": data.is_dtls
    }

# See: https://github.com/mitmproxy/mitmproxy/blob/c34c86dd906befe0b999a4344caded587637fe01/mitmproxy/proxy/mode_servers.py#L172-L180,
# https://github.com/mitmproxy/mitmproxy/blob/c34c86dd906befe0b999a4344caded587637fe01/mitmproxy/proxy/mode_servers.py#L434
def proxyserverToDict(proxyserver: Proxyserver | None):
    if proxyserver is None:
        return None
    return {
        "isRunning": proxyserver.is_running,
        "servers": [{
            "type": s.mode.type_name,
            "description": s.mode.description,
            "fullSpec": s.mode.full_spec,
            "isRunning": s.is_running,
            "lastException": str(s.last_exception) if s.last_exception else None,
            "listenAddrs": s.listen_addrs,
            "wireguardConf": s.client_conf() if isinstance(s, WireGuardServerInstance) else None,
        } for s in proxyserver.servers]
    }


addons = [IpcEventRelay()]
