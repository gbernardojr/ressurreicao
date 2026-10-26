const { spawn } = require('child_process');
const path = require('path');
const config = require('../config');

const getConnStr = () => {
  const dbPath = config.firebird.database.replace(/\\/g, '\\\\');
  return `DRIVER={Firebird/InterBase(r) driver};DBNAME=${dbPath};UID=${config.firebird.user};PASSWORD=${config.firebird.password};`;
};

const getConnection = () => {
  return {
    query: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        const ps32 = path.join(process.env.WINDIR, 'SysWOW64', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
        const connStr = getConnStr();
        
        const command = `
          [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
          $connStr = "${connStr}"
          $conn = New-Object System.Data.Odbc.OdbcConnection($connStr)
          $conn.Open()
          $cmd = New-Object System.Data.Odbc.OdbcCommand("${sql.replace(/"/g, '`"')}", $conn)
          
          $columns = @()
          $rows = @()
          
          $reader = $cmd.ExecuteReader()
          for ($i = 0; $i -lt $reader.FieldCount; $i++) { $columns += $reader.GetName($i) }
          while ($reader.Read()) {
            $row = @{}
            for ($i = 0; $i -lt $reader.FieldCount; $i++) { $row[$columns[$i]] = $reader[$i] }
            $rows += $row
          }
          
          $conn.Close()
          
          @{ columns = $columns; rows = $rows } | ConvertTo-Json -Depth 10
        `;
        
        const ps = spawn(ps32, ['-ExecutionPolicy', 'Bypass', '-Command', command], {
          windowsHide: true
        });
        
        let result = '';
        let error = '';
        
        ps.stdout.on('data', (data) => {
          result += data.toString();
        });
        
        ps.stderr.on('data', (data) => {
          error += data.toString();
        });
        
        ps.on('close', (code) => {
          // Propagar erro do stderr mesmo que o exit code seja 0
          // (o PowerShell pode capturar exceções .NET e retornar 0 com resultado vazio)
          if (error && error.trim()) {
            // Verificar se há erros reais (não apenas avisos/informações)
            const isRealError = error.includes('Exception') || 
                                error.includes('Erro') || 
                                error.includes('Error') ||
                                error.includes('falhou') ||
                                error.includes('failed');
            if (isRealError) {
              reject(new Error(`PowerShell error: ${error.trim().substring(0, 500)}`));
              return;
            }
          }
          
          if (code !== 0) {
            reject(new Error(error || `Process exited with code ${code}`));
            return;
          }
          
          try {
            const parsed = JSON.parse(result);
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Failed to parse result: ${result.substring(0, 200)} - ${e.message}`));
          }
        });
      });
    }
  };
};

const query = async (sql, params = []) => {
  const conn = getConnection();
  const result = await conn.query(sql, params);
  return result.rows || [];
};

const executeNonQuery = async (sql) => {
  return new Promise((resolve, reject) => {
    const ps32 = path.join(process.env.WINDIR, 'SysWOW64', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    const connStr = getConnStr();
    const escapedSql = sql.replace(/"/g, '`"');

    const command = `
      [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
      $connStr = "${connStr}"
      $conn = New-Object System.Data.Odbc.OdbcConnection($connStr)
      $conn.Open()
      $cmd = New-Object System.Data.Odbc.OdbcCommand("${escapedSql}", $conn)
      $rows = $cmd.ExecuteNonQuery()
      $conn.Close()
      $rows | ConvertTo-Json
    `;

    const ps = spawn(ps32, ['-ExecutionPolicy', 'Bypass', '-Command', command], {
      windowsHide: true
    });

    let result = '';
    let error = '';

    ps.stdout.on('data', (data) => {
      result += data.toString();
    });

    ps.stderr.on('data', (data) => {
      error += data.toString();
    });

    ps.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(error || `Process exited with code ${code}`));
        return;
      }

      try {
        const parsed = JSON.parse(result.trim());
        resolve(parsed);
      } catch (e) {
        reject(new Error(`Failed to parse result: ${result} - ${e.message}`));
      }
    });
  });
};

const execute = async (sql, params = []) => {
  return query(sql, params);
};

const testConnection = async () => {
  try {
    const result = await query('SELECT COUNT(*) as TOTAL FROM RECEBER');
    console.log('✅ Firebird conectado via ODBC com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar no Firebird:', error.message);
    return false;
  }
};

const closePool = () => {
  console.log('Conexão Firebird encerrada');
};

module.exports = {
  query,
  execute,
  executeNonQuery,
  testConnection,
  closePool
};
