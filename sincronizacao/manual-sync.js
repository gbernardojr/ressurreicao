const { runSync } = require('./src/index');
const fb = require('./src/database/firebird');

runSync()
  .then(() => {
    console.log('\nSincronizacao manual concluida.');
    fb.closePool();
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nErro na sincronizacao manual:', error.message);
    fb.closePool();
    process.exit(1);
  });
