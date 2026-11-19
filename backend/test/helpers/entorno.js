// Entorno determinista para todos los tests: zona horaria fija y bcrypt rápido.
process.env.TZ = 'America/Argentina/Buenos_Aires';
process.env.NODE_ENV = 'test';
process.env.BCRYPT_COSTO = '4';
process.env.JWT_SECRET = 'secreto-de-tests';
