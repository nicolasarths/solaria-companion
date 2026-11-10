let sseClients = [];

function adicionarCliente(res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Connection": "keep-alive"
  });
  sseClients.push(res);
}

function removerCliente(res) {
  sseClients = sseClients.filter((c) => c !== res);
}

function notificarRecarregamento() {
  sseClients.forEach((client) => client.write("data: reload\n\n"));
}

const SCRIPT_LIVE_RELOAD = `
<script>
  (function() {
    const sse = new EventSource('/livereload');
    sse.onmessage = () => {
      console.log('⚡ [Solaria Dev] Atualização salva. Recarregando...');
      location.reload();
    };
  })();
</script>
</body>`;

module.exports = {
  adicionarCliente,
  removerCliente,
  notificarRecarregamento,
  SCRIPT_LIVE_RELOAD
};