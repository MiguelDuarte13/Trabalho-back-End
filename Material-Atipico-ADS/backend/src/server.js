const app = require('./app');
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Material Atípico em http://localhost:${PORT}/api`));
