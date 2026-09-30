require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const clientsRoutes = require('./routes/clients.routes');
const productsRoutes = require('./routes/products.routes');
const companiesRoutes = require('./routes/companies.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const suppliersRoutes = require('./routes/suppliers.routes');
const purchasesRoutes = require('./routes/purchases.routes');
const salesRoutes = require('./routes/sales.routes');
const settingsRoutes = require('./routes/settings.routes');
const requireAuth = require('./middleware/auth.middleware');
const usersRoutes = require('./routes/users.routes');
const projectsRoutes = require('./routes/projects.routes');
const invoicesRoutes = require('./routes/invoices.routes');
const paymentsRoutes = require('./routes/payments.routes');

const app = express();
const PORT = process.env.PORT || 4000;

// Autorise uniquement ton frontend à appeler ce backend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
  })
);

app.use(express.json());

// Route de vérification rapide que le serveur tourne (pas protégée)
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Backend opérationnel' });
});

// Route de connexion (pas protégée, sinon impossible de se connecter la première fois)
app.use('/api/auth', authRoutes);

// À partir d'ici, toutes les routes exigent un jeton valide (requireAuth)
app.use('/api/clients', requireAuth, clientsRoutes);
app.use('/api/products', requireAuth, productsRoutes);
app.use('/api/companies', requireAuth, companiesRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/suppliers', requireAuth, suppliersRoutes);
app.use('/api/purchases', requireAuth, purchasesRoutes);
app.use('/api/sales', requireAuth, salesRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);
app.use('/api/settings/users', requireAuth, usersRoutes);
app.use('/api/projects', requireAuth, projectsRoutes);
app.use('/api/invoices', requireAuth, invoicesRoutes);
app.use('/api/payments', requireAuth, paymentsRoutes);

app.listen(PORT, () => {
  console.log(` Backend démarré sur http://localhost:${PORT}`);
  console.log(`   Test rapide : http://localhost:${PORT}/api/health`);
});