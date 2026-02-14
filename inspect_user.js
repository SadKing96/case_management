
const axios = require('axios');

async function inspectUser() {
    try {
        // Authenticate (mock)
        const response = await axios.get('http://localhost:3001/api/v1/users', {
            headers: { 'Authorization': 'Bearer mock-token' }
        });

        const users = response.data;
        const gtUser = users.find(u => u.name === 'gt' || u.name.includes('gt'));

        if (gtUser) {
            console.log('User found:', gtUser.name);
            console.log('Roles raw:', gtUser.roles);
            console.log('Roles type:', typeof gtUser.roles);
            console.log('Is Array?', Array.isArray(gtUser.roles));
            if (Array.isArray(gtUser.roles)) {
                gtUser.roles.forEach((r, i) => {
                    console.log(`Role [${i}]: "${r}"`);
                });
            }
        } else {
            console.log('User "gt" not found. Listing all names:');
            users.forEach(u => console.log(u.name));
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

inspectUser();
