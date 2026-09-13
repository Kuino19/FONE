export async function executeQuery(sql, args = []) {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  
  if (!url || !token) {
    throw new Error("Missing Turso database credentials in Environment Variables.");
  }

  const fetchUrl = url.replace('libsql://', 'https://') + '/v2/pipeline';
  
  const mappedArgs = args.map(a => {
    if (a === null || a === undefined) return { type: "null" };
    return { 
      type: (typeof a === 'number' || typeof a === 'boolean') ? 'integer' : 'text', 
      value: String(typeof a === 'boolean' ? (a ? 1 : 0) : a) 
    };
  });

  const response = await fetch(fetchUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        { type: "execute", stmt: { sql, args: mappedArgs } },
        { type: "close" }
      ]
    })
  });
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Turso HTTP Error: ${err}`);
  }
  
  const data = await response.json();
  const result = data.results[0];
  
  if (result.type === 'error') {
    throw new Error(result.error.message);
  }
  
  const cols = result.response.result.cols;
  const rows = result.response.result.rows;
  
  return rows.map(row => {
    const obj = {};
    cols.forEach((col, i) => {
      let val = row[i];
      obj[col.name] = (val && val.type !== 'null') ? val.value : null;
    });
    return obj;
  });
}
