async function createAdmin() {
  try {
    const response = await fetch('http://localhost:3001/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Demo User",
        email: "demo@rakfort.com",
        password: "governance.demo@Rakfort",
        role: "admin"
      })
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdmin();
