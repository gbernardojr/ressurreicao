require('dotenv').config();

module.exports = {
  firebird: {
    host: process.env.FIREBIRD_HOST || 'localhost',
    port: parseInt(process.env.FIREBIRD_PORT || '3050'),
    database: process.env.FIREBIRD_DATABASE || 'C:\\DadosGilberto\\Bancos\\FACEDOSOL\\RESSURREICAO.GDB',
    user: process.env.FIREBIRD_USER || 'SYSDBA',
    password: process.env.FIREBIRD_PASSWORD || '',
    charset: 'UTF8'
  },
  supabase: {
    url: process.env.SUPABASE_URL || 'https://pfzulktbhivfkfzuvztd.supabase.co',
    key: process.env.SUPABASE_KEY || ''
  },
  api: {
    port: parseInt(process.env.API_PORT || '3000')
  },
  sync: {
    intervalMinutes: parseInt(process.env.SYNC_INTERVAL || '30'),
    batchSize: parseInt(process.env.SYNC_BATCH_SIZE || '100')
  }
};