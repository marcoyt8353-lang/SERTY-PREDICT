// Vercel serverless function: GET /api/history?id=XXXX
// Lee el historial publico de online-dice.com/verify/ID y devuelve los rolls (del mas viejo al mas nuevo)
module.exports = async (req, res) => {
  const id = String(req.query.id || '');
  if (!/^[a-zA-Z0-9]{1,32}$/.test(id)) {
    return res.status(400).json({ error: 'ID invalido. Solo letras y numeros.' });
  }
  try {
    const r = await fetch(`https://www.online-dice.com/verify/${id}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    if (!r.ok) {
      return res.status(502).json({
        error: `online-dice.com respondio ${r.status}. Es probable que el sitio bloquee peticiones desde servidores.`
      });
    }
    const html = await r.text();
    const colors = [...html.matchAll(/color:\s*([a-z]+)\s*!important;?['"]\s*class=['"]df-solid/gi)]
      .map(m => m[1].toLowerCase());
    const rows = [];
    for (let i = 0; i + 4 <= colors.length; i += 4) rows.push(colors.slice(i, i + 4));
    res.setHeader('Cache-Control', 'no-store');
    if (!rows.length) {
      const own = /cannot verify your own/i.test(html);
      return res.status(200).json({
        rows: [],
        message: own ? 'El sitio dice que no puedes verificar tu propio ID.' : 'No hay historial para ese ID.'
      });
    }
    return res.status(200).json({ rows: rows.reverse() });
  } catch (e) {
    return res.status(502).json({ error: 'No se pudo conectar con online-dice.com.' });
  }
};
