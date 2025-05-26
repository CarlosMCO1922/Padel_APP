// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const protect = async (req, res, next) => {
  let token;

  // Verifica se o token está no header 'Authorization' e começa com 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extrai o token (remove 'Bearer ')
      token = req.headers.authorization.split(' ')[1];

      // Verifica e decodifica o token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Anexa os dados do utilizador (sem a password) ao 'req'
      // Isto permite que as rotas seguintes saibam quem fez o pedido
      req.user = await prisma.trainer.findUnique({
          where: { id: decoded.id },
          select: { id: true, email: true, name: true } // Seleciona apenas campos seguros
      });

      if (!req.user) {
          return res.status(401).json({ message: 'Utilizador não encontrado.' });
      }

      next(); // Passa para a próxima função (a rota real)

    } catch (error) {
      console.error('Erro na verificação do token:', error.message);
      return res.status(401).json({ message: 'Não autorizado, token inválido.' });
    }
  }

  // Se não houver 'Authorization' ou não começar com 'Bearer', ou não houver token
  if (!token) {
    return res.status(401).json({ message: 'Não autorizado, sem token.' });
  }
};

module.exports = { protect };