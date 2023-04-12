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
        self._sendIpcMessage({"status": "clientConnected", "context": {"address": client.peername} })

    def client_disconnected(self, client):
        self._sendIpcMessage({"status": "clientDisconnected", "context": {"address": client.peername} })

    def tls_failed_client(self, data):
        self._sendIpcMessage({"status": "tlsFailed", "context": {"clientAddress": data.context.client.peername, "serverAddress": data.context.server.address, "error": data.conn.error }})

    def tls_established_client(self, data):
        self._sendIpcMessage({"status": "tlsEstablished", "context": {"clientAddress": data.context.client.peername, "serverAddress": data.context.server.address}})

    def server_changed(self):
        self._sendIpcMessage({"status": "proxyChanged", "servers":  [s.to_json() for s in self.proxyserver.servers]})

addons = [IpcEventRelay()]
