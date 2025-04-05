const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// SQL Server Configuration
const dbConfig = {
  user: 'prakhar@prakharvs',
  password: 'Singha@321',
  server: 'prakharvs.database.windows.net',
  database: 'Prakhar',
  port: 1433,
  options: {
    encrypt: true, // Required for Azure
    trustServerCertificate: false
  }
};

// Connect to SQL and define routes after connection is established
sql.connect(dbConfig).then(pool => {
  console.log('✅ Connected to Azure SQL Server');

  // Create table if not exists
  pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Students')
    BEGIN
      CREATE TABLE Students (
        ID INT IDENTITY PRIMARY KEY,
        Name VARCHAR(100),
        RegNo VARCHAR(50),
        Email VARCHAR(100),
        Phone VARCHAR(20),
        Address VARCHAR(255),
        City VARCHAR(100),
        Department VARCHAR(100),
        Year INT,
        Hobby VARCHAR(255),
        Skills VARCHAR(255)
      )
    END
  `).then(() => console.log('✅ Students table ready.'))
    .catch(err => console.error('❌ Table creation error:', err));

  // Route 1: Add Basic Info
  app.post('/add', async (req, res) => {
    const { name, regno } = req.body;
    try {
      await pool.request()
        .input('name', sql.VarChar, name)
        .input('regno', sql.VarChar, regno)
        .query('INSERT INTO Students (Name, RegNo) VALUES (@name, @regno)');
      res.json({ message: '✅ Student added successfully.' });
    } catch (err) {
      console.error('❌ Add Error:', err);
      res.status(500).json({ error: 'Failed to add student.' });
    }
  });

  // Route 2: Update Department
  app.post('/department', async (req, res) => {
    const { dept, year } = req.body;
    console.log("🛠 Incoming department data:", req.body);

    if (!dept || isNaN(year) || year < 1 || year > 6) {
      console.log("❌ Validation Failed:", { dept, year });
      return res.status(400).json({ error: "Invalid department or year." });
    }

    try {
      const result = await pool.request()
        .input('dept', sql.VarChar, dept)
        .input('year', sql.Int, year)
        .query(`
          UPDATE Students SET 
            Department = @dept, Year = @year
          WHERE ID = (SELECT MAX(ID) FROM Students)
        `);
      console.log("✅ Department updated:", result.rowsAffected);
      res.json({ message: "✅ Department updated." });
    } catch (err) {
      console.error("❌ Department Update Error:", err);
      res.status(500).json({ error: "Failed to update department." });
    }
  });

  // Route 3: Update Email and Phone
  app.post('/update', async (req, res) => {
    const { email, phone } = req.body;

    if (!email || !phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: "Invalid email or phone." });
    }

    try {
      await pool.request()
        .input('email', sql.VarChar, email)
        .input('phone', sql.VarChar, phone)
        .query(`
          UPDATE Students SET 
            Email = @email, Phone = @phone
          WHERE ID = (SELECT MAX(ID) FROM Students)
        `);
      res.json({ message: "✅ Contact info updated." });
    } catch (err) {
      console.error("❌ Contact Update Error:", err);
      res.status(500).json({ error: "Failed to update contact info." });
    }
  });

  // Route 4: Update Hobbies and Skills
  app.post('/skills', async (req, res) => {
    const { hobby, skills } = req.body;

    if (!hobby || !skills) {
      return res.status(400).json({ error: "Missing hobby or skills." });
    }

    try {
      await pool.request()
        .input('hobby', sql.VarChar, hobby)
        .input('skills', sql.VarChar, skills)
        .query(`
          UPDATE Students SET 
            Hobby = @hobby, Skills = @skills
          WHERE ID = (SELECT MAX(ID) FROM Students)
        `);
      res.json({ message: '✅ Skills saved successfully.' });
    } catch (err) {
      console.error('❌ Skills Error:', err);
      res.status(500).json({ error: 'Failed to update skills.' });
    }
  });

  // View All Students (Optional)
  app.get('/students', async (req, res) => {
    try {
      const result = await pool.request().query('SELECT * FROM Students');
      res.json(result.recordset);
    } catch (err) {
      console.error("❌ Fetch Error:", err);
      res.status(500).json({ error: "Failed to fetch students." });
    }
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });

}).catch(err => {
  console.error("❌ SQL Connection Failed:", err);
});
