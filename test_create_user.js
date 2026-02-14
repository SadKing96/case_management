
const axios = require('axios');

async function testCreateUser() {
    try {
        const timestamp = Date.now();
        const userData = {
            name: `Test User ${timestamp}`,
            email: `test${timestamp}@example.com`,
            role: 'User,Module:Boards',
            managerId: '',
            password: 'password123'
        };

        console.log('Sending request:', userData);

        const response = await axios.post('http://localhost:3001/api/v1/users', userData, {
            headers: {
                // Mock auth headers if needed, based on middleware
                'Authorization': 'Bearer mock-token'
            }
        });

        console.log('Response status:', response.status);
        console.log('Response body:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.log('Error response:', error.response.data);
        }
    }
}

testCreateUser();
