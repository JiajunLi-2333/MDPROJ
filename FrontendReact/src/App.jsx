import './App.css'
import { useState } from 'react'

function App() {
  const [showSearch, setShowSearch] = useState(false)
  const [formData, setFormData] = useState({
    borough: '',
    neighborhood: '',
    houseNumber: '',
    streetName: '',
    postcode: ''
  })

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const params = new URLSearchParams()
    Object.entries(formData).forEach(([key, val]) => { if (val) params.append(key, val) })
    try {
      const res = await fetch(`http://localhost:3001/search?${params.toString()}`)
      const data = await res.json()
      if (data.length > 0) {
        const cols = Object.keys(data[0]);
        const headerRow = `<tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr>`;
        const bodyRows = data.map(r => `
          <tr>
            ${cols.map(c => c === 'building_id'
              ? `<td><a href="#" onclick="openViolations(${r[c]});return false;">${r[c]}</a></td>`
              : `<td>${r[c]}</td>`
            ).join('')}
          </tr>
        `).join('');
        const bgUrl = window.location.origin + '/background.jpg';
        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Search Results</title>
  <script>
    async function openViolations(buildingId) {
      const res = await fetch(\`http://localhost:3001/violations?buildingId=\${buildingId}\`);
      const data = await res.json();
      if (!data.length) return alert('No violations found');
      const cols = Object.keys(data[0]);
      const header = \`<tr>\${cols.map(c => \`<th>\${c}</th>\`).join('')}</tr>\`;
      const rows = data.map(r => \`<tr>\${cols.map(c => \`<td>\${r[c]}</td>\`).join('')}</tr>\`).join('');
      const scriptBg = window.location.origin + '/background.jpg';
      const vHtml = \`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Violations</title><style>
        body { font-family: Arial, sans-serif; margin:20px; }
        h1 { text-align:center; color:#333; }
        table { width:100%; border-collapse:collapse; margin-top:20px; box-shadow:0 2px 8px rgba(0,0,0,0.1); }
        th, td { border:1px solid #ccc; padding:10px; text-align:left; }
        th { background-color:#61dafb; color:#000; font-size:1.1rem; }
        tr:nth-child(even) { background-color:#e9f7fb; }
      </style></head><body><h1>Violations for Building \${buildingId}</h1><table>\${header}\${rows}</table></body></html>\`;
      const win2 = window.open(); win2.document.write(vHtml); win2.document.close();
    }
  </script>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { text-align: center; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
    th { background-color: #61dafb; color: #000; font-size: 1.1rem; }
    tr:nth-child(even) { background-color: #e9f7fb; }
  </style>
</head>
<body>
  <h1>Search Results</h1>
  <table>
    ${headerRow}
          ${bodyRows}
  </table>
</body>
</html>`;
        const win = window.open();
        win.document.write(html);
        win.document.close();
      } else {
        alert('No results found');
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    showSearch ? (
      <div className="search">
        <h2>Search for a Property</h2>
        <form onSubmit={handleSubmit}>
          <div className="inputs-row">
            <div className="left-group">
              <label>
                Borough:
                <select name="borough" value={formData.borough} onChange={handleChange}>
                  <option value="">Select Borough</option>
                  <option value="Manhattan">Manhattan</option>
                  <option value="Bronx">Bronx</option>
                  <option value="Brooklyn">Brooklyn</option>
                  <option value="Queens">Queens</option>
                  <option value="Staten Island">Staten Island</option>
                </select>
              </label>
              <label>
                Neighborhood:
                <input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleChange} />
              </label>
            </div>
            <div className="right-group">
              <fieldset>
                <label>
                  House Number:
                  <input type="text" name="houseNumber" value={formData.houseNumber} onChange={handleChange} />
                </label>
                <label>
                  Street Name:
                  <input type="text" name="streetName" value={formData.streetName} onChange={handleChange} />
                </label>
                <label>
                  Postcode:
                  <input type="text" name="postcode" value={formData.postcode} onChange={handleChange} />
                </label>
              </fieldset>
            </div>
          </div>
          <button type="submit">Submit</button>
        </form>
      </div>
    ) : (
      <div className="welcome">
        <h1>FindHome: Your NYC Housing Violations Analyzer</h1>
        <p>Welcome! Search and find housing violations in your area.</p>
        <button onClick={() => setShowSearch(true)}>Start Search</button>
      </div>
    )
  )
}

export default App
