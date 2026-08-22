const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080;

let pastes = [];

app.use(bodyParser.json());
app.use(express.static('views'));

app.get('/api/pastes', (req, res) => {
  res.json(pastes);
});

app.post('/api/paste', (req, res) => {
  const { text } = req.body;
  pastes.push({ id: pastes.length + 1, text });
  res.json({ success: true, id: pastes.length });
});

app.listen(PORT, () => {
  console.log(`Pastebin running on port ${PORT}`);
});
